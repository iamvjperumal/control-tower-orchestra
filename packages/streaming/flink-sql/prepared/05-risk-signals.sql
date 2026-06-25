-- Risk signals: windowed scoring logic
CREATE TABLE signals_risk (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  customer_id STRING,
  risk_score INT,
  payment_failures_10m BIGINT,
  has_premium_delay BOOLEAN,
  negative_support_24h BIGINT,
  is_vip BOOLEAN,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'retail.risk.signals',
  'properties.bootstrap.servers' = 'pkc-oxqxx9.us-east-1.aws.confluent.cloud:9092',
  'format' = 'avro-confluent',
  'avro-confluent.url' = 'https://psrc-z6mnmyr.us-east-1.aws.confluent.cloud'
);

INSERT INTO signals_risk
SELECT
  UUID() AS event_id,
  'risk-signal-generated' AS event_type,
  CURRENT_TIMESTAMP AS event_time,
  'flink-processor' AS source_system,
  customer_id,
  (
    CASE WHEN payment_failures_10m >= 2 THEN 30 ELSE 0 END +
    CASE WHEN has_premium_delay THEN 20 ELSE 0 END +
    CASE WHEN negative_support_24h > 0 THEN 25 ELSE 0 END +
    CASE WHEN is_vip THEN 10 ELSE 0 END
  ) AS risk_score,
  payment_failures_10m,
  has_premium_delay,
  negative_support_24h,
  is_vip
FROM (
  SELECT
    c.customer_id,
    COALESCE(pf.cnt, 0) AS payment_failures_10m,
    COALESCE(sd.has_delay, FALSE) AS has_premium_delay,
    COALESCE(st.neg_cnt, 0) AS negative_support_24h,
    (c.tier = 'vip') AS is_vip
  FROM raw_customers c
  LEFT JOIN (
    SELECT customer_id, COUNT(*) AS cnt
    FROM clean_payments
    WHERE failure_code IS NOT NULL
      AND event_time > CURRENT_TIMESTAMP - INTERVAL '10' MINUTE
    GROUP BY customer_id
  ) pf ON c.customer_id = pf.customer_id
  LEFT JOIN (
    SELECT DISTINCT s.customer_id, TRUE AS has_delay
    FROM raw_shipments s
    JOIN clean_orders o ON s.order_id = o.order_id AND o.is_premium = TRUE
    WHERE s.delay_hours > 0
  ) sd ON c.customer_id = sd.customer_id
  LEFT JOIN (
    SELECT customer_id, COUNT(*) AS neg_cnt
    FROM raw_support
    WHERE sentiment = 'negative'
      AND event_time > CURRENT_TIMESTAMP - INTERVAL '24' HOUR
    GROUP BY customer_id
  ) st ON c.customer_id = st.customer_id
)
WHERE (
  CASE WHEN payment_failures_10m >= 2 THEN 30 ELSE 0 END +
  CASE WHEN has_premium_delay THEN 20 ELSE 0 END +
  CASE WHEN negative_support_24h > 0 THEN 25 ELSE 0 END +
  CASE WHEN is_vip THEN 10 ELSE 0 END
) > 0;
