-- FleetOps Control Tower: Risk alert generation

-- Generate risk alerts from ETA drift exceeding threshold
INSERT INTO fleet_risk_alerts
SELECT
  UUID() AS event_id,
  'fleet_risk_alert' AS event_type,
  window_end AS event_time,
  'flink-fleet-processor' AS source_system,
  vehicle_id,
  'eta_drift' AS alert_type,
  CASE
    WHEN max_eta_drift > 20 THEN 'critical'
    WHEN max_eta_drift > 10 THEN 'high'
    ELSE 'medium'
  END AS severity,
  CONCAT('ETA drift of ', CAST(max_eta_drift AS STRING), ' minutes detected') AS message,
  max_eta_drift * 3 AS risk_score
FROM fleet_eta_drift
WHERE max_eta_drift > 10;

-- Generate risk alerts from cold chain breaches
INSERT INTO fleet_risk_alerts
SELECT
  UUID() AS event_id,
  'fleet_risk_alert' AS event_type,
  window_end AS event_time,
  'flink-fleet-processor' AS source_system,
  vehicle_id,
  'cold_chain_breach' AS alert_type,
  CASE
    WHEN max_deviation > 5.0 THEN 'critical'
    WHEN max_deviation > 2.0 THEN 'high'
    ELSE 'medium'
  END AS severity,
  CONCAT('Cold chain deviation ', CAST(ROUND(max_deviation, 1) AS STRING), '°C in compartment ', compartment_id) AS message,
  LEAST(100, CAST(max_deviation * 15 AS INT)) AS risk_score
FROM fleet_coldchain_breaches
WHERE max_deviation > 2.0;

-- Generate risk alerts from low safety scores
INSERT INTO fleet_risk_alerts
SELECT
  UUID() AS event_id,
  'fleet_risk_alert' AS event_type,
  window_end AS event_time,
  'flink-fleet-processor' AS source_system,
  vehicle_id,
  'safety_alert' AS alert_type,
  CASE
    WHEN computed_safety_score < 50 THEN 'critical'
    WHEN computed_safety_score < 70 THEN 'high'
    ELSE 'medium'
  END AS severity,
  CONCAT('Safety score ', CAST(computed_safety_score AS STRING), ' — ', CAST(harsh_braking_count AS STRING), ' harsh braking events') AS message,
  100 - computed_safety_score AS risk_score
FROM fleet_safety_scores
WHERE computed_safety_score < 70;

-- Generate risk alerts from maintenance signals
INSERT INTO fleet_risk_alerts
SELECT
  UUID() AS event_id,
  'fleet_risk_alert' AS event_type,
  window_end AS event_time,
  'flink-fleet-processor' AS source_system,
  vehicle_id,
  'maintenance_warning' AS alert_type,
  CASE
    WHEN max_risk_score > 70 OR max_engine_temp > 110 THEN 'critical'
    WHEN max_risk_score > 40 OR max_engine_temp > 100 THEN 'high'
    ELSE 'medium'
  END AS severity,
  CONCAT('Maintenance risk ', CAST(CAST(max_risk_score AS INT) AS STRING), '% — engine temp ', CAST(ROUND(max_engine_temp, 0) AS STRING), '°C') AS message,
  CAST(max_risk_score AS INT) AS risk_score
FROM fleet_maintenance_risk
WHERE max_risk_score > 40 OR max_engine_temp > 100;
