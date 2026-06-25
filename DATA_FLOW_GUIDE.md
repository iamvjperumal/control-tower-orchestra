# CTO Platform: Complete Data Flow Guide

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Seven-Layer Data Flow](#seven-layer-data-flow)
4. [RetailOps Data Flow](#retailops-data-flow)
5. [FleetOps Data Flow](#fleetops-data-flow)
6. [Governance Integration](#governance-integration)
7. [Technology Stack](#technology-stack)
8. [Key Components Reference](#key-components-reference)

---

## Executive Summary

The **CTO (Control Tower Orchestra)** platform implements a sophisticated event-driven architecture where data flows through **seven distinct layers** from ingestion to visualization. This document traces the complete journey of events through the system for both RetailOps and FleetOps use cases.

**Key Characteristics:**
- **Event-Driven**: All data flows through Kafka topics
- **Real-Time**: Sub-second latency from event to dashboard
- **Governed**: Schema Registry, lineage tracking, PII classification
- **AI-Enhanced**: Claude API generates contextual recommendations
- **Multi-Domain**: Pluggable architecture supports multiple use cases

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW LAYERS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. INGESTION        → Mock Generators / External Systems            │
│         ↓                                                             │
│  2. RAW TOPICS       → retail.*.raw / fleet.*.raw (Kafka)           │
│         ↓                                                             │
│  3. STREAM PROCESSING → Flink SQL (validation, enrichment)          │
│         ↓                                                             │
│  4. SIGNAL GENERATION → Risk Scorer (stateful processing)           │
│         ↓                                                             │
│  5. AI LAYER         → Recommendation Engine + Claude API            │
│         ↓                                                             │
│  6. API LAYER        → Kafka Consumer → State Store → SSE           │
│         ↓                                                             │
│  7. VISUALIZATION    → React Dashboard (real-time updates)           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Seven-Layer Data Flow

### Layer 1: Event Generation & Ingestion

**Purpose**: Generate or receive business events from various sources

**Components**:
- **Mock Generators** (`apps/worker/src/generators/`)
  - `scenario-orchestrator.ts` - Coordinates demo scenarios
  - `order-generator.ts` - Creates order events
  - `payment-generator.ts` - Simulates payment failures
  - `shipment-generator.ts` - Generates shipment delays
  - `support-generator.ts` - Creates support tickets
  - `customer-generator.ts` - Seeds customer profiles

**Event Types Generated**:
```typescript
// RetailOps Events
- order-created
- payment-failed
- support-ticket-updated
- shipment-delayed
- customer-profile-updated

// FleetOps Events
- fleet-telemetry
- fleet-route-event
- fleet-coldchain
- fleet-driver-event
- fleet-maintenance
```

**Example Flow**:
```typescript
// Fraud Scenario Orchestration
runFraudScenario('c-1003') {
  1. publishOrder()          → retail.orders.raw
  2. publishPaymentFailure() → retail.payments.raw (attempt 1)
  3. publishPaymentFailure() → retail.payments.raw (attempt 2)
  4. publishShipmentDelay()  → retail.shipments.raw
  5. publishSupportTicket()  → retail.support.raw
}
```

---

### Layer 2: Raw Kafka Topics

**Purpose**: Immutable source-of-truth event storage

**Topic Structure**: `{domain}.{entity}.{layer}`

**RetailOps Topics** (14 total):
```
Raw Layer:
├── retail.orders.raw
├── retail.payments.raw
├── retail.support.raw
├── retail.shipments.raw
└── retail.customers.raw

Curated Layer:
├── retail.orders.clean
├── retail.payments.clean
├── retail.support.clean
└── retail.shipments.clean

Enriched Layer:
└── retail.customer_360.enriched

Signals Layer:
└── retail.risk.signals

Decisions Layer:
└── retail.recommendations.decisions

Actions Layer:
└── retail.agent_actions.actions

Audit Layer:
└── retail.inference.audit
```

**FleetOps Topics** (13 total):
```
Raw Layer:
├── fleet.telemetry.raw
├── fleet.location_updates.raw
├── fleet.driver_events.raw
├── fleet.order_events.raw
├── fleet.route_events.raw
├── fleet.coldchain.raw
├── fleet.maintenance.raw
└── fleet.support_events.raw

Signals Layer:
├── fleet.metrics.live
└── fleet.risk.alerts

Decisions Layer:
└── fleet.agent.decisions

Actions Layer:
└── fleet.agent.actions

Audit Layer:
└── fleet.audit.log
```

**Schema Governance**:
- All topics use Avro schemas registered in Schema Registry
- Compatibility levels enforced (BACKWARD/FORWARD/FULL)
- PII fields are hashed or redacted before storage

---

### Layer 3: Stream Processing (Flink SQL)

**Purpose**: Real-time data validation, standardization, and enrichment

**Location**: `packages/streaming/flink-sql/`

**RetailOps Processing Pipeline**:

```sql
-- 02-clean-orders.sql: Validates and standardizes orders
CREATE TABLE clean_orders AS
SELECT 
  event_id,
  customer_id,
  order_id,
  CAST(total_amount AS DECIMAL(10,2)) AS total_amount,
  COALESCE(is_premium, FALSE) AS is_premium,
  event_time
FROM raw_orders
WHERE total_amount > 0 AND customer_id IS NOT NULL;

-- 04-customer-360.sql: Enriches with cross-domain customer view
CREATE TABLE enriched_customer_360 AS
SELECT
  c.customer_id,
  c.tier,
  COUNT(DISTINCT o.order_id) AS total_orders,
  SUM(o.total_amount) AS lifetime_value
FROM raw_customers c
LEFT JOIN clean_orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.tier;

-- 05-risk-signals.sql: Computes windowed risk scores
CREATE TABLE signals_risk AS
SELECT
  customer_id,
  (
    CASE WHEN payment_failures_10m >= 2 THEN 30 ELSE 0 END +
    CASE WHEN has_premium_delay THEN 20 ELSE 0 END +
    CASE WHEN negative_support_24h > 0 THEN 25 ELSE 0 END +
    CASE WHEN is_vip THEN 10 ELSE 0 END
  ) AS risk_score
FROM (
  -- Windowed aggregations with temporal joins
  SELECT
    c.customer_id,
    COUNT(pf.*) OVER (
      PARTITION BY c.customer_id 
      ORDER BY pf.event_time 
      RANGE BETWEEN INTERVAL '10' MINUTE PRECEDING AND CURRENT ROW
    ) AS payment_failures_10m
    -- ... other windowed metrics
  FROM raw_customers c
  LEFT JOIN clean_payments pf ON c.customer_id = pf.customer_id
)
WHERE risk_score > 0;
```

**Key Flink Capabilities Used**:
- **Temporal Joins**: Join streams with latest dimension data
- **Windowed Aggregations**: Count events in time windows (10m, 24h)
- **Stateful Processing**: Maintain customer state across events
- **Event Time Processing**: Use event timestamps, not processing time

---

### Layer 4: Signal Generation (Risk Scorer)

**Purpose**: Stateful risk scoring with in-memory customer state

**Component**: `apps/worker/src/processors/risk-scorer.ts`

**Processing Flow**:
```typescript
// 1. Consume raw events from multiple topics
consumer.subscribe({
  topics: [
    'retail.orders.raw',
    'retail.payments.raw',
    'retail.support.raw',
    'retail.shipments.raw',
    'retail.customers.raw'
  ]
});

// 2. Maintain in-memory customer state
interface CustomerRiskState {
  customerId: string;
  tier: string;
  paymentFailures: { timestamp: number; code: string }[];
  shipmentDelays: { timestamp: number; orderId: string }[];
  supportEvents: { timestamp: number; sentiment: string }[];
  activeOrders: Map<string, { amount: number; isPremium: boolean }>;
}

// 3. Compute risk score with time windows
function computeRiskScore(state: CustomerRiskState) {
  let score = 0;
  const signals: string[] = [];
  const now = Date.now();
  
  // 10-minute window for payment failures
  const recentFailures = state.paymentFailures.filter(
    f => f.timestamp > now - 10 * 60 * 1000
  );
  if (recentFailures.length >= 2) {
    score += 30;
    signals.push(`${recentFailures.length} payment failures in 10 minutes`);
  }
  
  // Check premium order delays
  for (const delay of state.shipmentDelays) {
    const order = state.activeOrders.get(delay.orderId);
    if (order?.isPremium) {
      score += 20;
      signals.push('shipment delayed for premium order');
      break;
    }
  }
  
  return { score, signals };
}

// 4. Publish risk signal if score > 0
if (score > 0) {
  await publishMessage('retail.risk.signals', customerId, {
    event_id: crypto.randomUUID(),
    customer_id: customerId,
    risk_score: score,
    contributing_signals: signals,
    escalation_required: score > 60
  });
}
```

**Risk Scoring Rules**:
| Condition | Score | Signal |
|-----------|-------|--------|
| 2+ payment failures in 10 minutes | +30 | Potential fraud |
| Shipment delayed for premium order | +20 | Churn risk |
| Negative support event in 24 hours | +25 | Customer dissatisfaction |
| Refund request after shipment issue | +15 | Service recovery needed |
| VIP customer | +10 | High-value retention priority |
| **Total > 60** | — | **Escalate to human review** |

---

### Layer 5: AI Recommendation Engine

**Purpose**: Generate contextual recommendations using Claude API

**Component**: `apps/worker/src/processors/recommendation-engine.ts`

**Processing Flow**:

```typescript
// 1. Consume risk signals
consumer.subscribe({ topics: ['retail.risk.signals'] });

// 2. Determine recommended action
function determineAction(signal: RiskSignalGenerated): RecommendedAction {
  const signals = signal.contributing_signals.join(' ').toLowerCase();
  
  if (signals.includes('fraud') || signals.includes('payment failure')) {
    return 'ESCALATE_FRAUD_REVIEW';
  }
  if (signals.includes('vip') && signals.includes('negative')) {
    return 'VIP_RETENTION';
  }
  if (signals.includes('refund')) {
    return 'REFUND_APPROVE';
  }
  return 'MONITOR';
}

// 3. Generate AI explanation via Claude
async function generateExplanation(context) {
  const prompt = `
You are a retail operations AI assistant. Analyze this customer risk scenario:

Customer: ${context.customerId}
Risk Score: ${context.riskScore}
Contributing Signals:
${context.contributingSignals.map(s => `- ${s}`).join('\n')}

Recommended Action: ${context.determinedAction}

Provide a concise explanation (2-3 sentences) and confidence level (0.0-1.0).
Note: Customer PII has been redacted.
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }]
  });
  
  return {
    reason: extractReason(response),
    confidence: extractConfidence(response),
    promptHash: crypto.createHash('sha256').update(prompt).digest('hex'),
    latencyMs: Date.now() - startTime
  };
}

// 4. Publish recommendation
await publishMessage('retail.recommendations.decisions', customerId, {
  event_id: crypto.randomUUID(),
  customer_id: signal.customer_id,
  risk_score: signal.risk_score,
  action: determinedAction,
  reason: explanation.reason,
  priority: determinePriority(signal.risk_score),
  confidence: explanation.confidence,
  model_id: 'claude-sonnet-4-20250514',
  prompt_hash: explanation.promptHash,
  latency_ms: explanation.latencyMs
});

// 5. Publish audit record
await publishMessage('retail.inference.audit', customerId, {
  recommendation_id: recommendation.event_id,
  model_id: recommendation.model_id,
  prompt_hash: recommendation.prompt_hash,
  latency_ms: recommendation.latency_ms
});
```

**Security & Compliance**:
- ✅ PII is hashed/redacted before LLM prompts
- ✅ Prompt hash stored for audit trail
- ✅ Model ID and latency tracked
- ✅ Inference metadata logged to audit topic

---

### Layer 6: API & State Management

**Purpose**: Consume events, maintain state, stream to clients

**Components**:
- **Kafka Consumer** (`apps/api/src/services/kafka-consumer.ts`)
- **State Store** (`apps/api/src/services/state-store.ts`)
- **SSE Manager** (`apps/api/src/services/sse-manager.ts`)

**Architecture**:

```typescript
// 1. Kafka Consumer subscribes to decision topics
const consumer = kafka.consumer({ groupId: 'retailops-api-state' });

await consumer.subscribe({
  topics: [
    'retail.orders.raw',
    'retail.payments.raw',
    'retail.support.raw',
    'retail.shipments.raw',
    'retail.customers.raw',
    'retail.recommendations.decisions'
  ],
  fromBeginning: false
});

// 2. Process messages and update state
await consumer.run({
  eachMessage: async ({ topic, message }) => {
    const data = JSON.parse(message.value.toString());
    
    if (topic === 'retail.customers.raw') {
      stateStore.updateCustomerProfile(data);
    }
    
    if (topic === 'retail.recommendations.decisions') {
      stateStore.addRecommendation(data);
      recommendationSSE.broadcast('recommendation', data);
    } else {
      stateStore.addEvent(data);
      eventSSE.broadcast('event', data);
    }
  }
});

// 3. SSE Manager broadcasts to connected clients
class SSEManager {
  private clients = new Map<string, FastifyReply>();
  
  addClient(reply: FastifyReply): string {
    const id = crypto.randomUUID();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    this.clients.set(id, reply);
    return id;
  }
  
  broadcast(eventType: string, data: unknown): void {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const reply of this.clients.values()) {
      reply.raw.write(payload);
    }
  }
}
```

**API Endpoints**:
```typescript
// GET /events - Recent events
app.get('/events', async () => stateStore.getRecentEvents());

// GET /events/stream - SSE stream
app.get('/events/stream', async (request, reply) => {
  eventSSE.addClient(reply);
});

// GET /recommendations/stream - SSE stream
app.get('/recommendations/stream', async (request, reply) => {
  recommendationSSE.addClient(reply);
});

// GET /customers/:id - Customer 360 view
app.get('/customers/:id', async (request) => {
  return {
    customer: stateStore.getCustomer(request.params.id),
    events: stateStore.getEventsForCustomer(request.params.id),
    recommendations: stateStore.getRecommendationsForCustomer(request.params.id)
  };
});
```

---

### Layer 7: Dashboard Visualization

**Purpose**: Real-time visualization of events, recommendations, and governance

**Component**: `apps/dashboard/src/`

**Architecture**:

```typescript
// 1. SSE Hook for real-time updates
function useSSE<T>(url: string, eventType: string) {
  const [events, setEvents] = useState<T[]>([]);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const source = new EventSource(url);
    
    source.onopen = () => setConnected(true);
    source.addEventListener(eventType, (e: MessageEvent) => {
      const data = JSON.parse(e.data) as T;
      setEvents(prev => [data, ...prev].slice(0, 100));
    });
    
    return () => source.close();
  }, [url, eventType]);
  
  return { events, connected };
}

// 2. Dashboard Page Component
function DashboardPage() {
  const { events } = useSSE<BaseEvent>(
    'http://localhost:3001/events/stream',
    'event'
  );
  
  const { events: recommendations } = useSSE<AIRecommendationCreated>(
    'http://localhost:3001/recommendations/stream',
    'recommendation'
  );
  
  return (
    <div className="dashboard-grid">
      <EventFeed events={events} />
      <RecommendationFeed recommendations={recommendations} />
      <RiskGauge 
        highRiskCount={recommendations.filter(r => r.priority === 'HIGH').length}
      />
    </div>
  );
}
```

**Real-Time Update Flow**:
```
Kafka Topic → API Consumer → State Store → SSE Broadcast → Dashboard Hook → React Re-render
     ↓              ↓              ↓              ↓              ↓              ↓
  <100ms         <50ms          <10ms          <5ms           <5ms          <5ms

Total Latency: ~170ms from Kafka to screen update
```

---

## RetailOps Data Flow

### Complete End-to-End Example: Fraud Scenario

**Timeline**: Customer `c-1003` triggers fraud detection

```
T+0s    Worker generates order event
        └─→ Kafka: retail.orders.raw

T+2s    First payment failure
        └─→ Kafka: retail.payments.raw

T+5s    Second payment failure (triggers risk signal)
        └─→ Kafka: retail.payments.raw

T+5.1s  Risk Scorer processes events
        ├─→ Detects: 2 payment failures in 10-minute window
        ├─→ Computes: risk_score = 30
        └─→ Kafka: retail.risk.signals

T+7s    Shipment delay event
        └─→ Kafka: retail.shipments.raw

T+7.1s  Risk Scorer updates score
        ├─→ Detects: Premium order + shipment delay
        ├─→ Computes: risk_score = 50
        └─→ Kafka: retail.risk.signals

T+8.5s  Negative support ticket
        └─→ Kafka: retail.support.raw

T+8.6s  Risk Scorer final update
        ├─→ Detects: Negative support in 24h window
        ├─→ Computes: risk_score = 75 (EXCEEDS THRESHOLD!)
        └─→ Kafka: retail.risk.signals

T+8.7s  Recommendation Engine processes high-risk signal
        ├─→ Determines action: ESCALATE_FRAUD_REVIEW
        ├─→ Calls Claude API for explanation
        ├─→ Confidence: 0.86
        └─→ Kafka: retail.recommendations.decisions

T+8.8s  API Consumer receives recommendation
        ├─→ Updates state store
        └─→ Broadcasts via SSE

T+8.85s Dashboard receives SSE event
        └─→ User sees: 🔴 CRITICAL - ESCALATE_FRAUD_REVIEW

T+8.9s  Audit record published
        └─→ Kafka: retail.inference.audit

Total Time: 8.9 seconds from first event to dashboard visualization
```

---

## FleetOps Data Flow

### Complete End-to-End Example: Cold Chain Breach

**Timeline**: Vehicle `VH-2041` experiences cold chain breach

```
T+0s    Telemetry event: Normal operation
        └─→ Kafka: fleet.telemetry.raw

T+5s    Route event: ETA drift detected
        └─→ Kafka: fleet.route_events.raw

T+10s   Cold chain event: Temperature rising
        └─→ Kafka: fleet.coldchain.raw

T+10.1s Fleet Cold Chain Agent processes breach
        ├─→ Detects: Temperature deviation > 5°C (CRITICAL)
        ├─→ Computes: risk_score = 65
        └─→ Kafka: fleet.risk.alerts

T+10.2s Fleet Delay Agent processes ETA drift
        ├─→ Recommends: REROUTE_VEHICLE + NOTIFY_CUSTOMER
        └─→ Kafka: fleet.agent.decisions

T+10.3s Cold Chain Agent generates recommendation
        ├─→ Calls Claude API
        ├─→ Action: ESCALATE_COLDCHAIN_INCIDENT
        └─→ Kafka: fleet.agent.decisions

T+10.4s API Consumer receives agent decisions
        └─→ Broadcasts via SSE

T+10.45s Fleet Dashboard receives SSE event
        └─→ User sees: 🔴 CRITICAL incident for VH-2041

T+10.5s Audit record published
        └─→ Kafka: fleet.audit.log

Total Time: 10.5 seconds from breach to dashboard
```

**Fleet AI Agents**:
1. **Delay Agent** - Watches ETA drift and traffic anomalies
2. **Cold Chain Agent** - Monitors refrigeration telemetry
3. **Safety Agent** - Detects harsh braking, overspeed, fatigue
4. **Maintenance Agent** - Watches engine health and fault codes

---

## Governance Integration

### Schema Registry & Data Contracts

**Schema Example** (`packages/schemas/avro/payment-failed.avsc`):
```json
{
  "type": "record",
  "name": "PaymentFailed",
  "fields": [
    {"name": "event_id", "type": "string"},
    {"name": "customer_id", "type": "string"},
    {"name": "failure_code", "type": "string"},
    {
      "name": "card_last_four_hash",
      "type": "string",
      "doc": "SHA-256 hash of last 4 digits",
      "pii": "DIRECT",
      "handling": "HASH"
    }
  ]
}
```

### Lineage Tracking

**Cross-Domain Lineage**:
```typescript
lineage: {
  nodes: [
    { id: 'retail.orders.raw', layer: 'raw', domain: 'retail' },
    { id: 'retail.orders.clean', layer: 'curated', domain: 'retail' },
    { id: 'retail.customer_360.enriched', layer: 'enriched', domain: 'retail' },
    { id: 'retail.risk.signals', layer: 'signals', domain: 'retail' },
    { id: 'retail.recommendations.decisions', layer: 'decisions', domain: 'retail' }
  ],
  edges: [
    { from: 'retail.orders.raw', to: 'retail.orders.clean', processor: 'flink-validation' },
    { from: 'retail.orders.clean', to: 'retail.customer_360.enriched', processor: 'flink-enrichment' },
    { from: 'retail.customer_360.enriched', to: 'retail.risk.signals', processor: 'risk-scorer' },
    { from: 'retail.risk.signals', to: 'retail.recommendations.decisions', processor: 'ai-engine' }
  ]
}
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js 22+
- **API Framework**: Fastify 5
- **Language**: TypeScript
- **Streaming**: KafkaJS
- **AI**: Anthropic Claude API

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Real-Time**: Server-Sent Events (SSE)

### Infrastructure
- **Message Broker**: Apache Kafka 7.9.0
- **Schema Registry**: Confluent Schema Registry 7.9.0
- **Stream Processing**: Apache Flink SQL
- **Database**: PostgreSQL 17
- **Orchestration**: Docker Compose

---

## Key Components Reference

### Packages
| Package | Path | Purpose |
|---------|------|---------|
| **core** | `packages/core/` | Use case registry, governance functions |
| **shared** | `packages/shared/` | Shared types, Kafka client factory |
| **schemas** | `packages/schemas/` | Avro schemas (16 total) |
| **streaming** | `packages/streaming/` | Flink SQL scripts (10 total) |

### Applications
| App | Path | Purpose |
|-----|------|---------|
| **api** | `apps/api/` | Fastify REST API + SSE streams |
| **worker** | `apps/worker/` | Event generators, risk scoring, AI |
| **dashboard** | `apps/dashboard/` | React dashboard |

### Performance
```
Event Generation      →  Kafka Write:        <10ms
Kafka Write          →  Consumer Read:       <50ms
Consumer Read        →  Risk Scoring:        <20ms
Risk Scoring         →  AI Recommendation:   100-200ms
AI Recommendation    →  API State Update:    <10ms
API State Update     →  SSE Broadcast:       <5ms
SSE Broadcast        →  Dashboard Update:    <5ms

Total End-to-End Latency: 200-300ms (typical)
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-06-25  
**Author**: CTO Platform Documentation Team