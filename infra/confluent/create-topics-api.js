#!/usr/bin/env node

require('dotenv').config();
const https = require('https');

// Confluent Cloud credentials
const BOOTSTRAP_SERVERS = process.env.CONFLUENT_BOOTSTRAP_SERVERS;
const API_KEY = process.env.CONFLUENT_API_KEY;
const API_SECRET = process.env.CONFLUENT_API_SECRET;
const CLUSTER_ID = process.env.CONFLUENT_CLUSTER_ID;

if (!BOOTSTRAP_SERVERS || !API_KEY || !API_SECRET || !CLUSTER_ID) {
  console.error('Error: Missing Confluent Cloud credentials in .env file');
  console.error('Required: CONFLUENT_BOOTSTRAP_SERVERS, CONFLUENT_API_KEY, CONFLUENT_API_SECRET, CONFLUENT_CLUSTER_ID');
  process.exit(1);
}

// Extract region from bootstrap servers
const regionMatch = BOOTSTRAP_SERVERS.match(/\.([^.]+)\.(aws|gcp|azure)\.confluent\.cloud/);
const REGION = regionMatch ? regionMatch[1] : 'us-east-1';

console.log('Creating topics in Confluent Cloud...');
console.log('Cluster ID:', CLUSTER_ID);
console.log('Region:', REGION);
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

// Confluent Cloud REST API endpoint
const API_HOST = 'api.confluent.cloud';
const API_BASE = `/kafka/v3/clusters/${CLUSTER_ID}`;

function createTopic(topicName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      topic_name: topicName,
      partitions_count: 3,
      replication_factor: 3,
      configs: []
    });

    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');

    const options = {
      hostname: API_HOST,
      port: 443,
      path: `${API_BASE}/topics`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Basic ${auth}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log(`✅ Created topic: ${topicName}`);
          resolve();
        } else if (res.statusCode === 409) {
          console.log(`⚠️  Topic already exists: ${topicName}`);
          resolve();
        } else {
          console.error(`❌ Failed to create topic ${topicName}: ${res.statusCode}`);
          console.error(responseData);
          reject(new Error(`Failed to create topic: ${topicName}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error creating topic ${topicName}:`, error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function createAllTopics() {
  console.log(`Creating ${ALL_TOPICS.length} topics...\n`);
  
  for (const topic of ALL_TOPICS) {
    try {
      await createTopic(topic);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to create topic ${topic}:`, error.message);
    }
  }

  console.log('\n✅ Topic creation complete!');
  console.log(`\nVerify in Confluent Cloud UI:`);
  console.log(`https://confluent.cloud/environments`);
}

createAllTopics().catch(console.error);

// Made with Bob
