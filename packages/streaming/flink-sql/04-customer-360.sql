-- Customer 360: enriched cross-domain view
CREATE TABLE enriched_customer_360 (
  customer_id STRING,
  tier STRING,
  lifetime_value DOUBLE,
  account_age_days INT,
  region STRING,
  latest_order_amount DOUBLE,
  latest_order_time TIMESTAMP(3),
  recent_failure_count BIGINT,
  event_time TIMESTAMP(3),
  PRIMARY KEY (customer_id) NOT ENFORCED
) WITH (
  'connector' = 'upsert-kafka',
  'topic' = 'retail.customer_360.enriched',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'key.format' = 'avro-confluent',
  'key.avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}',
  'value.format' = 'avro-confluent',
  'value.avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

INSERT INTO enriched_customer_360
SELECT
  c.customer_id,
  c.tier,
  c.lifetime_value,
  c.account_age_days,
  c.region,
  o.latest_order_amount,
  o.latest_order_time,
  COALESCE(p.recent_failure_count, 0) AS recent_failure_count,
  c.event_time
FROM raw_customers c
LEFT JOIN (
  SELECT
    customer_id,
    total_amount AS latest_order_amount,
    event_time AS latest_order_time,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY event_time DESC) AS rn
  FROM clean_orders
) o ON c.customer_id = o.customer_id AND o.rn = 1
LEFT JOIN (
  SELECT
    customer_id,
    COUNT(*) AS recent_failure_count
  FROM clean_payments
  WHERE failure_code IS NOT NULL
    AND event_time > CURRENT_TIMESTAMP - INTERVAL '10' MINUTE
  GROUP BY customer_id
) p ON c.customer_id = p.customer_id;
