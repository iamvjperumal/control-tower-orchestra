# Flink SQL Stream Processing Pipeline

This directory contains the Flink SQL definitions for the SignalTwin AI stream processing pipeline.

## Execution Order

Execute the SQL files in the following order:

### Retail Use Case
1. `01-create-source-tables.sql` - Create source tables for raw Kafka topics
2. `02-clean-orders.sql` - Create clean orders table and insert transformation
3. `03-clean-payments.sql` - Create clean payments table and insert transformation
4. `04-customer-360.sql` - Create customer 360 view with enrichment
5. `05-risk-signals.sql` - Create risk signals table with scoring logic
6. `06-decisions.sql` - Create decision routing view

### Fleet Use Case
7. `10-fleet-source-tables.sql` - Create fleet source tables
8. `11-fleet-metrics.sql` - Create fleet metrics tables with windowed aggregations
9. `13-fleet-agent-decisions.sql` - Create fleet agent decision sink tables
10. `12-fleet-risk-alerts.sql` - Insert fleet risk alerts (depends on tables from step 9)

## Configuration

Before executing, replace the following placeholders:
- `{{KAFKA_BROKERS}}` - Your Confluent Cloud Kafka bootstrap servers
- `{{SCHEMA_REGISTRY_URL}}` - Your Confluent Cloud Schema Registry URL

## Key Features

### Retail Pipeline
- **Data Cleansing**: Validates and standardizes orders and payments
- **Customer 360**: Enriched cross-domain customer view using upsert-kafka connector
- **Risk Scoring**: Real-time risk signal generation based on multiple factors
- **Decision Routing**: View for monitoring risk-based actions

### Fleet Pipeline
- **Windowed Metrics**: Tumbling windows for ETA drift, cold chain, safety, and maintenance
- **Risk Alerts**: Multi-source alert generation with severity classification
- **Agent Decisions**: Sink tables for AI agent recommendations and actions
- **Audit Trail**: Complete traceability for AI inference decisions

## Table Types

- **Source Tables**: Kafka connector with Avro format and watermarks
- **Sink Tables**: Kafka connector for append-only streams
- **Upsert Tables**: upsert-kafka connector for changelog streams with PRIMARY KEY
- **Views**: Logical views for monitoring (no physical storage)

## Notes

- All timestamps use `TIMESTAMP(3)` for millisecond precision
- Watermarks are set to 5 seconds for handling late-arriving events
- Windowed aggregations use tumbling windows for consistent time boundaries
- Primary keys are marked as NOT ENFORCED (Flink manages uniqueness)