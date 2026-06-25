-- FleetOps Control Tower: Agent decision sink tables

-- Sink for AI agent decisions
CREATE TABLE fleet_agent_decisions (
  decision_id STRING,
  agent_type STRING,
  vehicle_id STRING,
  severity STRING,
  reason STRING,
  recommended_action STRING,
  confidence DOUBLE,
  generated_at TIMESTAMP(3),
  status STRING
) WITH (
  'connector' = 'kafka',
  'topic' = 'fleet.agent.decisions',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

-- Sink for agent actions (operator responses)
CREATE TABLE fleet_agent_actions (
  action_id STRING,
  decision_id STRING,
  agent_type STRING,
  vehicle_id STRING,
  action_taken STRING,
  operator_id STRING,
  action_time TIMESTAMP(3),
  notes STRING
) WITH (
  'connector' = 'kafka',
  'topic' = 'fleet.agent.actions',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

-- Sink for risk alerts (produced by Flink enrichment)
CREATE TABLE fleet_risk_alerts (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  vehicle_id STRING,
  alert_type STRING,
  severity STRING,
  message STRING,
  risk_score INT
) WITH (
  'connector' = 'kafka',
  'topic' = 'fleet.risk.alerts',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

-- Audit log sink for inference traceability
CREATE TABLE fleet_audit_log (
  audit_id STRING,
  agent_type STRING,
  decision_id STRING,
  vehicle_id STRING,
  model_id STRING,
  prompt_hash STRING,
  input_context_hash STRING,
  confidence DOUBLE,
  latency_ms INT,
  audit_time TIMESTAMP(3)
) WITH (
  'connector' = 'kafka',
  'topic' = 'fleet.audit.log',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);
