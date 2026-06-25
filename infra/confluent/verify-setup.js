#!/usr/bin/env node

require('dotenv').config();
const https = require('https');

// Confluent Cloud credentials
const BOOTSTRAP_SERVERS = process.env.CONFLUENT_BOOTSTRAP_SERVERS;
const API_KEY = process.env.CONFLUENT_API_KEY;
const API_SECRET = process.env.CONFLUENT_API_SECRET;
const CLUSTER_ID = process.env.CONFLUENT_CLUSTER_ID;
const SCHEMA_REGISTRY_URL = process.env.CONFLUENT_SCHEMA_REGISTRY_URL;
const SR_API_KEY = process.env.CONFLUENT_SCHEMA_REGISTRY_API_KEY;
const SR_API_SECRET = process.env.CONFLUENT_SCHEMA_REGISTRY_API_SECRET;

if (!BOOTSTRAP_SERVERS || !API_KEY || !API_SECRET || !CLUSTER_ID) {
  console.error('Error: Missing Confluent Cloud credentials in .env file');
  console.error('Required: CONFLUENT_BOOTSTRAP_SERVERS, CONFLUENT_API_KEY, CONFLUENT_API_SECRET, CONFLUENT_CLUSTER_ID');
  process.exit(1);
}

// Extract region from bootstrap servers
const regionMatch = BOOTSTRAP_SERVERS.match(/\.([^.]+)\.(aws|gcp|azure)\.confluent\.cloud/);
const REGION = regionMatch ? regionMatch[1] : 'us-east-1';

console.log('='.repeat(80));
console.log('CONFLUENT CLOUD VERIFICATION');
console.log('='.repeat(80));
console.log('Cluster ID:', CLUSTER_ID);
console.log('Region:', REGION);
console.log('Schema Registry:', SCHEMA_REGISTRY_URL);
console.log('='.repeat(80));
console.log('');

// Expected topics
const EXPECTED_TOPICS = [
  // Retail topics
  'retail.orders.raw', 'retail.payments.raw', 'retail.support.raw',
  'retail.shipments.raw', 'retail.customers.raw',
  'retail.orders.clean', 'retail.payments.clean',
  'retail.support.clean', 'retail.shipments.clean',
  'retail.customer_360.enriched',
  'retail.risk.signals',
  'retail.recommendations.decisions',
  'retail.agent_actions.actions',
  'retail.inference.audit',
  // Fleet topics
  'fleet.telemetry.raw', 'fleet.location_updates.raw',
  'fleet.driver_events.raw', 'fleet.order_events.raw',
  'fleet.route_events.raw', 'fleet.coldchain.raw',
  'fleet.maintenance.raw', 'fleet.support_events.raw',
  'fleet.metrics.live', 'fleet.risk.alerts',
  'fleet.agent.decisions', 'fleet.agent.actions',
  'fleet.audit.log'
];

// Expected schemas
const EXPECTED_SCHEMAS = [
  'retail.orders.raw-value',
  'retail.payments.raw-value',
  'retail.support.raw-value',
  'retail.shipments.raw-value',
  'retail.customers.raw-value',
  'retail.risk.signals-value',
  'retail.recommendations.decisions-value',
  'fleet.agent.decisions-value'
];

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function listTopics() {
  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
  const options = {
    hostname: 'api.confluent.cloud',
    port: 443,
    path: `/kafka/v3/clusters/${CLUSTER_ID}/topics`,
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    if (response.statusCode === 200 && response.data.data) {
      return response.data.data.map(t => t.topic_name);
    }
    return [];
  } catch (error) {
    console.error('Error listing topics:', error.message);
    return [];
  }
}

async function listSchemas() {
  if (!SCHEMA_REGISTRY_URL || !SR_API_KEY || !SR_API_SECRET) {
    console.log('⚠️  Schema Registry credentials not configured');
    return [];
  }

  const srHost = SCHEMA_REGISTRY_URL.replace('https://', '');
  const auth = Buffer.from(`${SR_API_KEY}:${SR_API_SECRET}`).toString('base64');
  const options = {
    hostname: srHost,
    port: 443,
    path: '/subjects',
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error listing schemas:', error.message);
    return [];
  }
}

async function verify() {
  // Check Topics
  console.log('📋 CHECKING TOPICS...\n');
  const existingTopics = await listTopics();
  
  if (existingTopics.length === 0) {
    console.log('❌ Could not retrieve topics from Confluent Cloud');
    console.log('   Please check your credentials and cluster ID\n');
  } else {
    console.log(`Found ${existingTopics.length} topics in cluster\n`);
    
    const missingTopics = EXPECTED_TOPICS.filter(t => !existingTopics.includes(t));
    const extraTopics = existingTopics.filter(t => !EXPECTED_TOPICS.includes(t) && !t.startsWith('_'));
    
    if (missingTopics.length === 0) {
      console.log('✅ All expected topics exist!\n');
    } else {
      console.log(`⚠️  Missing ${missingTopics.length} topics:\n`);
      missingTopics.forEach(t => console.log(`   - ${t}`));
      console.log('');
    }
    
    if (extraTopics.length > 0) {
      console.log(`ℹ️  Additional topics found (${extraTopics.length}):\n`);
      extraTopics.slice(0, 10).forEach(t => console.log(`   - ${t}`));
      if (extraTopics.length > 10) {
        console.log(`   ... and ${extraTopics.length - 10} more`);
      }
      console.log('');
    }
  }

  console.log('-'.repeat(80));
  
  // Check Schemas
  console.log('\n📝 CHECKING SCHEMAS...\n');
  const existingSchemas = await listSchemas();
  
  if (existingSchemas.length === 0) {
    console.log('❌ Could not retrieve schemas from Schema Registry');
    console.log('   Please check your Schema Registry credentials\n');
  } else {
    console.log(`Found ${existingSchemas.length} schemas in registry\n`);
    
    const missingSchemas = EXPECTED_SCHEMAS.filter(s => !existingSchemas.includes(s));
    const extraSchemas = existingSchemas.filter(s => !EXPECTED_SCHEMAS.includes(s));
    
    if (missingSchemas.length === 0) {
      console.log('✅ All expected schemas exist!\n');
    } else {
      console.log(`⚠️  Missing ${missingSchemas.length} schemas:\n`);
      missingSchemas.forEach(s => console.log(`   - ${s}`));
      console.log('');
    }
    
    console.log('📋 Registered schemas:\n');
    EXPECTED_SCHEMAS.forEach(s => {
      const status = existingSchemas.includes(s) ? '✅' : '❌';
      console.log(`   ${status} ${s}`);
    });
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Topics: ${existingTopics.length} found, ${EXPECTED_TOPICS.length} expected`);
  console.log(`Schemas: ${existingSchemas.length} found, ${EXPECTED_SCHEMAS.length} expected`);
  console.log('='.repeat(80));
  console.log('\n✨ Verification complete!');
  console.log('\nView in Confluent Cloud UI:');
  console.log('https://confluent.cloud/environments\n');
}

verify().catch(console.error);

// Made with Bob
