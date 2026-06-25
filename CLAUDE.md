# SignalTwin AI — CLAUDE.md

## Overview
SignalTwin AI is a real-time AI decision platform built for a 2026 hackathon using Confluent Connectors, stream processing, and governance. The product ingests e-commerce and operations events such as orders, payments, support interactions, shipments, and customer profile changes, then enriches and scores those events in real time to recommend actions like fraud hold, VIP retention, refund approval, or human escalation.

The architecture is designed around Confluent Cloud capabilities: managed connectors for ingestion, Kafka topics as the event backbone, Flink for stream enrichment and scoring, and Stream Governance for Schema Registry, lineage, and data contracts.

## Product goal
The MVP solves a high-value business problem: AI systems often fail in production because they operate on stale, untrusted, or ungoverned data. Confluent’s own AI and governance material emphasizes that real-time AI benefits from fresh streams, in-flight transformations, and governed data products rather than batch-only pipelines.

SignalTwin AI therefore acts as a governed event intelligence layer. Instead of asking an LLM to infer everything from raw text, the system uses streaming logic to compute trusted signals first and then uses AI to explain and recommend actions to human operators.

## Business use case
Primary use case: e-commerce risk and retention.

Example scenario:
- A customer places a high-value order.
- Payment authorization fails twice within ten minutes.
- A shipment update reports delay.
- Support chat sentiment becomes negative.
- The system correlates these signals and emits a high-risk recommendation for fraud review or proactive retention intervention.

The resulting business outcomes are:
- Reduced fraud loss.
- Lower churn risk.
- Faster support prioritization.
- Higher operator productivity.
- Better auditability for AI-driven actions.

## Core principles
- Event-driven, not batch-first.    
- Governed data contracts from day one.
- Deterministic streaming intelligence before LLM generation.
- Reusable data products instead of one-off pipelines.
- Observable, auditable, enterprise-friendly design with lineage and inference tracking.

## Full architecture

### 1. Source systems
SignalTwin AI starts by ingesting operational events from multiple business systems. The minimum viable source set for the hackathon is:

- Orders database, typically PostgreSQL or MySQL, via JDBC source connector.
- Payment events from a payment processor or webhook feed.
- Support events from a ticketing or chat platform.
- Shipment events from logistics or ERP feeds.
- Customer profile updates from CRM or synthetic demo data.

### 2. Ingestion layer
Managed Confluent connectors publish source data into Kafka topics. Confluent describes these connectors as fully managed and quickly deployable inside Confluent Cloud, making them suitable for hackathon delivery speed.

Connector plan:

| Source | Connector | Output topic |
|---|---|---|
| Orders DB | JDBC Source | `raw.orders`  |
| Payments API or mock | HTTP source or custom producer | `raw.payments` |
| Zendesk/chat or mock | SaaS connector or producer | `raw.support`  |
| Shipping webhook or mock | HTTP source or producer | `raw.shipments` |
| CRM/customer data | JDBC or seeded topic | `raw.customers` |

### 3. Kafka topic topology
The platform uses raw, curated, enriched, signal, decision, action, and audit topics. This keeps source truth separate from derived insight and supports replay, discoverability, and downstream reuse.

| Layer | Topic | Purpose |
|---|---|---|
| Raw | `raw.orders` | Source-truth order events. |
| Raw | `raw.payments` | Payment auth, failures, refunds, chargebacks.[cite:29] |
| Raw | `raw.support` | Chat, ticket, complaint, or sentiment events.[cite:29] |
| Raw | `raw.shipments` | Shipment state transitions and exceptions.[cite:29] |
| Raw | `raw.customers` | Customer profile updates and loyalty traits.[cite:29] |
| Curated | `clean.orders` | Standardized and validated orders. |
| Curated | `clean.payments` | Standardized and validated payments.[cite:29] |
| Curated | `clean.support` | Normalized support events. |
| Curated | `clean.shipments` | Normalized shipment updates. |
| Enriched | `enriched.customer_360` | Latest customer state and cross-domain view. |
| Signals | `signals.risk` | Derived fraud and churn features. |
| Decisions | `decisions.ai_recommendations` | Recommended action, confidence, and explanation metadata. |
| Actions | `actions.agent_actions` | Operator or agent response to recommendation. |
| Audit | `audit.inference` | Model metadata, prompt hash, latency, and trace data. |

### 4. Governance layer
Stream Governance is a major differentiator. Confluent describes it as the built-in framework for schema registry, lineage, discovery, and quality controls for data in motion.

Governance policies for the MVP:
- Every raw and curated topic must be registered in Schema Registry with versioned contracts.
- Compatibility mode should be set to backward or full compatibility for critical topics to reduce downstream breakage risk.
- Fields like email, phone, address, and payment token must be tagged as PII or restricted fields inside metadata definitions.
- Lineage must be enabled so judges can see end-to-end flow from connector to topic to Flink job to recommendation topic.
- Ownership metadata should be attached to streams, for example `domain=commerce`, `owner=fraud-ops`, `criticality=high`.

### 5. Stream processing layer
Confluent Cloud exposes Flink for stream processing, and Confluent’s training material highlights temporal joins and stream enrichment as preferred techniques for real-time context assembly.

Processing stages:
1. Validate incoming events against schemas.
2. Standardize field names, currencies, timestamps, and status values.
3. Deduplicate by business keys such as `order_id`, `payment_id`, or `ticket_id`.
4. Enrich events using temporal joins against the latest customer state.
5. Compute rolling features such as failed-payment count in a 10-minute window, negative-support count in 24 hours, and shipment delay flags.
6. Produce risk signals.
7. Generate recommendation-ready events for the AI layer.

Recommended score logic for MVP:
- Two payment failures in ten minutes: +30.
- Shipment delayed for premium order: +20.
- Negative support event in twenty-four hours: +25.
- Refund request after shipment issue: +15.
- VIP customer: +10 retention priority.
- Score greater than 60: escalate to human review.

This scoring model is intentionally simple so the demo stays transparent and deterministic while still showing stateful streaming value.

### 6. AI layer
The AI layer should consume already-scored business events instead of replacing the streaming logic. Confluent’s real-time AI direction emphasizes feeding AI with fresh, processed context rather than depending on batch ETL alone.

AI responsibilities:
- Translate risk signals into a short recommendation.
- Explain why the action is being suggested.
- Generate a confidence band.
- Route outcome to a dashboard or downstream case-management system.
- Emit inference audit records into `audit.inference` for traceability.

Example output:

```json
{
  "customer_id": "c-1001",
  "score": 78,
  "action": "ESCALATE_FRAUD_REVIEW",
  "reason": [
    "2 failed payments in 10 minutes",
    "premium order value above threshold",
    "shipment delay created churn risk"
  ],
  "priority": "HIGH",
  "confidence": 0.86
}
```

### 7. Experience layer
The demo dashboard should expose:
- Live event feed.
- Customer 360 timeline.
- Current score and contributing signals.
- Recommendation feed.
- Action acknowledgment controls.
- Governance view showing schemas, lineage, and PII tags.[cite:12][cite:19]

This matters because the hackathon story becomes more compelling when governance is visible as part of the user experience rather than hidden as infrastructure.[cite:12]

## Monorepo structure
The repository is organized as a monorepo so frontend, backend, streaming contracts, and local infrastructure evolve together.

```text
retailpulse-monorepo/
├── CLAUD.md
├── docker-compose.yml
├── .env.example
├── apps/
│   ├── dashboard/
│   │   ├── package.json
│   │   ├── src/
│   │   └── Dockerfile
│   ├── api/
│   │   ├── package.json
│   │   ├── src/
│   │   └── Dockerfile
│   └── worker/
│       ├── package.json
│       ├── src/
│       └── Dockerfile
├── packages/
│   ├── schemas/
│   │   ├── avro/
│   │   └── json/
│   ├── streaming/
│   │   ├── flink-sql/
│   │   └── ksql/
│   └── shared/
│       └── ts/
├── infra/
│   ├── docker/
│   ├── confluent/
│   └── sql/
└── docs/
    ├── architecture.md
    ├── topics.md
    └── runbook.md
```

## Service responsibilities

### apps/dashboard
Frontend application for analysts and judges.

Responsibilities:
- Display live risk and recommendation feed.
- Show customer timeline and contributing signals.
- Show governance artifacts and audit metadata.
- Allow human acknowledgment or override action.

Suggested stack:
- Next.js or Vite React frontend.
- WebSocket or Server-Sent Events from the API.
- Tailwind or lightweight component system.

### apps/api
Backend API gateway and orchestration service.

Responsibilities:
- Read decision topics or cached state.
- Serve dashboard APIs.
- Expose endpoints for mock event injection during demo.
- Accept operator actions and publish to `actions.agent_actions`.
- Integrate with LLM provider for recommendation explanation.

Suggested stack:
- Node.js with Fastify or NestJS.
- Kafka client for producer/consumer operations.
- Schema validation against shared packages.

### apps/worker
Background worker for mock data generation, recommendation inference, and optional replay tasks.

Responsibilities:
- Generate synthetic event streams for demo mode.
- Consume `signals.risk`.
- Create AI recommendation payloads.
- Publish recommendations and audit events.

## Local development architecture with Docker Compose
The monorepo includes Docker Compose for local hackathon development. This does not replace Confluent Cloud in the final demo architecture; it provides a practical local stack for coding and testing.

Recommended local stack:
- Zookeeper and Kafka broker, if using classic local Kafka images.
- Schema Registry.
- Kafka Connect.
- Control Center or equivalent UI.
- PostgreSQL for source data simulation.
- API service.
- Worker service.
- Dashboard service.

A local Compose stack accelerates development while keeping parity with the production event-driven design. Confluent Cloud remains the target platform for connectors, governance, and Flink in the final story.

## Docker Compose design

### Core infrastructure services
- `zookeeper`
- `kafka`
- `schema-registry`
- `connect`
- `control-center`
- `postgres`

### Application services
- `api`
- `worker`
- `dashboard`

### Optional services
- `kafka-ui`
- `mock-order-producer`
- `mock-shipment-producer`

## Event schema guidance
Define schemas in `packages/schemas` so all producers and consumers use the same contracts.

Example domains:
- `order-created`
- `payment-failed`
- `support-ticket-updated`
- `shipment-delayed`
- `customer-profile-updated`
- `risk-signal-generated`
- `ai-recommendation-created`

Each schema should include:
- `event_id`
- `event_type`
- `event_time`
- `source_system`
- `tenant_id`
- `customer_id`
- domain-specific payload
- metadata for traceability

## Suggested schema sample

```json
{
  "type": "record",
  "name": "PaymentFailed",
  "namespace": "retailpulse.events",
  "fields": [
    {"name": "event_id", "type": "string"},
    {"name": "event_time", "type": "string"},
    {"name": "source_system", "type": "string"},
    {"name": "customer_id", "type": "string"},
    {"name": "order_id", "type": "string"},
    {"name": "payment_id", "type": "string"},
    {"name": "failure_code", "type": "string"},
    {"name": "amount", "type": "double"},
    {"name": "currency", "type": "string"}
  ]
}
```

## Flink SQL plan
The Flink layer can be organized into SQL scripts stored under `packages/streaming/flink-sql/`.

Suggested scripts:
- `01-create-source-tables.sql`
- `02-clean-orders.sql`
- `03-clean-payments.sql`
- `04-customer-360.sql`
- `05-risk-signals.sql`
- `06-decisions.sql`

Example processing pattern:
- Source tables map to Kafka topics.
- Curated tables normalize events.
- Customer 360 table joins latest records.
- Risk signal table computes features with windows.
- Decision table emits actionable rows for the worker or API.

## Governance checklist
- Register schemas before producing business events.
- Set compatibility policy for each schema subject.
- Define topic naming convention and ownership.
- Tag PII fields in metadata catalog.
- Keep raw topics immutable.
- Record inference metadata in audit topic.
- Validate schema evolution before deployment.
- Surface lineage in demo walkthrough.

## Security and compliance
This MVP is hackathon-focused, but the design should still show enterprise awareness:
- Do not pass full PII to LLM prompts.
- Redact or hash sensitive fields before the AI layer.
- Store only prompt references or hashes in audit logs when possible.
- Use least-privilege service credentials for connectors and consumers.
- Separate decisioning logic from presentation logic.

These controls align with the governance-first positioning of Confluent’s stream management story.

## Demo walkthrough
1. Seed or stream order, payment, support, and shipment events.
2. Show them landing in raw Kafka topics.
3. Show curated and enriched outputs.
4. Trigger a scenario with two payment failures and a delayed shipment.
5. Show Flink-generated risk signal.
6. Show AI recommendation in dashboard.
7. Show lineage and schema contract for the event path.
8. Acknowledge action and publish to action topic.

## Delivery roadmap

### Day 1
- Set up monorepo.
- Bring up Docker Compose locally.
- Create schemas and topics.
- Implement mock producers.
- Stand up basic dashboard shell.

### Day 2
- Implement Flink SQL or simulated stream transformations.
- Build worker recommendation flow.
- Integrate dashboard live feed.
- Add governance screenshots or metadata hooks.

### Day 3
- Polish demo scenarios.
- Add one premium customer case.
- Add one fraud case.
- Add one retention case.
- Rehearse architecture walkthrough with governance story.

## Definition of done
The MVP is complete when:
- At least four event sources are ingested or simulated.
- Risk signals are produced in real time.
- AI recommendations appear in the dashboard.
- Operator action is captured.
- Schemas are versioned and visible.
- A lineage story can be demonstrated.
- The architecture can run locally with Docker Compose and be mapped to Confluent Cloud for final presentation.

## Implementation notes
- Use Docker Compose locally for developer productivity.
- Use Confluent Cloud in the pitch and, if possible, in the final live demo for managed connectors, governance, and Flink.
- Keep the AI layer narrow and robust: explanation and recommendation, not full control.
- Keep business rules transparent so judges can understand how events become actions.
- Highlight that governance is part of the product, not just infrastructure.


FleetOps AI Agent Implementation
Overview
FleetOps AI Agent is a real-time logistics control-tower pattern built on Confluent connectors, stream processing, and governance. It turns vehicle telemetry, route updates, delivery events, cold-chain signals, and customer exceptions into governed metrics and autonomous operational actions.

Core problem
Fleet and delivery teams still rely on delayed status views, manual escalation, and fragmented operational systems. Real-time AI agents improve this by reacting to live route deviation, ETA drift, safety signals, and asset-health anomalies as events happen.

Solution goal
The goal is to create a shared event backbone where operational data enters once, is enriched continuously, validated through governance, and then consumed by role-specific AI agents for action.

Data sources and connectors
FleetOps AI Agent should ingest the following sources through Confluent connectors or event producers:

GPS and vehicle telemetry streams.

Driver mobile app events.

Dispatch and route planning system events.

Order management and proof-of-delivery updates.

Cold-chain sensor data for temperature-sensitive shipments.

Maintenance system records and asset health events.

CRM or support events linked to delivery issues.

Recommended connector patterns:

JDBC source connectors for operational databases.

HTTP or custom producers for telematics and mobile app events.

Debezium CDC for route, order, and dispatch changes in source systems.

Sink connectors to operational data stores, alerting systems, and audit destinations.

Kafka topic model
Suggested topic topology:

fleet.telemetry.raw

fleet.location_updates.raw

fleet.driver_events.raw

fleet.order_events.raw

fleet.route_events.raw

fleet.coldchain.raw

fleet.maintenance.raw

fleet.support_events.raw

fleet.metrics.live

fleet.risk.alerts

fleet.agent.decisions

fleet.agent.actions

fleet.audit.log

Each topic should be schema-managed and versioned through Schema Registry to keep downstream consumers stable as the product evolves.

Stream processing layer
Confluent Cloud for Apache Flink should compute shared operational context from raw fleet streams. This layer is responsible for:

Joining vehicle location, route plan, and order destination streams.

Calculating ETA drift and missed-stop probability.

Detecting unsafe driving patterns from abrupt speed and braking changes.

Computing cold-chain breach windows from sensor telemetry.

Identifying maintenance risk from repeated engine or vibration anomalies.

Producing business-ready metrics topics that every AI agent and dashboard can consume.

Example derived metrics:

ETA variance by vehicle.

Route deviation score.

Idle time score.

Delivery SLA risk level.

Cold-chain breach probability.

Driver safety score.

Maintenance-risk score.

Governance layer
Stream Governance should be used to make FleetOps reliable and enterprise-ready. Key controls include:

Schema validation for every producer and consumer.

Compatibility rules for stream evolution.

Topic cataloging and lineage for operational traceability.

Data quality checks on critical metrics and agent decision streams.

Tagging and access policies for sensitive operational data.

AI agent architecture
FleetOps should use a small network of specialized agents instead of one general agent. Suggested agents:

1. Delay Agent
Watches ETA drift, traffic anomalies, and route progress. It recommends rerouting, reassignment, or proactive customer communication when SLA risk crosses a threshold.

2. Safety Agent
Watches harsh braking, overspeed, fatigue indicators, and risky driving clusters. It recommends dispatcher escalation, safety coaching, or temporary routing changes.

3. Cold Chain Agent
Watches refrigeration telemetry, door-open duration, route delays, and handoff conditions. It recommends priority drop-off, nearest recovery point, or shipment intervention when spoilage risk rises.

4. Maintenance Agent
Watches engine health, repeating fault events, service history, and abnormal machine signals. It recommends service scheduling, vehicle swap, or downtime planning before a breakdown impacts deliveries.

Agent execution model
The implementation should follow an event-driven model:

Raw events enter Kafka topics.

Flink enriches the streams and writes trusted live metrics.

Each agent subscribes to its own decision context topic.

The agent evaluates current context plus policy thresholds.

The agent emits a structured recommendation or action command.

Actions are written back to Kafka and pushed into external systems for execution.

Every recommendation and execution result is recorded in an audit stream.

Action patterns
Agent outputs should be structured so downstream systems can safely consume them. Recommended action categories:

Reroute vehicle.

Notify dispatcher.

Notify customer.

Escalate cold-chain incident.

Create maintenance ticket.

Recommend driver coaching.

Trigger manual review.

Suggested output contract:

json
{
  "decision_id": "uuid",
  "agent_type": "delay_agent",
  "vehicle_id": "VH-2041",
  "severity": "high",
  "reason": "eta_drift_and_traffic_spike",
  "recommended_action": "reroute_vehicle",
  "confidence": 0.91,
  "generated_at": "2026-06-23T20:00:00Z"
}
Dashboard view
A FleetOps dashboard should consume the same metrics and decisions topics as the agents. Suggested panels:

Live fleet map with vehicle health state.

SLA risk leaderboard.

Active incidents by type.

Cold-chain watchlist.

Driver safety alerts.

Agent recommendation feed.

Action outcome timeline.

This creates a clear demo where both humans and AI share one governed operational truth.

Demo scenario
A strong hackathon scenario:

A vehicle begins drifting from planned ETA.

Traffic increases on the route.

Cold-chain temperature trends upward.

Customer SLA risk crosses threshold.

Delay Agent recommends reroute and customer notification.

Cold Chain Agent recommends priority handling.

Dispatcher dashboard displays both recommendations instantly.

Monorepo implementation mapping
Suggested mapping inside the monorepo:

apps/dashboard → fleet operations UI.

apps/api → action orchestration and external workflow adapters.

apps/worker → agent runner and recommendation processor.

packages/schemas → Avro/JSON schemas for fleet topics.

packages/stream-jobs → Flink SQL and agent-triggered stream logic.

infra/docker → local Kafka, Schema Registry, Connect, Postgres, and mock event sources.

infra/bootstrap → connector configs, topic creation, sample fleet data injectors.

MVP scope
For the hackathon, keep the scope simple:

One vehicle telemetry stream.

One route plan stream.

One cold-chain sensor stream.

One support or customer exception stream.

Two active agents: Delay Agent and Cold Chain Agent.

One dashboard with recommendations and metrics.

This is enough to show business value without overbuilding.

Business value
FleetOps AI Agent can improve on-time delivery, lower spoilage, reduce dispatcher load, and create a more proactive logistics operating model. The strongest enterprise angle is that it combines live event streams, governed decision logic, and AI agent actions in one platform pattern