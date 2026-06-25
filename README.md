# CTO — Control Tower Orchestra

> **"The control tower for the AI era."**  
> Every stream, every agent, and every decision passes through one trusted orchestration layer.

A real-time AI decision platform built for the **2026 Confluent Hackathon**. CTO provides a reusable event-driven backbone where any enterprise use case — fleet logistics, retail risk, healthcare, energy, telecom, or future domains — plugs into a single governed orchestration layer powered by **Confluent Cloud**, **Apache Flink SQL**, and **Stream Governance**.

---

## 🎥 Demo

[![CTO — Control Tower Orchestra — Live Demo](https://img.youtube.com/vi/pMSdUciQNas/maxresdefault.jpg)](https://www.youtube.com/watch?v=pMSdUciQNas)

▶️ **[Watch the full demo on YouTube](https://www.youtube.com/watch?v=pMSdUciQNas)**

---

## Platform Overview

CTO is a **multi-domain control tower** that demonstrates how enterprises build a unified streaming platform for diverse use cases while maintaining governance, lineage, and compliance across all domains.

### Shipped Use Cases

| # | Use Case | Domain | Topics | AI Agents |
|---|----------|--------|--------|-----------|
| 1 | **FleetOps Control Tower** | Logistics & last-mile | 13 | 4 |
| 2 | **RetailOps Control Tower** | E-commerce risk & fraud | 14 | 2 |

### Additional Use Cases (Definitions Ready)

| # | Use Case | Domain |
|---|----------|--------|
| 3 | **FinGuard** | Financial fraud detection & AML |
| 4 | **CareFlow** | Healthcare patient monitoring |
| 5 | **GridWatch** | Energy grid monitoring |
| 6 | **NetPulse** | Telecom network health |
| 7 | **FactoryGuardian** | Manufacturing quality control |

All use cases share the same **CTO Core Engine** for governance, lineage tracking, PII management, and schema evolution.

---

## Architecture

### System Overview

```mermaid
graph TB
    subgraph INGESTION["Data Ingestion"]
        direction LR
        FG["Fleet Generators<br/>Telemetry · Route · ColdChain"]
        RG["Retail Generators<br/>Order · Payment · Support"]
        EXT["Connectors<br/>IoT · ERP · CRM"]
    end

    subgraph CONFLUENT["Confluent Cloud"]
        direction TB

        subgraph TOPICS["Kafka Topics — 27 Total"]
            direction LR
            F_RAW["Fleet Raw (8)<br/>telemetry · routes · coldchain"]
            R_RAW["Retail Raw (5)<br/>orders · payments · support"]
            CURATED["Curated (4)<br/>clean · validated"]
            ENRICHED["Enriched (1)<br/>customer_360"]
            SIGNALS["Signals (3)<br/>risk · alerts · metrics"]
            DECISIONS["Decisions (2)<br/>recommendations · decisions"]
            ACTIONS["Actions (2)<br/>agent_actions"]
            AUDIT["Audit (2)<br/>inference · log"]
        end

        subgraph FLINK["Apache Flink SQL — 10 Jobs"]
            direction LR
            FL1["Validation<br/>clean-orders · clean-payments"]
            FL2["Enrichment<br/>customer-360"]
            FL3["Fleet Metrics<br/>vehicle aggregations"]
            FL4["Risk Scoring<br/>windowed · multi-signal"]
        end

        subgraph GOVERNANCE["Stream Governance"]
            direction LR
            SR["Schema Registry<br/>16 Avro Schemas"]
            DC["Data Contracts<br/>Compatibility Rules"]
            PII["PII Classification<br/>HASH · REDACT · MASK"]
            LIN["Stream Lineage<br/>Cross-Domain Graph"]
        end
    end

    subgraph AGENTS["AI Processing"]
        direction LR
        FA1["Delay Agent"]
        FA2["Cold Chain Agent"]
        FA3["Safety Agent"]
        FA4["Maintenance Agent"]
        RA1["Risk Scorer"]
        RA2["Recommendation Engine<br/>Claude API"]
    end

    subgraph APP["Application Layer"]
        direction LR
        API["Fastify API<br/>REST + SSE"]
        WORKER["Background Worker<br/>Generators + Agents"]
        DASH["React Dashboard<br/>Real-Time UI"]
    end

    FG --> F_RAW
    RG --> R_RAW
    EXT --> F_RAW
    EXT --> R_RAW

    F_RAW --> FL3
    R_RAW --> FL1
    FL1 --> CURATED
    CURATED --> FL2
    FL2 --> ENRICHED
    FL3 --> SIGNALS
    FL4 --> SIGNALS
    ENRICHED --> FL4

    SIGNALS --> FA1
    SIGNALS --> FA2
    SIGNALS --> FA3
    SIGNALS --> FA4
    SIGNALS --> RA1
    RA1 --> RA2

    FA1 --> DECISIONS
    FA2 --> DECISIONS
    FA3 --> DECISIONS
    FA4 --> DECISIONS
    RA2 --> DECISIONS

    DECISIONS --> ACTIONS
    DECISIONS --> AUDIT

    DECISIONS --> API
    API --> DASH
    WORKER --> F_RAW
    WORKER --> R_RAW

    SR -.->|validates| TOPICS
    LIN -.->|traces| DASH

    style CONFLUENT fill:#f8f9ff,stroke:#4f46e5,stroke-width:2px
    style TOPICS fill:#fff8f0,stroke:#f59e0b,stroke-width:1px
    style FLINK fill:#fdf4ff,stroke:#a855f7,stroke-width:1px
    style GOVERNANCE fill:#f0fdf4,stroke:#22c55e,stroke-width:1px
    style AGENTS fill:#fff1f2,stroke:#f43f5e,stroke-width:1px
    style INGESTION fill:#f0f9ff,stroke:#0ea5e9,stroke-width:1px
    style APP fill:#f8fafc,stroke:#64748b,stroke-width:1px
```

### Seven-Layer Data Flow

```mermaid
flowchart LR
    L1["**Layer 1**<br/>Event Generation<br/>──────────<br/>Mock Generators<br/>IoT Sensors<br/>Connectors"]
    L2["**Layer 2**<br/>Raw Kafka Topics<br/>──────────<br/>fleet.telemetry.raw<br/>retail.orders.raw<br/>+25 more topics"]
    L3["**Layer 3**<br/>Flink SQL<br/>──────────<br/>Validation<br/>Enrichment<br/>Aggregation"]
    L4["**Layer 4**<br/>Signal Generation<br/>──────────<br/>Risk Scoring<br/>Windowed Events<br/>State Correlation"]
    L5["**Layer 5**<br/>AI Agents<br/>──────────<br/>Decision Logic<br/>Claude API<br/>Confidence Scoring"]
    L6["**Layer 6**<br/>API + State<br/>──────────<br/>Kafka Consumer<br/>SSE Broadcast<br/>REST Endpoints"]
    L7["**Layer 7**<br/>Dashboard<br/>──────────<br/>Real-Time UI<br/>Lineage Graph<br/>Governance Views"]

    L1 --> L2 --> L3 --> L4 --> L5 --> L6 --> L7

    style L1 fill:#dbeafe,stroke:#3b82f6,stroke-width:1px,color:#1e3a5f
    style L2 fill:#fef3c7,stroke:#f59e0b,stroke-width:1px,color:#78350f
    style L3 fill:#f3e8ff,stroke:#a855f7,stroke-width:1px,color:#4a044e
    style L4 fill:#dcfce7,stroke:#22c55e,stroke-width:1px,color:#14532d
    style L5 fill:#ffe4e6,stroke:#f43f5e,stroke-width:1px,color:#881337
    style L6 fill:#fefce8,stroke:#eab308,stroke-width:1px,color:#713f12
    style L7 fill:#e0f2fe,stroke:#0284c7,stroke-width:1px,color:#0c4a6e
```

### Technology Stack

```mermaid
graph LR
    subgraph FE["Frontend"]
        REACT["React 19"]
        VITE["Vite"]
        TAILWIND["Tailwind CSS v4"]
    end

    subgraph BE["Backend"]
        NODE["Node.js 22+"]
        FASTIFY["Fastify 5"]
        TS["TypeScript"]
        KJS["KafkaJS"]
    end

    subgraph AI["AI / LLM"]
        CLAUDE["Claude Sonnet 4"]
        WATSON["IBM WatsonX"]
    end

    subgraph INFRA["Confluent Cloud"]
        KAFKA["Apache Kafka 7.9"]
        FLINK_TECH["Flink SQL"]
        SCHEMA["Schema Registry"]
        CONNECT_TECH["Kafka Connect"]
    end

    subgraph DATA["Data"]
        AVRO["Avro Schemas"]
        PG["PostgreSQL 17"]
        MEM["In-Memory State"]
    end

    FE --> BE
    BE --> INFRA
    BE --> AI
    INFRA --> DATA

    style FE fill:#dbeafe,stroke:#3b82f6,stroke-width:1px
    style BE fill:#dcfce7,stroke:#22c55e,stroke-width:1px
    style AI fill:#ffe4e6,stroke:#f43f5e,stroke-width:1px
    style INFRA fill:#fef3c7,stroke:#f59e0b,stroke-width:1px
    style DATA fill:#f3e8ff,stroke:#a855f7,stroke-width:1px
```

---

## Quick Start

### Prerequisites

- **Node.js** >= 22.x
- **npm** >= 10.x
- **Confluent Cloud** account (free trial available)
- **Anthropic API Key** (for AI recommendations)

### 1. Clone and Install

```bash
git clone <repo-url>
cd SignalTwinAI
npm run setup
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Confluent Cloud credentials:

```env
USE_CONFLUENT=cloud
CONFLUENT_BOOTSTRAP_SERVERS=pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
CONFLUENT_API_KEY=your-api-key
CONFLUENT_API_SECRET=your-api-secret
CONFLUENT_SCHEMA_REGISTRY_URL=https://psrc-xxxxx.us-east-1.aws.confluent.cloud
CONFLUENT_SCHEMA_REGISTRY_API_KEY=your-sr-key
CONFLUENT_SCHEMA_REGISTRY_API_SECRET=your-sr-secret

ANTHROPIC_API_KEY=sk-ant-your-key
API_PORT=3001
VITE_API_URL=http://localhost:3001
```

### 3. Set Up Confluent Cloud

```bash
# Create 27 topics
npm run infra:topics

# Register 16 Avro schemas
npm run infra:schemas

# Set data contracts
npm run infra:contracts
```

### 4. Deploy Flink SQL Jobs

Go to **Confluent Cloud → Flink → SQL Workspace** and run in order:

| File | Purpose |
|------|---------|
| `prepared/01-create-source-tables.sql` | Source table definitions |
| `prepared/02-clean-orders.sql` | Order validation |
| `prepared/03-clean-payments.sql` | Payment validation |
| `prepared/04-customer-360.sql` | Customer enrichment |
| `prepared/05-risk-signals.sql` | Risk scoring |
| `prepared/06-decisions.sql` | Decision routing |
| `prepared/10-fleet-source-tables.sql` | Fleet source tables |
| `prepared/11-fleet-metrics.sql` | Fleet aggregations |
| `prepared/12-fleet-risk-alerts.sql` | Risk alert generation |
| `prepared/13-fleet-agent-decisions.sql` | Agent decision routing |

### 5. Start All Services

```bash
npm run dev
```

| Service | URL | Description |
|---------|-----|-------------|
| Dashboard | http://localhost:5173 | React UI |
| API | http://localhost:3001 | REST + SSE |
| Worker | (background) | Generators + AI Agents |

---

## Use Cases

---

### 1. FleetOps Control Tower

> **Real-time logistics control tower with vehicle telemetry, cold-chain monitoring, and 4 autonomous AI agents.**

#### How FleetOps Uses Confluent Cloud

```mermaid
flowchart TD
    subgraph SOURCES["Data Sources"]
        direction LR
        S1["🚛 Vehicle ECU<br/>speed · fuel · engine"]
        S2["📍 GPS Telematics<br/>location · heading"]
        S3["🌡️ Reefer Unit<br/>temp · humidity · door"]
        S4["👤 Driver App<br/>events · behavior"]
        S5["📦 Order System<br/>deliveries · ETA"]
    end

    subgraph CC_KAFKA["Confluent Cloud — Kafka Topics"]
        direction TB
        T1["fleet.telemetry.raw"]
        T2["fleet.location_updates.raw"]
        T3["fleet.coldchain.raw"]
        T4["fleet.driver_events.raw"]
        T5["fleet.route_events.raw"]
        T6["fleet.maintenance.raw"]
        T7["fleet.order_events.raw"]
        T8["fleet.support_events.raw"]
        T9["fleet.metrics.live"]
        T10["fleet.risk.alerts"]
        T11["fleet.agent.decisions"]
        T12["fleet.agent.actions"]
        T13["fleet.audit.log"]
    end

    subgraph CC_FLINK["Confluent Cloud — Flink SQL Jobs"]
        direction LR
        F1["fleet-metrics<br/>Vehicle aggregations<br/>5-min windows"]
        F2["fleet-risk-alerts<br/>Threshold detection<br/>breach · anomaly"]
        F3["fleet-agent-decisions<br/>Decision routing<br/>to agent topics"]
    end

    subgraph CC_GOV["Confluent Cloud — Stream Governance"]
        direction LR
        SL["⬡ Stream Lineage<br/>Producer → Topic → Flink<br/>→ Consumer visual graph"]
        SR["Schema Registry<br/>9 Avro schemas"]
        SC["Schema Compatibility<br/>BACKWARD · FULL"]
    end

    subgraph AGENTS["AI Agents — Worker Service"]
        direction LR
        A1["⏱ Delay Agent<br/>ETA drift detection<br/>→ REROUTE"]
        A2["🌡 Cold Chain Agent<br/>Temp breach detection<br/>→ PRIORITY_DELIVERY"]
        A3["🛡 Safety Agent<br/>Harsh braking · speed<br/>→ MANDATORY_REST"]
        A4["🔧 Maintenance Agent<br/>Fault codes · engine<br/>→ VEHICLE_SWAP"]
    end

    subgraph DASHBOARD["CTO Dashboard"]
        direction LR
        D1["Control Tower<br/>Fleet overview"]
        D2["Stream Lineage<br/>Live edge animation"]
        D3["Governance<br/>Schema · PII · lineage"]
        D4["Incidents<br/>Alert management"]
    end

    S1 --> T1
    S2 --> T2
    S3 --> T3
    S4 --> T4
    S5 --> T5
    S1 --> T6

    T1 --> F1
    T2 --> F1
    T5 --> F1
    T3 --> F2
    T4 --> F2
    T6 --> F2
    T7 --> F2
    T8 --> F2
    T1 --> F2

    F1 --> T9
    F2 --> T10

    T9 --> A1
    T10 --> A2
    T10 --> A3
    T10 --> A4

    A1 --> T11
    A2 --> T11
    A3 --> T11
    A4 --> T11

    T11 --> T12
    T11 --> T13

    T11 --> DASHBOARD
    T9 --> DASHBOARD

    SL -.->|"auto-traces all flows"| DASHBOARD
    SR -.->|"validates schema"| T1
    SR -.->|"validates schema"| T3

    style SOURCES fill:#f0f9ff,stroke:#0ea5e9,stroke-width:1px
    style CC_KAFKA fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    style CC_FLINK fill:#f3e8ff,stroke:#a855f7,stroke-width:2px
    style CC_GOV fill:#f0fdf4,stroke:#22c55e,stroke-width:2px
    style AGENTS fill:#fff1f2,stroke:#f43f5e,stroke-width:1px
    style DASHBOARD fill:#f0f9ff,stroke:#0284c7,stroke-width:1px
```

#### Fleet Topics (13)

| Layer | Topic | Description |
|-------|-------|-------------|
| Raw | `fleet.telemetry.raw` | Speed, fuel, engine temp, GPS |
| Raw | `fleet.location_updates.raw` | GPS position updates |
| Raw | `fleet.driver_events.raw` | Harsh braking, speeding, fatigue |
| Raw | `fleet.order_events.raw` | Delivery order status |
| Raw | `fleet.route_events.raw` | Route planning and ETA |
| Raw | `fleet.coldchain.raw` | Refrigeration temp, humidity, door |
| Raw | `fleet.maintenance.raw` | Fault codes, engine health |
| Raw | `fleet.support_events.raw` | Driver support requests |
| Signals | `fleet.metrics.live` | Aggregated real-time fleet metrics |
| Signals | `fleet.risk.alerts` | Safety, cold-chain, maintenance alerts |
| Decisions | `fleet.agent.decisions` | AI agent recommendations |
| Actions | `fleet.agent.actions` | Executed operator/automated actions |
| Audit | `fleet.audit.log` | Complete audit trail |

#### AI Agents (4)

```mermaid
graph LR
    subgraph INPUTS["Input Topics"]
        I1["fleet.route_events.raw"]
        I2["fleet.telemetry.raw"]
        I3["fleet.coldchain.raw"]
        I4["fleet.driver_events.raw"]
        I5["fleet.maintenance.raw"]
        I6["fleet.risk.alerts"]
    end

    subgraph AGENTS["AI Agents"]
        DA["⏱ Delay Agent<br/>ETA drift · traffic"]
        CA["🌡 Cold Chain Agent<br/>Temp · humidity · door"]
        SA["🛡 Safety Agent<br/>Braking · speed · fatigue"]
        MA["🔧 Maintenance Agent<br/>Engine · fault codes"]
    end

    subgraph DECISIONS["fleet.agent.decisions"]
        D1["REROUTE"]
        D2["PRIORITY_DELIVERY<br/>REJECT_SHIPMENT"]
        D3["MANDATORY_REST<br/>DRIVER_COACHING"]
        D4["VEHICLE_SWAP<br/>SCHEDULE_SERVICE"]
    end

    I1 --> DA
    I2 --> DA
    I3 --> CA
    I6 --> CA
    I4 --> SA
    I2 --> SA
    I5 --> MA
    I2 --> MA

    DA --> D1
    CA --> D2
    SA --> D3
    MA --> D4

    style INPUTS fill:#fef3c7,stroke:#f59e0b,stroke-width:1px
    style AGENTS fill:#fff1f2,stroke:#f43f5e,stroke-width:1px
    style DECISIONS fill:#dcfce7,stroke:#22c55e,stroke-width:1px
```

#### Risk Thresholds

| Metric | Warning | Critical | Agent |
|--------|---------|----------|-------|
| ETA Drift | > 10 min | > 20 min | Delay Agent |
| Temp Deviation | > 2°C | > 5°C | Cold Chain Agent |
| Safety Score | < 70 | < 50 | Safety Agent |
| Maintenance Risk | > 40 | > 70 | Maintenance Agent |
| Engine Temp | > 100°C | > 110°C | Maintenance Agent |
| Speed | > 110 km/h | > 130 km/h | Safety Agent |

#### Example Decision

```json
{
  "agent_type": "coldchain_agent",
  "vehicle_id": "VEH-002",
  "severity": "CRITICAL",
  "recommendation": "PRIORITY_DELIVERY",
  "reason": "Temperature +8°C above setpoint for 12 minutes",
  "confidence": 0.95,
  "suggested_action": "Deliver within 30 minutes or reject shipment"
}
```

#### Dashboard Pages (6)

| Page | Route | Description |
|------|-------|-------------|
| Control Tower | `/fleet` | Fleet overview, metrics, active incidents |
| Vehicles | `/fleet/vehicles` | Vehicle grid with status indicators |
| Vehicle Detail | `/fleet/vehicles/:id` | Telemetry, route, cold-chain, AI decisions |
| Incidents | `/fleet/incidents` | Alert management and resolution tracking |
| AI Agents | `/fleet/agents` | Agent decision history and effectiveness |
| Stream Lineage | `/fleet/stream-lineage` | Live edge-animated lineage graph |

#### Schemas (9)

| Schema | Topic | Compatibility |
|--------|-------|---------------|
| `telemetry-event.avsc` | `fleet.telemetry.raw` | BACKWARD |
| `location-update.avsc` | `fleet.location_updates.raw` | BACKWARD |
| `driver-event.avsc` | `fleet.driver_events.raw` | BACKWARD |
| `route-event.avsc` | `fleet.route_events.raw` | BACKWARD |
| `coldchain-event.avsc` | `fleet.coldchain.raw` | **FULL** |
| `maintenance-event.avsc` | `fleet.maintenance.raw` | BACKWARD |
| `fleet-order-event.avsc` | `fleet.order_events.raw` | BACKWARD |
| `fleet-risk-alert.avsc` | `fleet.risk.alerts` | FORWARD |
| `fleet-agent-decision.avsc` | `fleet.agent.decisions` | **FULL** |

#### PII Fields

| Field | Schema | Classification | Handling |
|-------|--------|---------------|---------|
| `vehicle_id` | driver-event | Quasi-identifier | MASK |
| `lat`, `lng` | telemetry-event | Sensitive location | REDACT |
| `lat`, `lng` | location-update | Sensitive location | REDACT |
| `customer_name_hash` | fleet-order-event | Direct identifier | HASH |

---

### 2. RetailOps Control Tower

> **E-commerce risk, fraud detection, and VIP retention with real-time customer signal correlation.**

#### How RetailOps Uses Confluent Cloud

```mermaid
flowchart TD
    subgraph SOURCES["Data Sources"]
        direction LR
        S1["🛒 Order Service<br/>purchase events"]
        S2["💳 Payment Service<br/>transaction events"]
        S3["🎧 Support CRM<br/>ticket events"]
        S4["📦 Shipping System<br/>delivery events"]
        S5["👤 Customer DB<br/>profile updates"]
    end

    subgraph CC_KAFKA["Confluent Cloud — Kafka Topics"]
        direction TB
        subgraph RAW["Raw Layer (5)"]
            TR1["retail.orders.raw"]
            TR2["retail.payments.raw"]
            TR3["retail.support.raw"]
            TR4["retail.shipments.raw"]
            TR5["retail.customers.raw"]
        end
        subgraph CURATED["Curated Layer (4)"]
            TC1["retail.orders.clean"]
            TC2["retail.payments.clean"]
            TC3["retail.support.clean"]
            TC4["retail.shipments.clean"]
        end
        subgraph ENRICHED["Enriched Layer (1)"]
            TE1["retail.customer_360.enriched"]
        end
        subgraph SIGNALS["Signals Layer (1)"]
            TS1["retail.risk.signals"]
        end
        subgraph DECISIONS["Decisions Layer (1)"]
            TD1["retail.recommendations.decisions"]
        end
        subgraph TAIL["Actions + Audit (2)"]
            TA1["retail.agent_actions.actions"]
            TA2["retail.inference.audit"]
        end
    end

    subgraph CC_FLINK["Confluent Cloud — Flink SQL"]
        direction LR
        F1["02-clean-orders<br/>Validate · standardize"]
        F2["03-clean-payments<br/>Validate · currency"]
        F3["04-customer-360<br/>Temporal join"]
        F4["05-risk-signals<br/>Windowed scoring<br/>10-min · 24-h windows"]
        F5["06-decisions<br/>risk_summary view"]
    end

    subgraph AGENTS["AI Layer — Worker"]
        A1["Risk Scorer<br/>Multi-signal correlation"]
        A2["Recommendation Engine<br/>Claude API · audit hash"]
    end

    subgraph DASHBOARD["CTO Dashboard"]
        D1["Retail Dashboard<br/>KPIs + live feed"]
        D2["Stream Lineage<br/>Live edge animation"]
        D3["Customer 360<br/>Digital twin"]
        D4["Governance<br/>Schema · PII · contracts"]
    end

    S1 --> TR1
    S2 --> TR2
    S3 --> TR3
    S4 --> TR4
    S5 --> TR5

    TR1 --> F1 --> TC1
    TR2 --> F2 --> TC2
    TC1 --> F3
    TC2 --> F3
    TR5 --> F3
    F3 --> TE1
    TE1 --> F4
    TR3 --> F4
    TR4 --> F4
    F4 --> TS1

    TS1 --> A1 --> A2
    A2 --> TD1
    TD1 --> TA1
    TD1 --> TA2

    TD1 --> DASHBOARD
    TE1 --> DASHBOARD

    style SOURCES fill:#f0f9ff,stroke:#0ea5e9,stroke-width:1px
    style CC_KAFKA fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    style CC_FLINK fill:#f3e8ff,stroke:#a855f7,stroke-width:2px
    style AGENTS fill:#fff1f2,stroke:#f43f5e,stroke-width:1px
    style DASHBOARD fill:#f0f9ff,stroke:#0284c7,stroke-width:1px
    style RAW fill:#fff8f0,stroke:#f59e0b,stroke-width:1px
    style CURATED fill:#fdf4ff,stroke:#a855f7,stroke-width:1px
    style ENRICHED fill:#f0fdf4,stroke:#22c55e,stroke-width:1px
    style SIGNALS fill:#fefce8,stroke:#eab308,stroke-width:1px
    style DECISIONS fill:#dcfce7,stroke:#16a34a,stroke-width:1px
    style TAIL fill:#f8fafc,stroke:#64748b,stroke-width:1px
```

#### Risk Scoring Model

```mermaid
graph LR
    subgraph SIGNALS["Input Signals"]
        S1["Payment failures<br/>in 10 minutes"]
        S2["Shipment delayed<br/>on premium order"]
        S3["Negative support<br/>in 24 hours"]
        S4["Refund after<br/>shipment issue"]
        S5["VIP customer<br/>flag"]
    end

    subgraph SCORE["Risk Score Computation"]
        W1["+30 pts"]
        W2["+20 pts"]
        W3["+25 pts"]
        W4["+15 pts"]
        W5["+10 pts"]
        SUM["Total Score<br/>0 – 100"]
    end

    subgraph ACTION["Action Decision"]
        A1["Score > 60<br/>→ ESCALATE"]
        A2["Score 30–60<br/>→ MONITOR"]
        A3["Score < 30<br/>→ NO_ACTION"]
    end

    S1 --> W1
    S2 --> W2
    S3 --> W3
    S4 --> W4
    S5 --> W5

    W1 --> SUM
    W2 --> SUM
    W3 --> SUM
    W4 --> SUM
    W5 --> SUM

    SUM --> A1
    SUM --> A2
    SUM --> A3

    style SIGNALS fill:#fef3c7,stroke:#f59e0b,stroke-width:1px
    style SCORE fill:#f3e8ff,stroke:#a855f7,stroke-width:1px
    style ACTION fill:#dcfce7,stroke:#22c55e,stroke-width:1px
```

#### Retail Topics (14)

| Layer | Topic | Description |
|-------|-------|-------------|
| Raw | `retail.orders.raw` | Order creation events |
| Raw | `retail.payments.raw` | Payment transactions |
| Raw | `retail.support.raw` | Support ticket updates |
| Raw | `retail.shipments.raw` | Shipment tracking events |
| Raw | `retail.customers.raw` | Customer profile updates |
| Curated | `retail.orders.clean` | Validated orders |
| Curated | `retail.payments.clean` | Validated payments |
| Curated | `retail.support.clean` | Categorised support |
| Curated | `retail.shipments.clean` | Enriched shipments |
| Enriched | `retail.customer_360.enriched` | Unified customer profile |
| Signals | `retail.risk.signals` | Computed risk scores |
| Decisions | `retail.recommendations.decisions` | AI recommendations |
| Actions | `retail.agent_actions.actions` | Executed actions |
| Audit | `retail.inference.audit` | AI inference audit trail |

#### Dashboard Pages (7)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/retail` | KPIs, live event feed, recommendations |
| Digital Twin | `/retail/digital-twin` | Real-time customer state graph |
| Stream Lineage | `/retail/stream-lineage` | Live edge-animated lineage |
| Governance | `/retail/governance` | Schema, lineage, PII, contracts |
| Event Replay | `/retail/replay` | Historical scenario playback |
| Live Events | `/retail/events` | SSE event stream |
| Customers | `/retail/customers` | Customer list + detail |

---

## Stream Lineage

Stream Lineage visually traces every data flow — from producers and source connectors, through Kafka topics, Flink SQL jobs, and AI agents, to consumers and sink connectors — live and animated.

```mermaid
flowchart LR
    subgraph PRODUCE["Producers"]
        P1["Worker<br/>order-generator"]
        P2["Worker<br/>fleet-telemetry"]
    end

    subgraph RAW_T["Raw Topics"]
        R1["retail.orders.raw"]
        R2["fleet.telemetry.raw"]
    end

    subgraph PROC["Flink SQL / Agents"]
        FL["⚡ Flink SQL Job<br/>clean · enrich · score"]
        AG["● AI Agent<br/>decision logic · Claude"]
    end

    subgraph SIG["Signal Topics"]
        S1["retail.risk.signals"]
        S2["fleet.risk.alerts"]
    end

    subgraph DEC["Decision Topics"]
        D1["retail.recommendations.decisions"]
        D2["fleet.agent.decisions"]
    end

    subgraph CONSUME["Consumers"]
        C1["API Consumer<br/>retailops-api-state"]
        C2["API Consumer<br/>fleetops-api-state"]
    end

    P1 -->|"live"| R1
    P2 -->|"live"| R2
    R1 -->|"Flink transform"| FL
    R2 -->|"Flink aggregate"| FL
    FL --> S1
    FL --> S2
    S1 --> AG
    S2 --> AG
    AG --> D1
    AG --> D2
    D1 -->|"SSE broadcast"| C1
    D2 -->|"SSE broadcast"| C2

    style PRODUCE fill:#dbeafe,stroke:#3b82f6,stroke-width:1px
    style RAW_T fill:#fef3c7,stroke:#f59e0b,stroke-width:1px
    style PROC fill:#f3e8ff,stroke:#a855f7,stroke-width:1px
    style SIG fill:#fefce8,stroke:#eab308,stroke-width:1px
    style DEC fill:#dcfce7,stroke:#22c55e,stroke-width:1px
    style CONSUME fill:#ffe4e6,stroke:#f43f5e,stroke-width:1px
```

### Stream Lineage in Confluent Cloud

Confluent Cloud automatically builds the Stream Lineage graph once data flows. No extra configuration needed.

```
confluent.cloud → Cluster → ⬡ Stream Lineage
```

| Confluent Cloud Shows | SignalTwinAI Shows |
|-----------------------|-------------------|
| Producer nodes (KafkaJS clients) | Worker generators |
| Topic nodes with throughput stats | All 27 registered topics |
| Flink SQL job nodes | 10 active Flink jobs |
| Consumer group nodes | API consumer groups |
| Live message counts per edge | `/retail/stream-lineage` live SSE |

### Live Stream Lineage Dashboard

| URL | Scope |
|-----|-------|
| `/retail/stream-lineage` | Retail domain — live animated graph |
| `/fleet/stream-lineage` | Fleet domain — live animated graph |
| Governance → Stream Lineage tab | All domains combined |

---

## Governance

### CTO Core Engine

Every domain registers one definition file. The governance layer, API routes, and dashboard automatically discover all registered domains:

```mermaid
graph TB
    subgraph REGISTRY["Use Case Registry — packages/core"]
        direction LR
        DEF1["FleetOps Definition<br/>13 topics · 4 agents<br/>9 schemas · 4 PII fields"]
        DEF2["RetailOps Definition<br/>14 topics · 2 agents<br/>7 schemas · 7 PII fields"]
        DEF3["FinGuard · CareFlow<br/>GridWatch · NetPulse<br/>FactoryGuardian"]
    end

    subgraph FUNCTIONS["Generated From Registry"]
        direction LR
        F1["getCrossdomainLineage()"]
        F2["getPIIReport()"]
        F3["getDataContracts()"]
        F4["getGovernanceMetrics()"]
    end

    subgraph OUTPUTS["Auto-Discovered By"]
        direction LR
        O1["API Routes<br/>/governance/*"]
        O2["Dashboard<br/>Governance Page"]
        O3["Stream Lineage<br/>Lineage Graph"]
    end

    REGISTRY --> FUNCTIONS
    FUNCTIONS --> OUTPUTS

    style REGISTRY fill:#f0f9ff,stroke:#0ea5e9,stroke-width:1px
    style FUNCTIONS fill:#f3e8ff,stroke:#a855f7,stroke-width:1px
    style OUTPUTS fill:#dcfce7,stroke:#22c55e,stroke-width:1px
```

### Governance Dashboard

| Tab | Route | Contents |
|-----|-------|----------|
| Stream Catalog | Governance → Catalog | All 27+ topics, filterable by domain and layer |
| Stream Lineage | Governance → Stream Lineage | Live animated lineage graph |
| Data Lineage | Governance → Lineage | Static SVG lineage graph |
| Schema Registry | Governance → Schemas | PII tags, compatibility levels, field docs |
| Compliance | Governance → Compliance | PII inventory, contracts, audit stats |
| Flink Jobs | Governance → Flink | Running jobs, inputs, outputs |

---

## API Endpoints

### Health
- `GET /health` — Health check

### Events
- `GET /events/stream` — SSE stream of all events
- `GET /recommendations/stream` — SSE stream of AI recommendations

### Governance
- `GET /governance/domains` — Registered domain summaries
- `GET /governance/lineage` — Cross-domain lineage graph
- `GET /governance/lineage/:domain` — Domain-scoped lineage
- `GET /governance/lineage/stats` — Live per-topic throughput
- `GET /governance/lineage/stream` — SSE: `lineage-msg` + `lineage-stats`
- `GET /governance/topics` — All topics with metadata
- `GET /governance/topics/:domain` — Domain topics
- `GET /governance/schemas` — Schema Registry subjects
- `GET /governance/schemas/:subject` — Schema detail
- `GET /governance/pii` — PII field inventory
- `GET /governance/contracts` — Data contracts
- `GET /governance/metrics` — Governance metrics
- `GET /governance/agents` — AI agent definitions

### Fleet
- `GET /fleet/vehicles` — Vehicle list
- `GET /fleet/vehicles/:id` — Vehicle detail
- `GET /fleet/incidents` — Active incidents
- `GET /fleet/agents` — AI agent status

### Retail
- `GET /customers` — Customer list
- `GET /customers/:id` — Customer detail
- `GET /recommendations` — AI recommendations

### Actions
- `POST /actions` — Execute operator action

### Copilot
- `POST /api/copilot/chat` — AI copilot chat

---

## Repository Structure

```
SignalTwinAI/
├── packages/
│   ├── core/                     # CTO Core Engine
│   │   └── src/
│   │       ├── types.ts          # UseCaseDefinition, LineageNode, TopicStats
│   │       ├── use-case-registry.ts  # Domain registration
│   │       ├── governance.ts     # Lineage, PII, data contracts
│   │       └── definitions/
│   │           ├── fleet.ts      # FleetOps definition
│   │           ├── retail.ts     # RetailOps definition
│   │           └── ...           # Other domain definitions
│   ├── shared/                   # Types, constants, Kafka client
│   ├── schemas/avro/             # 16 Avro schema files
│   └── streaming/flink-sql/      # 10 Flink SQL scripts
│       └── prepared/             # Pre-configured for Confluent Cloud
│
├── apps/
│   ├── api/src/
│   │   ├── routes/               # REST + SSE endpoints
│   │   └── services/
│   │       ├── lineage-tracker.ts    # Live throughput tracking
│   │       ├── kafka-consumer.ts     # Multi-topic consumer
│   │       └── sse-manager.ts        # SSE broadcast channels
│   ├── worker/src/
│   │   ├── generators/           # Mock event generators
│   │   └── processors/           # AI agent implementations
│   └── dashboard/src/
│       ├── pages/
│       │   ├── StreamLineagePage.tsx  # Live lineage view
│       │   ├── GovernancePage.tsx
│       │   └── fleet/
│       └── components/
│
├── infra/confluent/              # Confluent Cloud setup scripts
├── test-stream-lineage.js        # E2E lineage test
├── STREAM_LINEAGE.md             # Lineage implementation guide
└── CONFLUENT_SETUP.md            # Confluent Cloud setup guide
```

---

## Testing

```bash
# Run all tests
npm test

# E2E Stream Lineage test (requires API running)
node test-stream-lineage.js

# Verify Confluent Cloud setup
node infra/confluent/verify-setup.js
```

### Manual Testing Checklist

1. `npm run dev` — start all services
2. Open http://localhost:5173 → select **FleetOps**
3. Watch live events on the Control Tower dashboard
4. Navigate to `/fleet/stream-lineage` — observe edges animate green as messages flow
5. Click any topic node — see upstream/downstream and live msg/s
6. Open Confluent Cloud → **⬡ Stream Lineage** — verify the same topology appears

---

## Documentation

| File | Contents |
|------|----------|
| `CONFLUENT_SETUP.md` | Confluent Cloud credentials and topic setup |
| `STREAM_LINEAGE.md` | Stream Lineage implementation and Confluent Cloud guide |
| `DATA_FLOW_GUIDE.md` | Detailed data flow for each domain |
| `ARCHITECTURE_FLOW_DIAGRAM.md` | Full architecture diagrams |
| `infra/confluent/FLINK_EXECUTION_GUIDE.md` | Flink SQL step-by-step |
| `infra/confluent/DEPLOYMENT_CHECKLIST.md` | Production deployment checklist |

---

## Acknowledgments

Built for the **2026 Confluent Hackathon** using:

- **Confluent Cloud** — Kafka · Flink SQL · Schema Registry · Stream Lineage · Stream Governance
- **Anthropic Claude** — AI recommendations and copilot
- **IBM WatsonX** — Enhanced AI processing
- **React 19 + Vite + Tailwind CSS v4** — Dashboard
- **Node.js 22 + Fastify 5 + TypeScript** — API and worker

---

**CTO — Control Tower Orchestra** · *The control tower for the AI era.*
