-- FleetOps Control Tower: Live fleet metrics computation

-- ETA drift detection per vehicle over 10-minute tumbling windows
CREATE TABLE fleet_eta_drift (
  vehicle_id STRING,
  window_start TIMESTAMP(3),
  window_end TIMESTAMP(3),
  max_eta_drift INT,
  avg_eta_drift DOUBLE,
  update_count BIGINT,
  PRIMARY KEY (vehicle_id, window_start) NOT ENFORCED
) WITH (
  'connector' = 'upsert-kafka',
  'topic' = 'fleet.metrics.eta_drift',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'key.format' = 'avro-confluent',
  'key.avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}',
  'value.format' = 'avro-confluent',
  'value.avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

INSERT INTO fleet_eta_drift
SELECT
  vehicle_id,
  TUMBLE_START(event_time, INTERVAL '10' MINUTE) AS window_start,
  TUMBLE_END(event_time, INTERVAL '10' MINUTE) AS window_end,
  MAX(eta_drift_minutes) AS max_eta_drift,
  AVG(CAST(eta_drift_minutes AS DOUBLE)) AS avg_eta_drift,
  COUNT(*) AS update_count
FROM fleet_route_events_raw
WHERE eta_drift_minutes > 0
GROUP BY vehicle_id, TUMBLE(event_time, INTERVAL '10' MINUTE);

-- Cold chain breach detection with 5-minute windows
CREATE TABLE fleet_coldchain_breaches (
  vehicle_id STRING,
  compartment_id STRING,
  window_start TIMESTAMP(3),
  window_end TIMESTAMP(3),
  max_deviation DOUBLE,
  avg_temp DOUBLE,
  max_temp DOUBLE,
  min_temp DOUBLE,
  breach_count BIGINT,
  door_opened INT,
  PRIMARY KEY (vehicle_id, compartment_id, window_start) NOT ENFORCED
) WITH (
  'connector' = 'upsert-kafka',
  'topic' = 'fleet.metrics.coldchain_breaches',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'key.format' = 'avro-confluent',
  'key.avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}',
  'value.format' = 'avro-confluent',
  'value.avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

INSERT INTO fleet_coldchain_breaches
SELECT
  vehicle_id,
  compartment_id,
  TUMBLE_START(event_time, INTERVAL '5' MINUTE) AS window_start,
  TUMBLE_END(event_time, INTERVAL '5' MINUTE) AS window_end,
  MAX(deviation_c) AS max_deviation,
  AVG(current_temp_c) AS avg_temp,
  MAX(current_temp_c) AS max_temp,
  MIN(current_temp_c) AS min_temp,
  COUNT(CASE WHEN deviation_c > 2.0 THEN 1 END) AS breach_count,
  MAX(CASE WHEN door_open THEN 1 ELSE 0 END) AS door_opened
FROM fleet_coldchain_raw
GROUP BY vehicle_id, compartment_id, TUMBLE(event_time, INTERVAL '5' MINUTE);

-- Safety event aggregation per vehicle per hour
CREATE TABLE fleet_safety_scores (
  vehicle_id STRING,
  window_start TIMESTAMP(3),
  window_end TIMESTAMP(3),
  harsh_braking_count BIGINT,
  harsh_accel_count BIGINT,
  overspeed_count BIGINT,
  max_deceleration_g DOUBLE,
  max_speed_kmh DOUBLE,
  computed_safety_score INT,
  PRIMARY KEY (vehicle_id, window_start) NOT ENFORCED
) WITH (
  'connector' = 'upsert-kafka',
  'topic' = 'fleet.metrics.safety_scores',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'key.format' = 'avro-confluent',
  'key.avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}',
  'value.format' = 'avro-confluent',
  'value.avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

INSERT INTO fleet_safety_scores
SELECT
  vehicle_id,
  TUMBLE_START(event_time, INTERVAL '1' HOUR) AS window_start,
  TUMBLE_END(event_time, INTERVAL '1' HOUR) AS window_end,
  COUNT(CASE WHEN event_type = 'harsh_braking' THEN 1 END) AS harsh_braking_count,
  COUNT(CASE WHEN event_type = 'harsh_acceleration' THEN 1 END) AS harsh_accel_count,
  COUNT(CASE WHEN event_type = 'overspeed' THEN 1 END) AS overspeed_count,
  MAX(deceleration_g) AS max_deceleration_g,
  MAX(speed_kmh) AS max_speed_kmh,
  -- Safety score: starts at 100, deductions per event
  CAST(GREATEST(0, 100
    - COUNT(CASE WHEN event_type = 'harsh_braking' THEN 1 END) * 5
    - COUNT(CASE WHEN event_type = 'harsh_acceleration' THEN 1 END) * 3
    - COUNT(CASE WHEN event_type = 'overspeed' THEN 1 END) * 8
    - COUNT(CASE WHEN event_type = 'fatigue_alert' THEN 1 END) * 15
  ) AS INT) AS computed_safety_score
FROM fleet_driver_events_raw
GROUP BY vehicle_id, TUMBLE(event_time, INTERVAL '1' HOUR);

-- Maintenance risk scoring from telemetry
CREATE TABLE fleet_maintenance_risk (
  vehicle_id STRING,
  window_start TIMESTAMP(3),
  window_end TIMESTAMP(3),
  max_engine_temp DOUBLE,
  avg_engine_temp DOUBLE,
  max_risk_score DOUBLE,
  fault_count BIGINT,
  signal_count BIGINT,
  PRIMARY KEY (vehicle_id, window_start) NOT ENFORCED
) WITH (
  'connector' = 'upsert-kafka',
  'topic' = 'fleet.metrics.maintenance_risk',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'key.format' = 'avro-confluent',
  'key.avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}',
  'value.format' = 'avro-confluent',
  'value.avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

INSERT INTO fleet_maintenance_risk
SELECT
  vehicle_id,
  TUMBLE_START(event_time, INTERVAL '15' MINUTE) AS window_start,
  TUMBLE_END(event_time, INTERVAL '15' MINUTE) AS window_end,
  MAX(engine_temp_c) AS max_engine_temp,
  AVG(engine_temp_c) AS avg_engine_temp,
  MAX(maintenance_risk_score) AS max_risk_score,
  COUNT(CASE WHEN fault_code IS NOT NULL THEN 1 END) AS fault_count,
  COUNT(*) AS signal_count
FROM fleet_maintenance_raw
GROUP BY vehicle_id, TUMBLE(event_time, INTERVAL '15' MINUTE);
