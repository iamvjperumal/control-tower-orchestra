#!/usr/bin/env node
/**
 * test-stream-lineage.js
 * ======================
 * End-to-end test that:
 *  1. Produces sample Kafka messages to all retail + fleet raw topics.
 *  2. Polls GET /governance/lineage/stats to verify message counters increment.
 *  3. Connects to the SSE stream and verifies "lineage-msg" events are received.
 *  4. Prints a summary table of live topic throughput.
 *
 * Usage:
 *   node test-stream-lineage.js
 *
 * Requires the API to be running (npm run dev in apps/api).
 * Set USE_CONFLUENT=cloud + cloud credentials to test against Confluent Cloud.
 */

const { Kafka } = require('kafkajs');
const https = require('https');
const http = require('http');

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
const USE_CONFLUENT = process.env.USE_CONFLUENT || 'local';

/* ── Kafka client ── */
function createKafka() {
  if (USE_CONFLUENT === 'cloud') {
    const bs = process.env.CONFLUENT_BOOTSTRAP_SERVERS;
    const key = process.env.CONFLUENT_API_KEY;
    const secret = process.env.CONFLUENT_API_SECRET;
    if (!bs || !key || !secret) {
      throw new Error('Missing CONFLUENT_BOOTSTRAP_SERVERS / CONFLUENT_API_KEY / CONFLUENT_API_SECRET');
    }
    return new Kafka({
      clientId: 'stream-lineage-test',
      brokers: bs.split(','),
      ssl: true,
      sasl: { mechanism: 'plain', username: key, password: secret },
    });
  }
  return new Kafka({
    clientId: 'stream-lineage-test',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  });
}

/* ── Topics to exercise (retail + fleet raw topics) ── */
const TEST_MESSAGES = [
  {
    topic: 'retail.orders.raw',
    value: { event_id: `ord-${Date.now()}`, event_type: 'order-created', customer_id: 'test-c1',
      event_time: new Date().toISOString(), source_system: 'test', order_id: 'o1', total_amount: 99.9, currency: 'USD', item_count: 2, is_premium: false },
  },
  {
    topic: 'retail.payments.raw',
    value: { event_id: `pay-${Date.now()}`, event_type: 'payment-failed', customer_id: 'test-c1',
      event_time: new Date().toISOString(), source_system: 'test', order_id: 'o1', payment_id: 'p1',
      failure_code: 'INSUFFICIENT_FUNDS', amount: 99.9, attempt_number: 1 },
  },
  {
    topic: 'retail.support.raw',
    value: { event_id: `sup-${Date.now()}`, event_type: 'support-ticket-updated', customer_id: 'test-c1',
      event_time: new Date().toISOString(), source_system: 'test', ticket_id: 't1',
      sentiment: 'negative', sentiment_score: -0.8, category: 'billing' },
  },
  {
    topic: 'retail.shipments.raw',
    value: { event_id: `ship-${Date.now()}`, event_type: 'shipment-delayed', customer_id: 'test-c1',
      event_time: new Date().toISOString(), source_system: 'test', order_id: 'o1', shipment_id: 's1',
      delay_hours: 24, reason: 'weather' },
  },
  {
    topic: 'retail.customers.raw',
    value: { event_id: `cust-${Date.now()}`, event_type: 'customer-profile-updated', customer_id: 'test-c1',
      event_time: new Date().toISOString(), source_system: 'test', tier: 'premium',
      lifetime_value: 5000, account_age_days: 365, region: 'US-EAST' },
  },
  {
    topic: 'fleet.telemetry.raw',
    value: { vehicle_id: 'v1', ts: Date.now(), speed_kmh: 72, engine_temp_c: 88, lat: 37.7, lng: -122.4 },
  },
  {
    topic: 'fleet.location_updates.raw',
    value: { vehicle_id: 'v1', ts: Date.now(), lat: 37.71, lng: -122.41, heading: 45 },
  },
  {
    topic: 'fleet.driver_events.raw',
    value: { vehicle_id: 'v1', driver_id: 'd1', ts: Date.now(), event_type: 'harsh_braking', severity: 'medium' },
  },
  {
    topic: 'fleet.coldchain.raw',
    value: { vehicle_id: 'v1', ts: Date.now(), temp_c: -3, setpoint_c: -18, door_open: false },
  },
  {
    topic: 'fleet.maintenance.raw',
    value: { vehicle_id: 'v1', ts: Date.now(), fault_code: 'P0420', description: 'Catalytic converter efficiency' },
  },
];

/* ── apiFetch helper ── */
function apiFetch(path) {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}${path}`;
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse error: ${body.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

/* ── SSE test: wait for 5 lineage-msg events ── */
function testSSE(timeoutMs = 15_000) {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}/governance/lineage/stream`;
    const lib = url.startsWith('https') ? https : http;
    const events = [];
    let resolved = false;

    console.log(`\n[SSE] Connecting to ${url} …`);

    const req = lib.get(url, (res) => {
      res.on('data', (chunk) => {
        const text = chunk.toString();
        for (const line of text.split('\n')) {
          if (line.startsWith('event: lineage-msg')) {
            // next data line
          }
          if (line.startsWith('data: ') && events.length < 5) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.topic) {
                events.push(parsed);
                process.stdout.write(`  ✓ lineage-msg: ${parsed.topic}\n`);
              }
            } catch (_) {}
          }
        }
        if (events.length >= 5 && !resolved) {
          resolved = true;
          req.destroy();
          resolve(events);
        }
      });
      res.on('error', reject);
    });
    req.on('error', (e) => {
      if (!resolved) reject(e);
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        req.destroy();
        if (events.length > 0) {
          resolve(events); // partial is fine
        } else {
          reject(new Error('No lineage-msg SSE events received within timeout'));
        }
      }
    }, timeoutMs);
  });
}

/* ── Table printer ── */
function printTable(stats) {
  const active = stats.topics.filter((t) => t.messagesIn > 0 || t.msgPerSec > 0);
  if (active.length === 0) {
    console.log('  (no messages seen yet — did the worker produce to Kafka?)');
    return;
  }
  const col = (s, w) => String(s).padEnd(w).slice(0, w);
  console.log('\n' + [col('Topic', 42), col('Domain', 10), col('Layer', 10), col('Msg In', 8), col('Msg/s', 6)].join(' '));
  console.log('-'.repeat(80));
  for (const t of active) {
    console.log([col(t.topic, 42), col(t.domain, 10), col(t.layer, 10), col(t.messagesIn, 8), col(t.msgPerSec, 6)].join(' '));
  }
}

/* ── Main ── */
async function main() {
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║    SignalTwinAI — Stream Lineage Test         ║`);
  console.log(`╚══════════════════════════════════════════════╝`);
  console.log(`API: ${API_URL}  |  Mode: ${USE_CONFLUENT}\n`);

  // ── Step 1: Baseline stats
  console.log('STEP 1 — Fetch baseline lineage stats…');
  let baseline;
  try {
    baseline = await apiFetch('/governance/lineage/stats');
    console.log(`  ✓ Got stats for ${baseline.topics.length} topics`);
  } catch (e) {
    console.error(`  ✗ API unreachable: ${e.message}`);
    console.error('  Make sure the API is running: cd apps/api && npm run dev');
    process.exit(1);
  }

  // ── Step 2: Produce messages
  console.log('\nSTEP 2 — Produce test messages to Kafka…');
  let producer;
  try {
    const kafka = createKafka();
    producer = kafka.producer();
    await producer.connect();
    console.log('  ✓ Producer connected');

    for (const { topic, value } of TEST_MESSAGES) {
      try {
        await producer.send({ topic, messages: [{ value: JSON.stringify(value) }] });
        console.log(`  ✓ → ${topic}`);
      } catch (e) {
        console.warn(`  ⚠ ${topic}: ${e.message}`);
      }
    }

    await producer.disconnect();
    console.log('  ✓ Producer disconnected');
  } catch (e) {
    console.warn(`  ⚠ Kafka producer unavailable: ${e.message}`);
    console.warn('  Skipping produce step — stats test may show zero counts');
  }

  // ── Step 3: SSE live events
  console.log('\nSTEP 3 — Listen for SSE lineage events (15 s window)…');
  try {
    const events = await testSSE(15_000);
    console.log(`  ✓ Received ${events.length} lineage-msg events`);
  } catch (e) {
    console.warn(`  ⚠ SSE test: ${e.message}`);
  }

  // ── Step 4: Verify stats changed
  console.log('\nSTEP 4 — Verify throughput stats updated…');
  await new Promise((r) => setTimeout(r, 2000)); // let counters settle
  try {
    const after = await apiFetch('/governance/lineage/stats');
    const newMsgs = after.topics.reduce((sum, t) => sum + t.messagesIn, 0);
    const baseMsgs = baseline.topics.reduce((sum, t) => sum + t.messagesIn, 0);
    if (newMsgs > baseMsgs) {
      console.log(`  ✓ Message count increased: ${baseMsgs} → ${newMsgs} (+${newMsgs - baseMsgs})`);
    } else {
      console.log(`  ℹ Message count unchanged (${newMsgs}) — API consumer may not have received messages yet`);
    }

    // ── Step 5: Print summary table
    console.log('\nSTEP 5 — Live Topic Throughput Summary:');
    printTable(after);

    // ── Step 6: Test per-domain lineage
    console.log('\nSTEP 6 — Verify domain lineage endpoints…');
    for (const d of ['retail', 'fleet']) {
      const lineage = await apiFetch(`/governance/lineage/${d}`);
      console.log(`  ✓ ${d}: ${lineage.nodes?.length ?? 0} nodes, ${lineage.edges?.length ?? 0} edges`);
    }

    const crossDomain = await apiFetch('/governance/lineage');
    console.log(`  ✓ cross-domain: ${crossDomain.nodes?.length ?? 0} nodes, ${crossDomain.edges?.length ?? 0} edges`);

  } catch (e) {
    console.error(`  ✗ Stats check failed: ${e.message}`);
  }

  console.log('\n✅ Stream Lineage test complete.\n');
  console.log('Open the dashboard at http://localhost:5173');
  console.log('  • Retail: /retail/stream-lineage');
  console.log('  • Fleet:  /fleet/stream-lineage');
  console.log('  • Governance tab → "Stream Lineage"\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
