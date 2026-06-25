-- SignalTwin AI: Source table definitions for Confluent Cloud Flink

CREATE TABLE raw_orders (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  customer_id STRING,
  order_id STRING,
  total_amount DOUBLE,
  currency STRING,
  item_count INT,
  is_premium BOOLEAN,
  shipping_address_hash STRING,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'retail.orders.raw',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

CREATE TABLE raw_payments (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
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
  'topic' = 'retail.payments.raw',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

CREATE TABLE raw_support (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  customer_id STRING,
  ticket_id STRING,
  channel STRING,
  sentiment STRING,
  sentiment_score DOUBLE,
  category STRING,
  summary_hash STRING,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'retail.support.raw',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

CREATE TABLE raw_shipments (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  customer_id STRING,
  order_id STRING,
  shipment_id STRING,
  carrier STRING,
  delay_hours INT,
  reason STRING,
  original_eta STRING,
  revised_eta STRING,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'retail.shipments.raw',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);

CREATE TABLE raw_customers (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  customer_id STRING,
  tier STRING,
  lifetime_value DOUBLE,
  account_age_days INT,
  region STRING,
  email_hash STRING,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'retail.customers.raw',
  'properties.bootstrap.servers' = '{{KAFKA_BROKERS}}',
  'format' = 'avro-confluent',
  'avro-confluent.url' = '{{SCHEMA_REGISTRY_URL}}'
);
