-- Curated payments: validated and standardized
CREATE TABLE clean_payments (
  event_id STRING,
  event_time TIMESTAMP(3),
  customer_id STRING,
  order_id STRING,
  payment_id STRING,
  failure_code STRING,
  amount DOUBLE,
  currency STRING,
  attempt_number INT,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'retail.payments.clean',
  'properties.bootstrap.servers' = 'pkc-oxqxx9.us-east-1.aws.confluent.cloud:9092',
  'format' = 'avro-confluent',
  'avro-confluent.url' = 'https://psrc-z6mnmyr.us-east-1.aws.confluent.cloud'
);

INSERT INTO clean_payments
SELECT
  event_id,
  event_time,
  customer_id,
  order_id,
  payment_id,
  failure_code,
  amount,
  UPPER(currency) AS currency,
  attempt_number
FROM raw_payments
WHERE payment_id IS NOT NULL;
