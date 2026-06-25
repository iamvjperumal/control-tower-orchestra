#!/usr/bin/env node

/**
 * Confluent Cloud Connection Test Script
 * Tests connectivity to Kafka cluster and Schema Registry
 */

const { Kafka } = require('kafkajs');
const https = require('https');

// Load environment variables
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

async function testKafkaConnection() {
  logSection('Testing Kafka Connection');
  
  const bootstrapServers = process.env.CONFLUENT_BOOTSTRAP_SERVERS;
  const apiKey = process.env.CONFLUENT_API_KEY;
  const apiSecret = process.env.CONFLUENT_API_SECRET;

  log(`Bootstrap Servers: ${bootstrapServers}`, colors.blue);
  log(`API Key: ${apiKey?.substring(0, 8)}...`, colors.blue);

  if (!bootstrapServers || !apiKey || !apiSecret) {
    log('❌ Missing Confluent Cloud credentials', colors.red);
    return false;
  }

  try {
    const kafka = new Kafka({
      clientId: 'confluent-test-client',
      brokers: bootstrapServers.split(','),
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: apiKey,
        password: apiSecret,
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });

    log('Creating admin client...', colors.yellow);
    const admin = kafka.admin();
    
    log('Connecting to Kafka cluster...', colors.yellow);
    await admin.connect();
    log('✅ Successfully connected to Kafka cluster!', colors.green);

    log('\nFetching cluster metadata...', colors.yellow);
    const cluster = await admin.describeCluster();
    log(`Cluster ID: ${cluster.clusterId}`, colors.blue);
    log(`Controller: ${cluster.controller}`, colors.blue);
    log(`Brokers: ${cluster.brokers.length}`, colors.blue);

    log('\nListing topics...', colors.yellow);
    const topics = await admin.listTopics();
    log(`Found ${topics.length} topics:`, colors.blue);
    topics.slice(0, 10).forEach(topic => log(`  - ${topic}`, colors.blue));
    if (topics.length > 10) {
      log(`  ... and ${topics.length - 10} more`, colors.blue);
    }

    await admin.disconnect();
    log('\n✅ Kafka connection test passed!', colors.green);
    return true;
  } catch (error) {
    log(`\n❌ Kafka connection failed: ${error.message}`, colors.red);
    if (error.stack) {
      log(error.stack, colors.red);
    }
    return false;
  }
}

async function testSchemaRegistry() {
  logSection('Testing Schema Registry Connection');

  const schemaRegistryUrl = process.env.CONFLUENT_SCHEMA_REGISTRY_URL;
  const apiKey = process.env.CONFLUENT_SCHEMA_REGISTRY_API_KEY;
  const apiSecret = process.env.CONFLUENT_SCHEMA_REGISTRY_API_SECRET;

  log(`Schema Registry URL: ${schemaRegistryUrl}`, colors.blue);
  log(`API Key: ${apiKey?.substring(0, 8)}...`, colors.blue);

  if (!schemaRegistryUrl || !apiKey || !apiSecret) {
    log('❌ Missing Schema Registry credentials', colors.red);
    return false;
  }

  return new Promise((resolve) => {
    const url = new URL('/subjects', schemaRegistryUrl);
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    log('Connecting to Schema Registry...', colors.yellow);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const subjects = JSON.parse(data);
            log('✅ Successfully connected to Schema Registry!', colors.green);
            log(`\nFound ${subjects.length} registered schemas:`, colors.blue);
            subjects.slice(0, 10).forEach(subject => log(`  - ${subject}`, colors.blue));
            if (subjects.length > 10) {
              log(`  ... and ${subjects.length - 10} more`, colors.blue);
            }
            log('\n✅ Schema Registry connection test passed!', colors.green);
            resolve(true);
          } catch (error) {
            log(`❌ Failed to parse response: ${error.message}`, colors.red);
            resolve(false);
          }
        } else {
          log(`❌ Schema Registry returned status ${res.statusCode}`, colors.red);
          log(`Response: ${data}`, colors.red);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log(`❌ Schema Registry connection failed: ${error.message}`, colors.red);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      log('❌ Schema Registry connection timeout', colors.red);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testProducerConsumer() {
  logSection('Testing Producer/Consumer');

  const bootstrapServers = process.env.CONFLUENT_BOOTSTRAP_SERVERS;
  const apiKey = process.env.CONFLUENT_API_KEY;
  const apiSecret = process.env.CONFLUENT_API_SECRET;

  try {
    const kafka = new Kafka({
      clientId: 'confluent-test-client',
      brokers: bootstrapServers.split(','),
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: apiKey,
        password: apiSecret,
      },
    });

    const testTopic = 'test-connection-topic';
    const testMessage = {
      timestamp: new Date().toISOString(),
      test: 'Confluent Cloud connection test',
    };

    log(`Creating test topic: ${testTopic}...`, colors.yellow);
    const admin = kafka.admin();
    await admin.connect();
    
    try {
      await admin.createTopics({
        topics: [{ topic: testTopic, numPartitions: 1, replicationFactor: 3 }],
      });
      log('✅ Test topic created', colors.green);
    } catch (error) {
      if (error.message.includes('already exists')) {
        log('ℹ️  Test topic already exists', colors.yellow);
      } else {
        throw error;
      }
    }

    log('\nProducing test message...', colors.yellow);
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({
      topic: testTopic,
      messages: [{ value: JSON.stringify(testMessage) }],
    });
    log('✅ Message produced successfully', colors.green);
    await producer.disconnect();

    log('\nConsuming test message...', colors.yellow);
    const consumer = kafka.consumer({ groupId: 'test-group-' + Date.now() });
    await consumer.connect();
    await consumer.subscribe({ topic: testTopic, fromBeginning: true });

    const messageReceived = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 10000);
      
      consumer.run({
        eachMessage: async ({ message }) => {
          clearTimeout(timeout);
          const value = JSON.parse(message.value.toString());
          log(`✅ Message consumed: ${JSON.stringify(value)}`, colors.green);
          resolve(true);
        },
      });
    });

    await consumer.disconnect();
    await admin.disconnect();

    if (messageReceived) {
      log('\n✅ Producer/Consumer test passed!', colors.green);
      return true;
    } else {
      log('\n❌ Failed to consume message within timeout', colors.red);
      return false;
    }
  } catch (error) {
    log(`\n❌ Producer/Consumer test failed: ${error.message}`, colors.red);
    return false;
  }
}

async function main() {
  log('\n🚀 Starting Confluent Cloud Connection Tests', colors.cyan);
  log(`Time: ${new Date().toISOString()}`, colors.blue);

  const results = {
    kafka: false,
    schemaRegistry: false,
    producerConsumer: false,
  };

  // Test Kafka connection
  results.kafka = await testKafkaConnection();

  // Test Schema Registry connection
  results.schemaRegistry = await testSchemaRegistry();

  // Test Producer/Consumer (only if Kafka connection succeeded)
  if (results.kafka) {
    results.producerConsumer = await testProducerConsumer();
  } else {
    log('\n⚠️  Skipping Producer/Consumer test due to Kafka connection failure', colors.yellow);
  }

  // Summary
  logSection('Test Summary');
  log(`Kafka Connection: ${results.kafka ? '✅ PASS' : '❌ FAIL'}`, results.kafka ? colors.green : colors.red);
  log(`Schema Registry: ${results.schemaRegistry ? '✅ PASS' : '❌ FAIL'}`, results.schemaRegistry ? colors.green : colors.red);
  log(`Producer/Consumer: ${results.producerConsumer ? '✅ PASS' : '❌ FAIL'}`, results.producerConsumer ? colors.green : colors.red);

  const allPassed = results.kafka && results.schemaRegistry && results.producerConsumer;
  
  if (allPassed) {
    log('\n🎉 All tests passed! Confluent Cloud is ready to use.', colors.green);
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please check your configuration.', colors.yellow);
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n💥 Unexpected error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

// Made with Bob
