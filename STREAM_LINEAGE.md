# Stream Lineage — Implementation & Confluent Cloud Testing Guide

## Overview

Stream Lineage visually traces every data flow in the platform — from **producers and source connectors**, through **Kafka topics**, **Flink SQL / ksqlDB processors**, **AI agents**, to **consumers and sink connectors** — exactly the way Confluent Cloud's Stream Lineage feature works.

This document explains how the feature is implemented in SignalTwinAI and how to verify it end-to-end on Confluent Cloud.

---

## Architecture

```
Worker / Generators                   Kafka Topics                    API / Processors
────────────────────     ──────────────────────────────────     ────────────────────────
order-generator ──────►  retail.orders.raw            ──────►  Flink: validate
payment-generator ────►  retail.payments.raw          ──────►  Flink: validate
support-generator ────►  retail.support.raw           ──────►  Flink: sentiment
shipment-generator ───►  retail.shipments.raw         ──────►  Flink: delay detect
customer-generator ───►  retail.customers.raw         ──────►  Flink: lookup
                              │
                              ▼
                         retail.orders.clean
                         retail.payments.clean
                         retail.customer_360.enriched  ──────►  Risk Scorer (AI Agent)
                              │
                              ▼
                         retail.risk.signals            ──────►  AI Recommendation Engine
                              │
                              ▼
                         retail.recommendations.decisions  ──►  API State / SSE / Dashboard
                              │
                              ▼
                         retail.inference.audit
```

Each arrow in the above diagram corresponds to a `LineageEdge` in the domain definition. Every topic is a `LineageNode`. The **Stream Lineage** page renders this graph live.

---

## Data Model

### `LineageNode` (packages/core/src/types.ts)

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Kafka topic name (used as the canonical identifier) |
| `layer` | `string` | `raw` \| `curated` \| `enriched` \| `signals` \| `decisions` \| `actions` \| `audit` |
| `domain` | `string` | `retail` \| `fleet` \| `finguard` \| … |
| `nodeType` | `LineageNodeType` | `producer` \| `source_connector` \| `topic` \| `flink_job` \| `ai_agent` \| `consumer` \| `sink_connector` |
| `label` | `string?` | Human-friendly label (defaults to the last two parts of the topic name) |

### `TopicStats` — live throughput

| Field | Type | Description |
|---|---|---|
| `topic` | `string` | Topic name |
| `messagesIn` | `number` | Cumulative count since API start |
| `msgPerSec` | `number` | Rolling 10-second window |
| `consumerGroups` | `{ groupId, lag }[]` | Consumer-group lag per group |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/governance/lineage` | Full cross-domain lineage graph (nodes + edges) |
| `GET` | `/governance/lineage/:domain` | Domain-scoped lineage |
| `GET` | `/governance/lineage/stats` | Live per-topic throughput snapshot (JSON) |
| `GET` | `/governance/lineage/stream` | SSE stream — `lineage-msg` per Kafka message + `lineage-stats` every 5 s |

### SSE Event Format

```
event: lineage-msg
data: {"topic":"retail.orders.raw","ts":1718012345678}

event: lineage-stats
data: {"topics":[{"topic":"retail.orders.raw","messagesIn":42,"msgPerSec":2.1,...}],"generatedAt":1718012350000}
```

---

## UI — Stream Lineage Page

### Routes

| URL | Description |
|---|---|
| `/retail/stream-lineage` | Stream Lineage for the Retail domain |
| `/fleet/stream-lineage` | Stream Lineage for the Fleet domain |
| Governance → "Stream Lineage" tab | Cross-domain or domain-filtered view |

### Features

- **Live SVG canvas** — nodes laid out by layer column (Raw → Curated → Enriched → Signals → Decisions → Actions → Audit)
- **Animated edges** — edges pulse green for 3 seconds after a message flows through them
- **Node-type icons** — producers ▲, topics ⬭, Flink jobs ◆, AI agents ●, consumers ▷, connectors ■
- **Node detail panel** — click any node to see upstream/downstream edges, processor labels, live msg/s, and consumer-group lag
- **Throughput table** — sorted by msg/s, highlights active topics in green
- **Domain filter** — switch between All / Retail / Fleet
- **LIVE / OFFLINE indicator** — shows SSE connection state

---

## Implementation Files

| File | Purpose |
|---|---|
| `packages/core/src/types.ts` | `LineageNode`, `LineageEdge`, `TopicStats`, `LineageStatsResponse` types |
| `packages/core/src/governance.ts` | `getLineageForDomain`, `getCrossdomainLineage` |
| `packages/core/src/definitions/retail.ts` | Retail lineage nodes + edges |
| `packages/core/src/definitions/fleet.ts` | Fleet lineage nodes + edges |
| `apps/api/src/services/lineage-tracker.ts` | In-process message counter, rolling msg/s, consumer-group lag |
| `apps/api/src/services/sse-manager.ts` | `lineageSSE` SSE channel |
| `apps/api/src/services/kafka-consumer.ts` | Calls `lineageTracker.record(topic)` + broadcasts to `lineageSSE` |
| `apps/api/src/routes/governance.ts` | `/governance/lineage/stats` + `/governance/lineage/stream` endpoints |
| `apps/dashboard/src/pages/StreamLineagePage.tsx` | Full live Stream Lineage UI |
| `apps/dashboard/src/pages/GovernancePage.tsx` | Added "Stream Lineage" tab |
| `apps/dashboard/src/App.tsx` | Added routes + nav links |
| `test-stream-lineage.js` | E2E test script |

---

## Confluent Cloud — Testing the Full Flow

### Step 1 — Configure credentials

```bash
# .env
USE_CONFLUENT=cloud
CONFLUENT_BOOTSTRAP_SERVERS=pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
CONFLUENT_API_KEY=your-key
CONFLUENT_API_SECRET=your-secret
CONFLUENT_SCHEMA_REGISTRY_URL=https://psrc-xxxxx.us-east-1.aws.confluent.cloud
CONFLUENT_SCHEMA_REGISTRY_API_KEY=your-sr-key
CONFLUENT_SCHEMA_REGISTRY_API_SECRET=your-sr-secret
```

### Step 2 — Create topics in Confluent Cloud

The topics below are the ones that appear as lineage nodes. Create them with **3 partitions** each:

#### Retail topics
```bash
confluent kafka topic create retail.orders.raw            --partitions 3
confluent kafka topic create retail.payments.raw          --partitions 3
confluent kafka topic create retail.support.raw           --partitions 3
confluent kafka topic create retail.shipments.raw         --partitions 3
confluent kafka topic create retail.customers.raw         --partitions 3
confluent kafka topic create retail.orders.clean          --partitions 3
confluent kafka topic create retail.payments.clean        --partitions 3
confluent kafka topic create retail.support.clean         --partitions 3
confluent kafka topic create retail.shipments.clean       --partitions 3
confluent kafka topic create retail.customer_360.enriched --partitions 3
confluent kafka topic create retail.risk.signals          --partitions 3
confluent kafka topic create retail.recommendations.decisions --partitions 3
confluent kafka topic create retail.agent_actions.actions --partitions 3
confluent kafka topic create retail.inference.audit       --partitions 3
```

#### Fleet topics
```bash
confluent kafka topic create fleet.telemetry.raw          --partitions 3
confluent kafka topic create fleet.location_updates.raw   --partitions 3
confluent kafka topic create fleet.driver_events.raw      --partitions 3
confluent kafka topic create fleet.order_events.raw       --partitions 3
confluent kafka topic create fleet.route_events.raw       --partitions 3
confluent kafka topic create fleet.coldchain.raw          --partitions 3
confluent kafka topic create fleet.maintenance.raw        --partitions 3
confluent kafka topic create fleet.support_events.raw     --partitions 3
confluent kafka topic create fleet.metrics.live           --partitions 3
confluent kafka topic create fleet.risk.alerts            --partitions 3
confluent kafka topic create fleet.agent.decisions        --partitions 3
confluent kafka topic create fleet.agent.actions          --partitions 3
confluent kafka topic create fleet.audit.log              --partitions 3
```

### Step 3 — Start the application

```bash
npm run dev
```

This starts:
- API on `http://localhost:3001`
- Dashboard on `http://localhost:5173`
- Worker (data generators)

### Step 4 — Run the Stream Lineage test

```bash
node test-stream-lineage.js
```

Expected output:
```
STEP 1 — Fetch baseline lineage stats…
  ✓ Got stats for 27 topics

STEP 2 — Produce test messages to Kafka…
  ✓ Producer connected
  ✓ → retail.orders.raw
  ✓ → retail.payments.raw
  ...

STEP 3 — Listen for SSE lineage events (15 s window)…
[SSE] Connecting to http://localhost:3001/governance/lineage/stream …
  ✓ lineage-msg: retail.orders.raw
  ✓ lineage-msg: retail.payments.raw
  ✓ lineage-msg: retail.risk.signals
  ...

STEP 4 — Verify throughput stats updated…
  ✓ Message count increased: 0 → 10 (+10)

STEP 5 — Live Topic Throughput Summary:
Topic                                      Domain     Layer      Msg In   Msg/s
--------------------------------------------------------------------------------
retail.orders.raw                          retail     raw        1        0.1
retail.payments.raw                        retail     raw        1        0.1
...

STEP 6 — Verify domain lineage endpoints…
  ✓ retail: 12 nodes, 11 edges
  ✓ fleet: 13 nodes, 12 edges
  ✓ cross-domain: 25 nodes, 23 edges
```

### Step 5 — Verify in Confluent Cloud UI

1. Log in to [confluent.cloud](https://confluent.cloud)
2. Go to your cluster → **Stream Lineage** (left nav)
3. You should see topics appearing after `test-stream-lineage.js` produces messages
4. Click any topic node to see producers, consumers, and throughput — this mirrors what SignalTwinAI's `/retail/stream-lineage` page shows

### Step 6 — Watch the live dashboard

Open `http://localhost:5173/retail/stream-lineage` and:

| What to observe | Where |
|---|---|
| Green pulsing edges | Edges animate for 3 s after each message |
| msg/s badges on topic nodes | Appear when throughput > 0 |
| LIVE indicator (top right) | Green = SSE connected |
| Click a topic node | Detail panel shows upstream, downstream, lag |
| Throughput table | Updates every 5 s from SSE stats snapshot |

### Step 7 — Continuous load test

To see the lineage truly alive, keep the worker running and watch messages flow continuously:

```bash
# Terminal 1 — start API
cd apps/api && npm run dev

# Terminal 2 — start worker (continuous data generation)
cd apps/worker && npm run dev

# Terminal 3 — watch stats every 10 s
watch -n 10 'curl -s http://localhost:3001/governance/lineage/stats | node -e "
  const d = JSON.parse(require(\"fs\").readFileSync(\"/dev/stdin\",\"utf8\"));
  d.topics.filter(t=>t.messagesIn>0).forEach(t=>
    console.log(t.topic.padEnd(45), t.messagesIn, t.msgPerSec+\"/s\")
  )"'
```

---

## Adding Lineage for a New Domain

1. **Add nodes and edges** to the domain's `lineage` object in `packages/core/src/definitions/<domain>.ts`:

```typescript
lineage: {
  nodes: [
    { id: 'myapp.events.raw', layer: 'raw', domain: 'myapp', nodeType: 'topic' },
    { id: 'myapp.alerts.signals', layer: 'signals', domain: 'myapp', nodeType: 'topic' },
    // Add producer/consumer/connector nodes too:
    { id: 'myapp.producer.app', layer: 'raw', domain: 'myapp', nodeType: 'producer', label: 'My App' },
  ],
  edges: [
    { from: 'myapp.producer.app', to: 'myapp.events.raw', processor: 'Direct publish' },
    { from: 'myapp.events.raw', to: 'myapp.alerts.signals', processor: 'Flink: threshold check', live: true },
  ],
},
```

2. The new nodes and edges automatically appear in:
   - `GET /governance/lineage`
   - `GET /governance/lineage/myapp`
   - `GET /governance/lineage/stats`
   - The dashboard Governance → Stream Lineage tab

3. No dashboard code changes required for the basic graph.

---

## Extending Live Stats — Consumer Group Lag

The `lineageTracker.setLag(groupId, topic, lag)` method accepts lag values from any source. To populate it from Confluent Cloud's Admin API, add a poller to the API startup:

```typescript
// In apps/api/src/services/lineage-tracker.ts or a new lag-poller.ts
import { createKafkaClient } from '@signaltwin/shared';
import { lineageTracker } from './lineage-tracker.js';

export async function startLagPoller(): Promise<void> {
  const kafka = createKafkaClient();
  const admin = kafka.admin();
  await admin.connect();

  setInterval(async () => {
    try {
      const groups = await admin.listGroups();
      for (const { groupId } of groups.groups) {
        const offsets = await admin.fetchOffsetsByTopicPartition({ groupId });
        for (const { topic, partitions } of offsets) {
          const lag = partitions.reduce((sum, p) => sum + Math.max(0, Number(p.lag ?? 0)), 0);
          lineageTracker.setLag(groupId, topic, lag);
        }
      }
    } catch (_) { /* swallow — admin API may not be available in all modes */ }
  }, 30_000);
}
```

Then call `startLagPoller()` in `apps/api/src/index.ts` (non-blocking, like `startConsumer`).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "OFFLINE" badge in UI | SSE connection failed | Ensure API is running; check CORS |
| No edges animate | Worker not producing to Kafka | Run `cd apps/worker && npm run dev` |
| Stats all zero | API consumer not connected | Check Kafka credentials in `.env` |
| SSE test times out | Kafka topics don't exist yet | Create topics (Step 2 above) |
| Confluent Cloud lineage empty | No data produced | Run `node test-stream-lineage.js` |
| Cross-domain view too crowded | Many domains registered | Use domain filter buttons |

---

## Further Reading

- [Confluent Cloud Stream Lineage docs](https://docs.confluent.io/cloud/current/stream-governance/stream-lineage.html)
- [Confluent Cloud — Monitor Consumer Lag](https://docs.confluent.io/cloud/current/monitoring/monitor-lag.html)
- [KafkaJS Admin Client](https://kafka.js.org/docs/admin)
- `packages/core/src/governance.ts` — lineage graph queries
- `apps/api/src/services/lineage-tracker.ts` — live throughput tracking
