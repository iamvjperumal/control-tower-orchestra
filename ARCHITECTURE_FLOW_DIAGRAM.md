# CTO Platform: Complete Architecture Flow Diagram

## System Overview

```mermaid
graph TB
    subgraph "Use Case Registry"
        UCR[Use Case Registry<br/>packages/core]
        RETAIL[RetailOps Definition<br/>14 topics, 2 agents]
        FLEET[FleetOps Definition<br/>13 topics, 4 agents]
        FUTURE[Future Use Cases<br/>Pluggable]
        
        UCR --> RETAIL
        UCR --> FLEET
        UCR --> FUTURE
    end
    
    subgraph "Data Ingestion Layer"
        RG[Retail Generators<br/>Order, Payment, Support]
        FG[Fleet Generators<br/>Telemetry, Route, ColdChain]
        EXT[External Systems<br/>Connectors]
        
        RG --> KAFKA
        FG --> KAFKA
        EXT --> KAFKA
    end
    
    subgraph "Kafka Topics - 27 Total"
        KAFKA[Apache Kafka<br/>Message Broker]
        
        subgraph "Retail Topics - 14"
            R_RAW[Raw Layer<br/>orders, payments, support]
            R_CLEAN[Curated Layer<br/>validated data]
            R_ENRICH[Enriched Layer<br/>customer_360]
            R_SIGNAL[Signals Layer<br/>risk.signals]
            R_DEC[Decisions Layer<br/>recommendations]
            R_ACT[Actions Layer<br/>agent_actions]
            R_AUD[Audit Layer<br/>inference.audit]
        end
        
        subgraph "Fleet Topics - 13"
            F_RAW[Raw Layer<br/>telemetry, routes, coldchain]
            F_METRIC[Metrics Layer<br/>live metrics]
            F_ALERT[Alerts Layer<br/>risk.alerts]
            F_DEC[Decisions Layer<br/>agent.decisions]
            F_ACT[Actions Layer<br/>agent.actions]
            F_AUD[Audit Layer<br/>audit.log]
        end
    end
    
    subgraph "Stream Processing"
        FLINK[Apache Flink SQL<br/>10 Scripts]
        
        subgraph "Retail Processing"
            F_VALID[Validation<br/>clean-orders, clean-payments]
            F_ENR[Enrichment<br/>customer-360]
            F_RISK[Risk Computation<br/>windowed aggregations]
        end
        
        subgraph "Fleet Processing"
            F_METRICS[Metrics Computation<br/>vehicle metrics]
            F_ALERTS[Alert Generation<br/>risk alerts]
            F_ROUTE[Decision Routing<br/>agent decisions]
        end
    end
    
    subgraph "AI Processing Layer"
        RISK[Risk Scorer<br/>Stateful Processing]
        AI_ENG[AI Recommendation Engine<br/>Claude API]
        
        subgraph "Retail Agents - 2"
            R_RISK[Risk Scorer]
            R_AI[Recommendation Engine]
        end
        
        subgraph "Fleet Agents - 4"
            F_DELAY[Delay Agent]
            F_COLD[Cold Chain Agent]
            F_SAFE[Safety Agent]
            F_MAINT[Maintenance Agent]
        end
    end
    
    subgraph "Governance Layer"
        SR[Schema Registry<br/>16 Avro Schemas]
        DC[Data Contracts<br/>Compatibility Rules]
        PII[PII Classification<br/>HASH/REDACT/MASK]
        LIN[Lineage Tracking<br/>Cross-Domain Graph]
        
        SR --> DC
        SR --> PII
        SR --> LIN
    end
    
    subgraph "API Layer"
        API[Fastify API<br/>REST + SSE]
        CONSUMER[Kafka Consumer<br/>Multi-Topic]
        STATE[State Store<br/>In-Memory]
        SSE[SSE Manager<br/>Real-Time Broadcast]
        
        CONSUMER --> STATE
        STATE --> SSE
        API --> SSE
    end
    
    subgraph "Dashboard Layer"
        DASH[React Dashboard<br/>Vite + Tailwind]
        
        subgraph "Retail Pages - 7"
            R_DASH[Dashboard]
            R_TWIN[Digital Twin]
            R_GOV[Governance]
            R_REPLAY[Event Replay]
            R_EVENTS[Live Events]
            R_REC[Recommendations]
            R_CUST[Customers]
        end
        
        subgraph "Fleet Pages - 6"
            F_CTRL[Control Tower]
            F_VEH[Vehicles]
            F_DET[Vehicle Detail]
            F_INC[Incidents]
            F_AGENT[AI Agents]
            F_GOV[Governance]
        end
        
        subgraph "Shared Components"
            COMP[LineageGraph<br/>StreamCatalog<br/>SchemaViewer<br/>ComplianceDashboard]
        end
    end
    
    %% Flow connections
    KAFKA --> R_RAW
    KAFKA --> F_RAW
    
    R_RAW --> FLINK
    F_RAW --> FLINK
    
    FLINK --> R_CLEAN
    FLINK --> R_ENRICH
    FLINK --> F_METRIC
    
    R_ENRICH --> RISK
    F_METRIC --> RISK
    
    RISK --> R_SIGNAL
    RISK --> F_ALERT
    
    R_SIGNAL --> AI_ENG
    F_ALERT --> AI_ENG
    
    AI_ENG --> R_DEC
    AI_ENG --> F_DEC
    
    R_DEC --> CONSUMER
    F_DEC --> CONSUMER
    
    R_AUD --> CONSUMER
    F_AUD --> CONSUMER
    
    SSE --> DASH
    
    SR -.-> KAFKA
    DC -.-> KAFKA
    PII -.-> KAFKA
    LIN -.-> DASH
    
    UCR -.-> API
    UCR -.-> DASH
    
    style UCR fill:#e1f5ff
    style KAFKA fill:#fff4e6
    style FLINK fill:#f3e5f5
    style AI_ENG fill:#e8f5e9
    style SR fill:#fce4ec
    style DASH fill:#e0f2f1
```

## Seven-Layer Data Flow

```mermaid
flowchart TD
    subgraph L1["Layer 1: Event Generation"]
        GEN1[Mock Generators<br/>Scenario Orchestrator]
        GEN2[External Systems<br/>Connectors]
        GEN3[Real-Time Sources<br/>IoT Devices]
    end
    
    subgraph L2["Layer 2: Raw Kafka Topics"]
        RAW1[retail.orders.raw]
        RAW2[retail.payments.raw]
        RAW3[fleet.telemetry.raw]
        RAW4[fleet.coldchain.raw]
        RAW_MORE[... 23 more topics]
    end
    
    subgraph L3["Layer 3: Stream Processing - Flink SQL"]
        FLINK1[Validation<br/>Data Quality Checks]
        FLINK2[Standardization<br/>Schema Normalization]
        FLINK3[Enrichment<br/>Temporal Joins]
        FLINK4[Windowed Aggregations<br/>10m, 24h windows]
    end
    
    subgraph L4["Layer 4: Signal Generation"]
        RISK1[Risk Scorer<br/>Stateful Processing]
        RISK2[In-Memory State<br/>Customer/Vehicle State]
        RISK3[Time Windows<br/>Event Correlation]
        RISK4[Score Computation<br/>Multi-Signal Analysis]
    end
    
    subgraph L5["Layer 5: AI Recommendation Layer"]
        AI1[Action Determination<br/>Rule-Based Logic]
        AI2[Claude API Call<br/>Contextual Explanation]
        AI3[Confidence Scoring<br/>0.0 - 1.0]
        AI4[Audit Trail<br/>Prompt Hash + Latency]
    end
    
    subgraph L6["Layer 6: API & State Management"]
        API1[Kafka Consumer<br/>Multi-Topic Subscribe]
        API2[State Store<br/>In-Memory Cache]
        API3[SSE Manager<br/>Real-Time Broadcast]
        API4[REST Endpoints<br/>Query Interface]
    end
    
    subgraph L7["Layer 7: Dashboard Visualization"]
        DASH1[SSE Hooks<br/>Real-Time Updates]
        DASH2[React Components<br/>Event Feed, Lineage]
        DASH3[Governance Views<br/>Schema, PII, Contracts]
        DASH4[Domain Routing<br/>Retail vs Fleet]
    end
    
    GEN1 --> RAW1
    GEN2 --> RAW2
    GEN3 --> RAW3
    
    RAW1 --> FLINK1
    RAW2 --> FLINK1
    RAW3 --> FLINK1
    RAW4 --> FLINK1
    
    FLINK1 --> FLINK2
    FLINK2 --> FLINK3
    FLINK3 --> FLINK4
    
    FLINK4 --> RISK1
    RISK1 --> RISK2
    RISK2 --> RISK3
    RISK3 --> RISK4
    
    RISK4 --> AI1
    AI1 --> AI2
    AI2 --> AI3
    AI3 --> AI4
    
    AI4 --> API1
    API1 --> API2
    API2 --> API3
    API3 --> API4
    
    API3 --> DASH1
    API4 --> DASH1
    DASH1 --> DASH2
    DASH2 --> DASH3
    DASH3 --> DASH4
    
    style L1 fill:#e3f2fd
    style L2 fill:#fff3e0
    style L3 fill:#f3e5f5
    style L4 fill:#e8f5e9
    style L5 fill:#fce4ec
    style L6 fill:#fff9c4
    style L7 fill:#e0f2f1
```

## RetailOps Complete Flow

```mermaid
sequenceDiagram
    participant Worker as Worker<br/>Event Generator
    participant Kafka as Kafka Topics
    participant Flink as Flink SQL<br/>Processing
    participant Risk as Risk Scorer<br/>Stateful
    participant AI as AI Engine<br/>Claude API
    participant API as API Server<br/>State Store
    participant SSE as SSE Manager
    participant Dashboard as React Dashboard
    
    Note over Worker,Dashboard: Fraud Scenario: Customer c-1003
    
    Worker->>Kafka: order-created → retail.orders.raw
    Note right of Kafka: T+0s
    
    Worker->>Kafka: payment-failed (1st) → retail.payments.raw
    Note right of Kafka: T+2s
    
    Worker->>Kafka: payment-failed (2nd) → retail.payments.raw
    Note right of Kafka: T+5s
    
    Kafka->>Risk: Consume payment events
    Risk->>Risk: Detect: 2 failures in 10m window
    Risk->>Risk: Compute: risk_score = 30
    Risk->>Kafka: risk-signal → retail.risk.signals
    Note right of Kafka: T+5.1s
    
    Worker->>Kafka: shipment-delayed → retail.shipments.raw
    Note right of Kafka: T+7s
    
    Kafka->>Risk: Consume shipment event
    Risk->>Risk: Detect: Premium order delay
    Risk->>Risk: Update: risk_score = 50
    Risk->>Kafka: risk-signal → retail.risk.signals
    Note right of Kafka: T+7.1s
    
    Worker->>Kafka: support-ticket (negative) → retail.support.raw
    Note right of Kafka: T+8.5s
    
    Kafka->>Risk: Consume support event
    Risk->>Risk: Detect: Negative sentiment in 24h
    Risk->>Risk: Update: risk_score = 75 (CRITICAL!)
    Risk->>Kafka: risk-signal → retail.risk.signals
    Note right of Kafka: T+8.6s
    
    Kafka->>AI: Consume high-risk signal
    AI->>AI: Determine: ESCALATE_FRAUD_REVIEW
    AI->>AI: Call Claude API for explanation
    AI->>AI: Generate: confidence = 0.86
    AI->>Kafka: recommendation → retail.recommendations.decisions
    AI->>Kafka: audit-record → retail.inference.audit
    Note right of Kafka: T+8.7s
    
    Kafka->>API: Consume recommendation
    API->>API: Update state store
    API->>SSE: Broadcast to clients
    Note right of API: T+8.8s
    
    SSE->>Dashboard: SSE event: recommendation
    Dashboard->>Dashboard: Update UI: 🔴 CRITICAL
    Note right of Dashboard: T+8.85s
    
    Note over Worker,Dashboard: Total Latency: 8.85 seconds
```

## FleetOps Complete Flow

```mermaid
sequenceDiagram
    participant Worker as Worker<br/>Fleet Generator
    participant Kafka as Kafka Topics
    participant Agents as Fleet AI Agents<br/>4 Specialized
    participant API as API Server
    participant Dashboard as Fleet Dashboard
    
    Note over Worker,Dashboard: Cold Chain Breach: Vehicle VH-2041
    
    Worker->>Kafka: telemetry → fleet.telemetry.raw
    Note right of Kafka: T+0s: Normal operation
    
    Worker->>Kafka: route-event → fleet.route_events.raw
    Note right of Kafka: T+5s: ETA drift detected
    
    Worker->>Kafka: coldchain-event → fleet.coldchain.raw
    Note right of Kafka: T+10s: Temperature rising
    
    Kafka->>Agents: Cold Chain Agent consumes
    Agents->>Agents: Detect: Temp deviation > 5°C
    Agents->>Agents: Compute: risk_score = 65 (CRITICAL)
    Agents->>Kafka: risk-alert → fleet.risk.alerts
    Note right of Kafka: T+10.1s
    
    Kafka->>Agents: Delay Agent consumes ETA drift
    Agents->>Agents: Recommend: REROUTE_VEHICLE
    Agents->>Agents: Recommend: NOTIFY_CUSTOMER
    Agents->>Kafka: decision → fleet.agent.decisions
    Note right of Kafka: T+10.2s
    
    Kafka->>Agents: Cold Chain Agent processes alert
    Agents->>Agents: Call Claude API
    Agents->>Agents: Action: ESCALATE_COLDCHAIN_INCIDENT
    Agents->>Kafka: decision → fleet.agent.decisions
    Agents->>Kafka: audit → fleet.audit.log
    Note right of Kafka: T+10.3s
    
    Kafka->>API: Consume agent decisions
    API->>API: Update vehicle state
    API->>Dashboard: SSE broadcast
    Note right of API: T+10.4s
    
    Dashboard->>Dashboard: Show: 🔴 CRITICAL incident VH-2041
    Note right of Dashboard: T+10.45s
    
    Note over Worker,Dashboard: Total Latency: 10.45 seconds
```

## Governance Architecture

```mermaid
graph TB
    subgraph "Schema Registry & Governance"
        SR[Schema Registry<br/>16 Avro Schemas]
        
        subgraph "Retail Schemas - 7"
            RS1[order-created.avsc]
            RS2[payment-failed.avsc]
            RS3[support-ticket-updated.avsc]
            RS4[shipment-delayed.avsc]
            RS5[customer-profile-updated.avsc]
            RS6[risk-signal-generated.avsc]
            RS7[ai-recommendation-created.avsc]
        end
        
        subgraph "Fleet Schemas - 9"
            FS1[fleet-telemetry.avsc]
            FS2[fleet-route-event.avsc]
            FS3[fleet-coldchain.avsc]
            FS4[fleet-driver-event.avsc]
            FS5[fleet-maintenance.avsc]
            FS6[fleet-order-event.avsc]
            FS7[fleet-risk-alert.avsc]
            FS8[fleet-agent-decision.avsc]
            FS9[fleet-audit-entry.avsc]
        end
    end
    
    subgraph "Data Contracts"
        DC1[Compatibility Rules<br/>BACKWARD/FORWARD/FULL]
        DC2[Schema Evolution<br/>Version Management]
        DC3[Breaking Change Detection<br/>Pre-Deployment Validation]
    end
    
    subgraph "PII Classification"
        PII1[DIRECT PII<br/>email, phone, SSN]
        PII2[QUASI PII<br/>zip code, age, gender]
        PII3[SENSITIVE PII<br/>health, financial]
        
        HANDLE1[HASH<br/>SHA-256]
        HANDLE2[REDACT<br/>Remove completely]
        HANDLE3[MASK<br/>Partial visibility]
        HANDLE4[ENCRYPT<br/>AES-256]
    end
    
    subgraph "Lineage Tracking"
        LIN1[Cross-Domain Graph<br/>27 Topics]
        LIN2[Processing Nodes<br/>Flink, Risk Scorer, AI]
        LIN3[Data Flow Edges<br/>Topic → Processor → Topic]
        LIN4[Domain Filtering<br/>Retail vs Fleet]
    end
    
    subgraph "Compliance Dashboard"
        COMP1[Stream Catalog<br/>All 27 Topics]
        COMP2[Schema Browser<br/>PII Badges]
        COMP3[Lineage Visualization<br/>Interactive Graph]
        COMP4[Governance Metrics<br/>Domains, Topics, Schemas]
    end
    
    SR --> DC1
    SR --> PII1
    SR --> LIN1
    
    DC1 --> DC2
    DC2 --> DC3
    
    PII1 --> HANDLE1
    PII2 --> HANDLE2
    PII3 --> HANDLE3
    
    LIN1 --> LIN2
    LIN2 --> LIN3
    LIN3 --> LIN4
    
    DC3 --> COMP1
    HANDLE4 --> COMP2
    LIN4 --> COMP3
    
    COMP1 --> COMP4
    COMP2 --> COMP4
    COMP3 --> COMP4
    
    style SR fill:#fce4ec
    style DC1 fill:#e8f5e9
    style PII1 fill:#fff3e0
    style LIN1 fill:#e1f5ff
    style COMP1 fill:#f3e5f5
```

## Technology Stack & Infrastructure

```mermaid
graph LR
    subgraph "Frontend Stack"
        REACT[React 19<br/>UI Framework]
        VITE[Vite<br/>Build Tool]
        TAIL[Tailwind CSS v4<br/>Styling]
        SSE_FE[SSE Hooks<br/>Real-Time Updates]
    end
    
    subgraph "Backend Stack"
        NODE[Node.js 22+<br/>Runtime]
        FAST[Fastify 5<br/>API Framework]
        TS[TypeScript<br/>Language]
        KAFKA_JS[KafkaJS<br/>Client Library]
    end
    
    subgraph "AI Stack"
        CLAUDE[Claude Sonnet 4<br/>LLM]
        ANTHROPIC[Anthropic API<br/>SDK]
        PROMPT[Prompt Engineering<br/>Context Management]
    end
    
    subgraph "Streaming Stack"
        KAFKA_INFRA[Apache Kafka 7.9.0<br/>Message Broker]
        ZK[Zookeeper<br/>Coordination]
        SR_INFRA[Schema Registry 7.9.0<br/>Schema Management]
        FLINK_INFRA[Apache Flink SQL<br/>Stream Processing]
        CONNECT[Kafka Connect<br/>Connectors]
    end
    
    subgraph "Data Stack"
        PG[PostgreSQL 17<br/>Relational DB]
        MEM[In-Memory State<br/>State Store]
        AVRO[Avro Schemas<br/>Serialization]
    end
    
    subgraph "DevOps Stack"
        DOCKER[Docker<br/>Containerization]
        COMPOSE[Docker Compose<br/>Orchestration]
        NPM[npm Workspaces<br/>Monorepo]
    end
    
    REACT --> VITE
    VITE --> TAIL
    REACT --> SSE_FE
    
    NODE --> FAST
    FAST --> TS
    TS --> KAFKA_JS
    
    CLAUDE --> ANTHROPIC
    ANTHROPIC --> PROMPT
    
    KAFKA_INFRA --> ZK
    KAFKA_INFRA --> SR_INFRA
    KAFKA_INFRA --> FLINK_INFRA
    KAFKA_INFRA --> CONNECT
    
    PG --> MEM
    SR_INFRA --> AVRO
    
    DOCKER --> COMPOSE
    COMPOSE --> NPM
    
    SSE_FE -.-> FAST
    KAFKA_JS -.-> KAFKA_INFRA
    PROMPT -.-> FAST
    AVRO -.-> KAFKA_INFRA
    
    style REACT fill:#61dafb
    style NODE fill:#68a063
    style CLAUDE fill:#d97757
    style KAFKA_INFRA fill:#231f20
    style PG fill:#336791
    style DOCKER fill:#2496ed
```

## Performance & Latency Breakdown

```mermaid
gantt
    title End-to-End Latency: Event to Dashboard (Typical: 200-300ms)
    dateFormat X
    axisFormat %L ms
    
    section Event Flow
    Event Generation → Kafka Write           :0, 10
    Kafka Write → Consumer Read              :10, 60
    Consumer Read → Risk Scoring             :60, 80
    Risk Scoring → AI Recommendation         :80, 280
    AI Recommendation → API State Update     :280, 290
    API State Update → SSE Broadcast         :290, 295
    SSE Broadcast → Dashboard Update         :295, 300
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DEV_LOCAL[Local Docker Compose<br/>All Services]
        DEV_KAFKA[Kafka + ZK + SR<br/>localhost:9092]
        DEV_PG[PostgreSQL<br/>localhost:5434]
        DEV_API[API Server<br/>localhost:3001]
        DEV_DASH[Dashboard<br/>localhost:5173]
    end
    
    subgraph "Production Environment - Confluent Cloud"
        PROD_KAFKA[Confluent Cloud Kafka<br/>Managed Cluster]
        PROD_SR[Confluent Schema Registry<br/>Managed]
        PROD_FLINK[Confluent Flink<br/>Managed SQL]
        PROD_GOV[Stream Governance<br/>Lineage + Catalog]
    end
    
    subgraph "Application Deployment"
        PROD_API[API Server<br/>Cloud Run / ECS]
        PROD_WORKER[Worker<br/>Cloud Run / ECS]
        PROD_DASH[Dashboard<br/>Vercel / Netlify]
        PROD_PG[PostgreSQL<br/>Cloud SQL / RDS]
    end
    
    DEV_LOCAL --> DEV_KAFKA
    DEV_LOCAL --> DEV_PG
    DEV_LOCAL --> DEV_API
    DEV_LOCAL --> DEV_DASH
    
    PROD_KAFKA --> PROD_SR
    PROD_KAFKA --> PROD_FLINK
    PROD_SR --> PROD_GOV
    
    PROD_API --> PROD_KAFKA
    PROD_WORKER --> PROD_KAFKA
    PROD_DASH --> PROD_API
    PROD_API --> PROD_PG
    
    style DEV_LOCAL fill:#e3f2fd
    style PROD_KAFKA fill:#fff3e0
    style PROD_API fill:#e8f5e9
```

## Key Metrics & Monitoring

```mermaid
graph TB
    subgraph "System Metrics"
        M1[Event Throughput<br/>Events/sec per topic]
        M2[Consumer Lag<br/>Messages behind]
        M3[Processing Latency<br/>End-to-end time]
        M4[Error Rate<br/>Failed messages]
    end
    
    subgraph "Business Metrics"
        B1[Risk Signals Generated<br/>Per domain]
        B2[AI Recommendations<br/>Per hour]
        B3[High-Risk Escalations<br/>Score > 60]
        B4[Agent Decisions<br/>Per agent type]
    end
    
    subgraph "Governance Metrics"
        G1[Schema Versions<br/>Active schemas]
        G2[PII Fields Tracked<br/>Classification count]
        G3[Data Contract Violations<br/>Compatibility errors]
        G4[Lineage Depth<br/>Processing hops]
    end
    
    subgraph "AI Metrics"
        A1[Claude API Latency<br/>Response time]
        A2[Confidence Scores<br/>Average per domain]
        A3[Prompt Token Usage<br/>Cost tracking]
        A4[Inference Audit Trail<br/>Complete records]
    end
    
    M1 --> DASH_METRICS[Metrics Dashboard]
    M2 --> DASH_METRICS
    M3 --> DASH_METRICS
    M4 --> DASH_METRICS
    
    B1 --> DASH_METRICS
    B2 --> DASH_METRICS
    B3 --> DASH_METRICS
    B4 --> DASH_METRICS
    
    G1 --> DASH_GOV[Governance Dashboard]
    G2 --> DASH_GOV
    G3 --> DASH_GOV
    G4 --> DASH_GOV
    
    A1 --> DASH_AI[AI Performance Dashboard]
    A2 --> DASH_AI
    A3 --> DASH_AI
    A4 --> DASH_AI
    
    style DASH_METRICS fill:#e8f5e9
    style DASH_GOV fill:#fce4ec
    style DASH_AI fill:#fff3e0
```

---

## Summary

This architecture demonstrates:

1. **Multi-Domain Support**: Pluggable use case registry pattern
2. **Real-Time Processing**: Sub-second latency through 7 layers
3. **Governed Data Flow**: Schema Registry, PII classification, lineage tracking
4. **AI-Enhanced Decisions**: Claude API integration with audit trails
5. **Scalable Architecture**: Kafka-centric event-driven design
6. **Developer Experience**: Monorepo structure with shared packages
7. **Production Ready**: Confluent Cloud deployment path

**Total Coverage**:
- 27 Kafka Topics (14 Retail + 13 Fleet)
- 16 Avro Schemas with PII classification
- 10 Flink SQL scripts for stream processing
- 6 AI Agents (2 Retail + 4 Fleet)
- 13 Dashboard pages across both domains
- Complete governance layer with lineage tracking