# CTO — Control Tower Orchestra

“CTO is the control tower for the AI era.”

That means every stream, every agent, and every decision passes through one trusted orchestration layer


A real-time AI decision platform and governed orchestration engine built for the 2026 Confluent hackathon. CTO provides a reusable event-driven backbone where any enterprise use case — retail risk, fleet logistics, or future domains — plugs into a single governed orchestration layer powered by Confluent Stream Governance.

Two use cases ship with the platform:

- **RetailOps Control Tower** — E-commerce risk, fraud detection, and VIP retention with real-time customer signal correlation
- **FleetOps Control Tower** — Logistics control tower with vehicle telemetry, cold-chain monitoring, and autonomous AI agents

## Architecture

```
                               ┌─────────────────────────────────────────┐
                               │     CTO Core Engine (packages/core)     │
                               │  Use Case Registry · Governance Layer   │
                               │  Generic Processors · State Stores      │
                               └────────────┬────────────────────────────┘
                                            │
                    ┌───────────────────────┬┴──────────────────────────┐
                    │                       │                          │
          ┌─────────▼──────────┐  ┌────────▼──────────┐   ┌──────────▼──────────┐
          │   RetailOps        │  │   FleetOps        │   │   Future Use Case   │
          │   14 topics        │  │   13 topics       │   │   Register & go     │
          │   2 AI agents      │  │   4 AI agents     │   │                     │
          │   7 schemas        │  │   9 schemas       │   │                     │
          └────────────────────┘  └───────────────────┘   └─────────────────────┘
```

**Per-domain pipeline:**
```
Source Events → Kafka Topics (raw) → Flink Enrichment → Risk Signals → AI Recommendations → Operator Actions → Audit
```

**Key layers:**
- **Core Engine** (`packages/core`): Use case registry, domain definitions, governance functions, generic processors
- **Ingestion**: Managed connectors or mock producers publish to domain-prefixed Kafka topics
- **Processing**: Flink SQL for streaming enrichment; KafkaJS workers for local scoring
- **AI**: Claude API generates explanations for deterministic risk signals (PII redacted before prompts)
- **Governance**: Schema Registry, data contracts, PII tagging, cross-domain lineage, compliance dashboard
- **Experience**: React dashboard with SSE live feeds, domain-colored lineage graph, governance views

## Prerequisites

- **Node.js** >= 22.x
- **npm** >= 10.x
- **Docker** and **Docker Compose** (v2+)
- **Anthropic API key** (for AI recommendations)

## Repository Structure

```
SignalTwinAI/
├── package.json                  # Root workspace config
├── tsconfig.base.json            # Shared TypeScript config
├── docker-compose.yml            # Full local infrastructure
├── CLAUDE.md                     # AI assistant context
│
├── packages/
│   ├── core/                     # CTO Core Engine
│   │   └── src/
│   │       ├── types.ts          # UseCaseDefinition, DomainTopics, GovernanceMetrics, etc.
│   │       ├── use-case-registry.ts  # Domain registration and lookup
│   │       ├── governance.ts     # Cross-domain lineage, PII report, data contracts
│   │       ├── generic-processor.ts  # Kafka consumer factory
│   │       ├── generic-state-store.ts # Domain-parameterized state store
│   │       └── definitions/
│   │           ├── retail.ts     # RetailOps: topics, scoring, lineage, schemas, PII
│   │           └── fleet.ts      # FleetOps: topics, agents, lineage, schemas, PII
│   │
│   ├── shared/                   # Shared types, constants, Kafka client factory
│   │   └── src/
│   │       ├── types.ts          # Event interfaces (retail + fleet)
│   │       ├── constants.ts      # Topic names, risk weights, thresholds
│   │       └── kafka.ts          # KafkaJS client factory
│   │
│   ├── schemas/                  # Avro schemas for all event types
│   │   └── avro/                 # 16 .avsc schema files (7 retail + 9 fleet)
│   │
│   └── streaming/
│       └── flink-sql/            # 10 Flink SQL scripts (6 retail + 4 fleet)
│
├── apps/
│   ├── api/                      # Fastify 5 API server
│   │   └── src/
│   │       ├── index.ts          # Server entrypoint
│   │       ├── routes/           # health, events, recommendations, customers, actions,
│   │       │                     # governance (11 endpoints), copilot, replay, fleet
│   │       └── services/         # SSE manager, Kafka consumer/producer, state store
│   │
│   ├── worker/                   # Background worker
│   │   └── src/
│   │       ├── index.ts          # Worker entrypoint
│   │       ├── generators/       # Mock event generators + scenario orchestrator
│   │       ├── processors/       # Risk scorer, recommendation engine
│   │       └── services/         # Kafka producer, Claude API client
│   │
│   └── dashboard/                # React 19 dashboard (Vite + Tailwind v4)
│       └── src/
│           ├── App.tsx           # Horizontal TopNav layout with domain routing
│           ├── pages/            # RetailOps (7 pages) + FleetOps (6 pages)
│           ├── components/       # LineageGraph, StreamCatalog, ComplianceDashboard,
│           │                     # SchemaViewer, EventFeed, CopilotPanel, etc.
│           └── api/client.ts     # API client with governance endpoints
│
└── infra/
    ├── docker/                   # Dockerfiles for api, worker, dashboard
    ├── confluent/                # Topic creation, schema registration, data contracts
    └── sql/                      # PostgreSQL seed data
```

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd SignalTwinAI
npm run setup
```

This runs `npm install` and builds `packages/core`, `packages/shared`, and `packages/schemas`.

### 2. Configure environment

```bash
cp .env.example .env
```

Set your Anthropic API key in `.env`:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Start infrastructure

```bash
npm run infra:up
```

Starts Zookeeper, Kafka, Schema Registry, Connect, Control Center, and PostgreSQL. Wait 30-60 seconds for Kafka to be healthy (`docker compose ps`).

### 4. Create topics and register schemas

```bash
npm run infra:topics
npm run infra:schemas
```

Creates 27 Kafka topics (14 retail + 13 fleet) and registers Avro schemas.

### 5. Start application services

```bash
npm run dev
```

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:3001 | Fastify REST API + SSE streams |
| Dashboard | http://localhost:5173 | React dashboard |
| Worker | (background) | Event generators + risk scoring + AI |

Open http://localhost:5173 to see the CTO hub with use case selector.

## CTO Core Engine

The core engine (`packages/core`) provides a **Use Case Registry** — a simple data structure where each domain registers its complete definition:

```typescript
interface UseCaseDefinition {
  domain: string;              // 'retail' | 'fleet'
  displayName: string;         // 'RetailOps Control Tower'
  entityIdField: string;       // 'customer_id' | 'vehicle_id'
  topics: DomainTopics;        // raw, curated, enriched, signals, decisions, actions, audit
  scoring: ScoringConfig;      // input topics, weights, escalation threshold
  agents: AgentConfig[];       // AI agent definitions
  lineage: LineageDefinition;  // nodes + edges for governance graph
  schemas: SchemaMapping[];    // schema-to-topic with compatibility levels
  piiFields: PIIFieldMapping[];// field-level PII classification + handling
}
```

Adding a new use case requires one definition file. The governance layer, API routes, and dashboard automatically discover and display all registered domains.

### Governance Functions

The core engine generates governance data from the registry:

- `getCrossdomainLineage()` — Merged lineage graph across all domains
- `getLineageForDomain(domain)` — Domain-specific lineage
- `getPIIReport()` — PII field inventory across all schemas
- `getDataContracts()` — Compatibility rules per topic
- `getGovernanceMetrics()` — Counts: domains, topics, schemas, PII fields

## Use Cases

### RetailOps Control Tower

E-commerce risk and retention with real-time customer signal correlation.

**Topics** (14): `retail.orders.raw`, `retail.payments.raw`, `retail.support.raw`, `retail.shipments.raw`, `retail.customers.raw`, `retail.orders.clean`, `retail.payments.clean`, `retail.support.clean`, `retail.shipments.clean`, `retail.customer_360.enriched`, `retail.risk.signals`, `retail.recommendations.decisions`, `retail.agent_actions.actions`, `retail.inference.audit`

**Risk Scoring:**

| Condition | Score | Signal |
|-----------|-------|--------|
| 2+ payment failures in 10 minutes | +30 | Potential fraud |
| Shipment delayed for premium order | +20 | Churn risk |
| Negative support event in 24 hours | +25 | Customer dissatisfaction |
| Refund request after shipment issue | +15 | Service recovery needed |
| VIP customer | +10 | High-value retention priority |
| **Total > 60** | — | **Escalate to human review** |

**AI Agents**: Risk Scorer, AI Recommendation Engine (Claude-powered)

**Dashboard pages**: Dashboard, Digital Twin, Governance, Event Replay, Live Events, Recommendations, Customers

### FleetOps Control Tower

Real-time logistics control tower with vehicle telemetry and autonomous AI agents.

**Topics** (13): `fleet.telemetry.raw`, `fleet.location_updates.raw`, `fleet.driver_events.raw`, `fleet.order_events.raw`, `fleet.route_events.raw`, `fleet.coldchain.raw`, `fleet.maintenance.raw`, `fleet.support_events.raw`, `fleet.metrics.live`, `fleet.risk.alerts`, `fleet.agent.decisions`, `fleet.agent.actions`, `fleet.audit.log`

**AI Agents** (4):
- **Delay Agent** — Watches ETA drift and traffic anomalies, recommends rerouting or customer notification
- **Cold Chain Agent** — Monitors refrigeration telemetry and door-open events, recommends priority handling
- **Safety Agent** — Detects harsh braking, overspeed, and fatigue, recommends driver coaching
- **Maintenance Agent** — Watches engine health and fault codes, recommends service scheduling

**Dashboard pages**: Control Tower, Vehicles, Vehicle Detail, Incidents, AI Agents, Governance

## Governance Dashboard

The governance page is the demo centerpiece — a unified view across all domains with 4 sections:

1. **Stream Catalog** — All 27 topics across both domains, filterable by domain and layer
2. **Data Lineage** — Cross-domain lineage graph with domain-colored nodes, hover highlighting, and domain filter
3. **Schema Registry** — Schema browser with PII classification badges and handling tags
4. **Compliance** — Governance metrics overview, PII field inventory, data contract compatibility rules

Both RetailOps and FleetOps have their own Governance nav item, pre-filtered to their domain.

## API Endpoints

### Core Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/events/inject` | Inject mock events into Kafka |
| GET | `/events` | Recent events |
| GET | `/events/stream` | SSE stream of live events |
| GET | `/recommendations` | Recent AI recommendations |
| GET | `/recommendations/stream` | SSE stream of live recommendations |
| GET | `/customers` | List all customers |
| GET | `/customers/:id` | Customer 360 view |
| POST | `/actions` | Submit operator action |

### Governance Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/governance/domains` | All registered domains with stats |
| GET | `/governance/lineage` | Cross-domain merged lineage graph |
| GET | `/governance/lineage/:domain` | Domain-specific lineage |
| GET | `/governance/topics` | All topics with domain/layer metadata |
| GET | `/governance/topics/:domain` | Domain-filtered topics |
| GET | `/governance/schemas` | Schema Registry subjects |
| GET | `/governance/schemas/:subject` | Schema detail |
| GET | `/governance/pii` | PII field inventory across all schemas |
| GET | `/governance/pii/:domain` | Domain-filtered PII fields |
| GET | `/governance/contracts` | Data contracts (compatibility rules) |
| GET | `/governance/metrics` | Governance summary metrics |
| GET | `/governance/agents` | All AI agents across all domains |

### Fleet Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/fleet/vehicles` | All vehicles with live state |
| GET | `/fleet/vehicles/:id` | Vehicle detail |
| GET | `/fleet/stream` | SSE stream of fleet events |
| POST | `/fleet/scenarios/:type` | Trigger demo scenario |

### Copilot Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/copilot/chat` | Send message to CTO Copilot (Claude-powered) |
| GET | `/api/copilot/suggestions` | Get contextual prompt suggestions |

## Topic Naming Convention

All topics follow `{domain}.{entity}.{layer}`:

| Layer | RetailOps Example | FleetOps Example |
|-------|-------------------|-------------------|
| raw | `retail.orders.raw` | `fleet.telemetry.raw` |
| curated | `retail.orders.clean` | — |
| enriched | `retail.customer_360.enriched` | — |
| signals | `retail.risk.signals` | `fleet.risk.alerts` |
| decisions | `retail.recommendations.decisions` | `fleet.agent.decisions` |
| actions | `retail.agent_actions.actions` | `fleet.agent.actions` |
| audit | `retail.inference.audit` | `fleet.audit.log` |

## Flink SQL Scripts

Stored in `packages/streaming/flink-sql/`:

| Script | Domain | Purpose |
|--------|--------|---------|
| `01-create-source-tables.sql` | Retail | Source table definitions |
| `02-clean-orders.sql` | Retail | Validated/standardized orders |
| `03-clean-payments.sql` | Retail | Validated/standardized payments |
| `04-customer-360.sql` | Retail | Enriched cross-domain customer view |
| `05-risk-signals.sql` | Retail | Windowed risk score computation |
| `06-decisions.sql` | Retail | Decision routing view |
| `10-fleet-source-tables.sql` | Fleet | Fleet source table definitions |
| `11-fleet-metrics.sql` | Fleet | Vehicle metrics computation |
| `12-fleet-risk-alerts.sql` | Fleet | Fleet risk alert generation |
| `13-fleet-agent-decisions.sql` | Fleet | Agent decision routing |

## Avro Schemas

16 schemas in `packages/schemas/avro/`:

**Retail** (7): `order-created`, `payment-failed`, `support-ticket-updated`, `shipment-delayed`, `customer-profile-updated`, `risk-signal-generated`, `ai-recommendation-created`

**Fleet** (9): `fleet-telemetry`, `fleet-route-event`, `fleet-coldchain`, `fleet-driver-event`, `fleet-maintenance`, `fleet-order-event`, `fleet-risk-alert`, `fleet-agent-decision`, `fleet-audit-entry`

PII fields store hashed values only (`shipping_address_hash`, `email_hash`, `customer_name_hash`).

## Security and Compliance

- PII fields are classified (DIRECT/QUASI/SENSITIVE) and handled (HASH/REDACT/MASK/ENCRYPT)
- Full PII is never passed to LLM prompts — only hashed or redacted values
- Inference audit records track model ID, prompt hash, and latency
- Data contracts enforce schema compatibility (BACKWARD/FORWARD/FULL) per topic
- Least-privilege service credentials for connectors and consumers

## Infrastructure Scripts

| Script | Description |
|--------|-------------|
| `infra/confluent/create-topics.sh` | Creates all 27 Kafka topics (14 retail + 13 fleet) |
| `infra/confluent/register-schemas.sh` | Registers Avro schemas in Schema Registry |
| `infra/confluent/set-data-contracts.sh` | Sets compatibility levels per schema subject |

## Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| zookeeper | 2181 | Kafka coordination |
| kafka | 9092 (host), 29092 (internal) | Message broker |
| schema-registry | 8081 | Avro schema management |
| connect | 8083 | Kafka Connect |
| control-center | 9021 | Confluent Control Center UI |
| postgres | 5434 (host) | Source data + seed customers |
| api | 3001 | CTO API |
| worker | — | Background processing |
| dashboard | 5173 | React dashboard |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BROKERS` | `localhost:9092` | Kafka bootstrap servers |
| `SCHEMA_REGISTRY_URL` | `http://localhost:8081` | Schema Registry URL |
| `ANTHROPIC_API_KEY` | — | Required for AI recommendations |
| `POSTGRES_URL` | `postgresql://signaltwin:signaltwin_dev@localhost:5434/signaltwin` | PostgreSQL connection |
| `API_PORT` | `3001` | API server port |
| `VITE_API_URL` | `http://localhost:3001` | API URL for dashboard |
| `GENERATOR_INTERVAL_MS` | `5000` | Background event generation interval |

## Useful Commands

```bash
# Install and build everything
npm run setup

# Start infrastructure only
npm run infra:up

# Create Kafka topics (27 topics)
npm run infra:topics

# Register Avro schemas
npm run infra:schemas

# Start all app services (dev mode)
npm run dev

# Start individual services
npm run dev:api
npm run dev:worker
npm run dev:dashboard

# Build all workspaces
npm run build

# Docker: build, start, stop
npm run docker:build
npm run docker:up
npm run docker:down

# Clean all build artifacts
npm run clean
```

## Confluent Cloud Deployment

The local Docker Compose stack is for development. For the final demo:

1. Create a Confluent Cloud cluster
2. Update `KAFKA_BROKERS` and `SCHEMA_REGISTRY_URL` in `.env` with Confluent Cloud endpoints
3. Run topic creation, schema registration, and data contract scripts against Confluent Cloud
4. Deploy Flink SQL scripts from `packages/streaming/flink-sql/` to Confluent Cloud Flink
5. Enable Stream Governance features: lineage, data catalog, schema compatibility enforcement
6. Run `api`, `worker`, and `dashboard` locally or deploy to your preferred hosting

## Demo Walkthrough

1. Open the CTO hub at http://localhost:5173 — shows both use case cards with governance stats
2. Enter **RetailOps** — see live events, AI recommendations, and customer risk scores
3. Trigger a fraud scenario — 2 payment failures + shipment delay = high-risk escalation
4. Visit **Governance** — see cross-domain lineage, stream catalog, PII inventory, data contracts
5. Switch to **FleetOps** — see vehicle fleet, incidents, and AI agent decisions
6. Run a fleet demo scenario — ETA drift + cold-chain breach triggers Delay and Cold Chain agents
7. View **Fleet Governance** — see fleet-specific lineage and schema contracts
8. Show the architecture story: one governed engine, multiple use cases, Confluent as the backbone

## Troubleshooting

**Kafka not healthy after `infra:up`:**
Wait 30-60 seconds. If stuck, run `docker compose down -v` then start stepwise: `docker compose up -d zookeeper`, wait 10s, then `docker compose up -d kafka`.

**Port conflicts:**
If ports 9092, 8081, 9021, or 5434 are in use, update the port mappings in `docker-compose.yml`.

**No recommendations appearing:**
Ensure `ANTHROPIC_API_KEY` is set in `.env`. The worker falls back to deterministic reasons if the API is unavailable, but still needs Kafka running.

**Schema registration fails:**
Make sure Schema Registry is healthy: `curl http://localhost:8081/subjects`. Requires `jq` installed locally.

**Docker memory issues:**
The full Confluent stack uses ~4GB RAM. If constrained, comment out `control-center` and `connect` in `docker-compose.yml` — they are optional for core functionality.

**Topics not found after restart:**
Run `npm run infra:topics` to create all 27 topics, then restart the API: `npm run dev:api`.
