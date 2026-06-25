-- FleetOps Control Tower: Source table definitions for Confluent Cloud Flink

CREATE TABLE fleet_telemetry_raw (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  vehicle_id STRING,
  lat DOUBLE,
  lng DOUBLE,
  speed_kmh DOUBLE,
  heading INT,
  fuel_pct DOUBLE,
  engine_temp_c DOUBLE,
  odometer_km DOUBLE,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'fleet.telemetry.raw',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

CREATE TABLE fleet_route_events_raw (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  vehicle_id STRING,
  route_id STRING,
  origin STRING,
  destination STRING,
  planned_eta STRING,
  current_eta STRING,
  eta_drift_minutes INT,
  deviation_score DOUBLE,
  distance_remaining_km DOUBLE,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'fleet.route_events.raw',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

CREATE TABLE fleet_coldchain_raw (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  vehicle_id STRING,
  compartment_id STRING,
  current_temp_c DOUBLE,
  target_temp_c DOUBLE,
  deviation_c DOUBLE,
  door_open BOOLEAN,
  humidity_pct DOUBLE,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'fleet.coldchain.raw',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

CREATE TABLE fleet_maintenance_raw (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  vehicle_id STRING,
  fault_code STRING,
  engine_temp_c DOUBLE,
  oil_pressure_psi DOUBLE,
  brake_wear_pct DOUBLE,
  maintenance_risk_score DOUBLE,
  description STRING,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'fleet.maintenance.raw',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

CREATE TABLE fleet_driver_events_raw (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  vehicle_id STRING,
  deceleration_g DOUBLE,
  acceleration_g DOUBLE,
  speed_kmh DOUBLE,
  speed_limit_kmh DOUBLE,
  fatigue_score DOUBLE,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'fleet.driver_events.raw',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

CREATE TABLE fleet_order_events_raw (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  vehicle_id STRING,
  order_id STRING,
  customer_name_hash STRING,
  destination STRING,
  sla_deadline STRING,
  priority STRING,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'fleet.order_events.raw',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);
