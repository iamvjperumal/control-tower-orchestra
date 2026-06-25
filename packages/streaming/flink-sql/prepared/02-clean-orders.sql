-- Curated orders: validated and standardized
CREATE TABLE clean_orders (
  event_id STRING,
  event_time TIMESTAMP(3),
  customer_id STRING,
  order_id STRING,
  total_amount DOUBLE,
  currency STRING,
  item_count INT,
  is_premium BOOLEAN,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'retail.orders.clean',
  'properties.bootstrap.servers' = 'pkc-oxqxx9.us-east-1.aws.confluent.cloud:9092',
  'format' = 'avro-confluent',
  'avro-confluent.url' = 'https://psrc-z6mnmyr.us-east-1.aws.confluent.cloud'
);

INSERT INTO clean_orders
SELECT
  event_id,
  event_time,
  customer_id,
  order_id,
  total_amount,
  UPPER(currency) AS currency,
  item_count,
  is_premium
FROM raw_orders
WHERE order_id IS NOT NULL
  AND total_amount > 0;
