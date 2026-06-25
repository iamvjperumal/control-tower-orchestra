#!/usr/bin/env node

require('dotenv').config();
const { Kafka } = require('kafkajs');

// Confluent Cloud credentials
const BOOTSTRAP_SERVERS = process.env.CONFLUENT_BOOTSTRAP_SERVERS;
const API_KEY = process.env.CONFLUENT_API_KEY;
const API_SECRET = process.env.CONFLUENT_API_SECRET;

if (!BOOTSTRAP_SERVERS || !API_KEY || !API_SECRET) {
  console.error('Error: Missing Confluent Cloud credentials in .env file');
  console.error('Required: CONFLUENT_BOOTSTRAP_SERVERS, CONFLUENT_API_KEY, CONFLUENT_API_SECRET');
  process.exit(1);
}

console.log('Creating topics in Confluent Cloud via Kafka protocol...');
console.log('Bootstrap servers:', BOOTSTRAP_SERVERS);
console.log('');

// Topics to create
const RETAIL_TOPICS = [
  'retail.orders.raw', 'retail.payments.raw', 'retail.support.raw',
  'retail.shipments.raw', 'retail.customers.raw',
  'retail.orders.clean', 'retail.payments.clean',
  'retail.support.clean', 'retail.shipments.clean',
  'retail.customer_360.enriched',
  'retail.risk.signals',
  'retail.recommendations.decisions',
  'retail.agent_actions.actions',
  'retail.inference.audit'
];

const FLEET_TOPICS = [
  'fleet.telemetry.raw', 'fleet.location_updates.raw',
  'fleet.driver_events.raw', 'fleet.order_events.raw',
  'fleet.route_events.raw', 'fleet.coldchain.raw',
  'fleet.maintenance.raw', 'fleet.support_events.raw',
  'fleet.metrics.live', 'fleet.risk.alerts',
  'fleet.agent.decisions', 'fleet.agent.actions',
  'fleet.audit.log'
];

const ALL_TOPICS = [...RETAIL_TOPICS, ...FLEET_TOPICS];

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'signaltwin-topic-creator',
  brokers: BOOTSTRAP_SERVERS.split(','),
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: API_KEY,
    password: API_SECRET
  }
});

async function createTopics() {
  const admin = kafka.admin();
  
  try {
    console.log('Connecting to Confluent Cloud...');
    await admin.connect();
    console.log('✅ Connected successfully\n');

    console.log(`Creating ${ALL_TOPICS.length} topics...\n`);

    // Create topics
    const topicConfigs = ALL_TOPICS.map(topic => ({
      topic: topic,
      numPartitions: 3,
      replicationFactor: 3
    }));

    const result = await admin.createTopics({
      topics: topicConfigs,
      waitForLeaders: true
    });

    if (result) {
      console.log('✅ Topics created successfully!\n');
    } else {
      console.log('⚠️  Some topics may already exist\n');
    }

    // List all topics to verify
    console.log('Verifying topics...');
    const topics = await admin.listTopics();
    
    console.log('\n📋 Topics in cluster:');
    const createdTopics = topics.filter(t => ALL_TOPICS.includes(t));
    const missingTopics = ALL_TOPICS.filter(t => !topics.includes(t));
    
    console.log(`\n✅ Created/Existing (${createdTopics.length}/${ALL_TOPICS.length}):`);
    createdTopics.forEach(t => console.log(`   ✓ ${t}`));
    
    if (missingTopics.length > 0) {
      console.log(`\n❌ Missing (${missingTopics.length}):`);
      missingTopics.forEach(t => console.log(`   ✗ ${t}`));
    }

    console.log('\n✨ Topic creation complete!');
    console.log('\nView in Confluent Cloud UI:');
    console.log('https://confluent.cloud/environments\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.type) {
      console.error('Error type:', error.type);
    }
    process.exit(1);
  } finally {
    await admin.disconnect();
  }
}

createTopics().catch(console.error);

// Made with Bob
