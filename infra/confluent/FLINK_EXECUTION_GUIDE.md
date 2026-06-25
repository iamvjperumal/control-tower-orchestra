# Flink SQL Execution Guide - Statement by Statement

## ⚠️ Important: Execute ONE Statement at a Time

Confluent Cloud Flink SQL Workspace requires executing **one statement at a time**. You cannot paste multiple statements and run them together.

---

##  Execution Order

### Phase 1: Retail Source Tables (File: 01-create-source-tables.sql)

Execute each CREATE TABLE statement **separately**:

#### Statement 1: raw_orders
```sql
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
  'properties.bootstrap.servers' = 'pkc-oxqxx9.us-east-1.aws.confluent.cloud:9092',
  'format' = 'avro-confluent',
  'avro-confluent.url' = 'https://psrc-z6mnmyr.us-east-1.aws.confluent.cloud'
);
```
✅ Click "Run" → Wait for success

---

#### Statement 2: raw_payments
```sql
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
  'properties.bootstrap.servers' = 'pkc-oxqxx9.us-east-1.aws.confluent.cloud:9092',
  'format' = 'avro-confluent',
  'avro-confluent.url' = 'https://psrc-z6mnmyr.us-east-1.aws.confluent.cloud'
);
```
✅ Click "Run" → Wait for success

---

#### Statement 3: raw_support
```sql
CREATE TABLE raw_support (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  customer_id STRING,
  ticket_id STRING,
  sentiment STRING,
  priority STRING,
  category STRING,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'retail.support.raw',
  'properties.bootstrap.servers' = 'pkc-oxqxx9.us-east-1.aws.confluent.cloud:9092',
  'format' = 'avro-confluent',
  'avro-confluent.url' = 'https://psrc-z6mnmyr.us-east-1.aws.confluent.cloud'
);
```
✅ Click "Run" → Wait for success

---

#### Statement 4: raw_shipments
```sql
CREATE TABLE raw_shipments (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  customer_id STRING,
  order_id STRING,
  shipment_id STRING,
  status STRING,
  delay_hours INT,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'retail.shipments.raw',
  'properties.bootstrap.servers' = 'pkc-oxqxx9.us-east-1.aws.confluent.cloud:9092',
  'format' = 'avro-confluent',
  'avro-confluent.url' = 'https://psrc-z6mnmyr.us-east-1.aws.confluent.cloud'
);
```
✅ Click "Run" → Wait for success

---

#### Statement 5: raw_customers
```sql
CREATE TABLE raw_customers (
  event_id STRING,
  event_type STRING,
  event_time TIMESTAMP(3),
  source_system STRING,
  customer_id STRING,
  tier STRING,
  lifetime_value DOUBLE,
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'retail.customers.raw',
  'properties.bootstrap.servers' = 'pkc-oxqxx9.us-east-1.aws.confluent.cloud:9092',
  'format' = 'avro-confluent',
  'avro-confluent.url' = 'https://psrc-z6mnmyr.us-east-1.aws.confluent.cloud'
);
```
✅ Click "Run" → Wait for success

---

#### Verify Source Tables
```sql
SHOW TABLES;
```
Expected: Should show 5 tables (raw_orders, raw_payments, raw_support, raw_shipments, raw_customers)

---

### Phase 2: Clean Orders (File: 02-clean-orders.sql)

#### Statement 6: Create clean_orders table
```sql
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
```
✅ Click "Run" → Wait for success

---

#### Statement 7: Insert into clean_orders
```sql
INSERT INTO clean_orders
SELECT 
  event_id,
  event_time,
  customer_id,
  order_id,
  total_amount,
  UPPER(currency) as currency,
  item_count,
  is_premium
FROM raw_orders
WHERE order_id IS NOT NULL 
  AND total_amount > 0;
```
✅ Click "Run" → This starts a continuous job

---

### Phase 3: Clean Payments (File: 03-clean-payments.sql)

#### Statement 8: Create clean_payments table
```sql
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
```
✅ Click "Run" → Wait for success

---

#### Statement 9: Insert into clean_payments
```sql
INSERT INTO clean_payments
SELECT 
  event_id,
  event_time,
  customer_id,
  order_id,
  payment_id,
  failure_code,
  amount,
  UPPER(currency) as currency,
  attempt_number
FROM raw_payments
WHERE payment_id IS NOT NULL;
```
✅ Click "Run" → This starts a continuous job

---

### Phase 4: Customer 360 (File: 04-customer-360.sql)

#### Statement 10: Create enriched_customer_360 table
```sql
CREATE TABLE enriched_customer_360 (
  customer_id STRING,
  tier STRING,
  lifetime_value DOUBLE,
  latest_order_amount DOUBLE,
  recent_failure_count BIGINT,
  last_updated TIMESTAMP(3),
  PRIMARY KEY (customer_id) NOT ENFORCED
) WITH (
  'connector' = 'upsert-kafka',
  'topic' = 'retail.customer_360.enriched',
  'properties.bootstrap.servers' = 'pkc-oxqxx9.us-east-1.aws.confluent.cloud:9092',
  'key.format' = 'raw',
  'value.format' = 'avro-confluent',
  'value.avro-confluent.url' = 'https://psrc-z6mnmyr.us-east-1.aws.confluent.cloud'
);
```
✅ Click "Run" → Wait for success

---

#### Statement 11: Insert into enriched_customer_360
```sql
INSERT INTO enriched_customer_360
SELECT 
  c.customer_id,
  c.tier,
  c.lifetime_value,
  o.latest_order_amount,
  COALESCE(p.recent_failure_count, 0) as recent_failure_count,
  CURRENT_TIMESTAMP as last_updated
FROM raw_customers c
LEFT JOIN (
  SELECT customer_id, MAX(total_amount) as latest_order_amount
  FROM clean_orders
  GROUP BY customer_id
) o ON c.customer_id = o.customer_id
LEFT JOIN (
  SELECT customer_id, COUNT(*) as recent_failure_count
  FROM clean_payments
  WHERE failure_code IS NOT NULL
    AND event_time > CURRENT_TIMESTAMP - INTERVAL '10' MINUTE
  GROUP BY customer_id
) p ON c.customer_id = p.customer_id;
```
✅ Click "Run" → This starts a continuous job

---

### Phase 5: Risk Signals (File: 05-risk-signals.sql)

#### Statement 12: Create signals_risk table
```sql
CREATE TABLE signals_risk (
  customer_id STRING,
  risk_score INT,
  payment_failures_10m BIGINT,
  has_premium_delay BOOLEAN,
  negative_support_24h BIGINT,
  is_vip BOOLEAN,
  event_time TIMESTAMP(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'retail.risk.signals',
  'properties.bootstrap.servers' = 'pkc-oxqxx9.us-east-1.aws.confluent.cloud:9092',
  'format' = 'avro-confluent',
  'avro-confluent.url' = 'https://psrc-z6mnmyr.us-east-1.aws.confluent.cloud'
);
```
✅ Click "Run" → Wait for success

---

#### Statement 13: Insert into signals_risk
```sql
INSERT INTO signals_risk
SELECT 
  c.customer_id,
  (CASE WHEN pf.failure_count >= 2 THEN 30 ELSE 0 END +
   CASE WHEN pd.has_delay THEN 20 ELSE 0 END +
   CASE WHEN ns.negative_count > 0 THEN 25 ELSE 0 END +
   CASE WHEN c.tier = 'vip' THEN 10 ELSE 0 END) as risk_score,
  COALESCE(pf.failure_count, 0) as payment_failures_10m,
  COALESCE(pd.has_delay, FALSE) as has_premium_delay,
  COALESCE(ns.negative_count, 0) as negative_support_24h,
  (c.tier = 'vip') as is_vip,
  CURRENT_TIMESTAMP as event_time
FROM enriched_customer_360 c
LEFT JOIN (
  SELECT customer_id, COUNT(*) as failure_count
  FROM clean_payments
  WHERE failure_code IS NOT NULL
    AND event_time > CURRENT_TIMESTAMP - INTERVAL '10' MINUTE
  GROUP BY customer_id
) pf ON c.customer_id = pf.customer_id
LEFT JOIN (
  SELECT customer_id, TRUE as has_delay
  FROM clean_orders o
  JOIN raw_shipments s ON o.order_id = s.order_id
  WHERE o.is_premium = TRUE AND s.delay_hours > 0
  GROUP BY customer_id
) pd ON c.customer_id = pd.customer_id
LEFT JOIN (
  SELECT customer_id, COUNT(*) as negative_count
  FROM raw_support
  WHERE sentiment = 'negative'
    AND event_time > CURRENT_TIMESTAMP - INTERVAL '24' HOUR
  GROUP BY customer_id
) ns ON c.customer_id = ns.customer_id
WHERE (pf.failure_count >= 2 OR pd.has_delay = TRUE OR ns.negative_count > 0);
```
✅ Click "Run" → This starts a continuous job

---

### Phase 6: Decision View (File: 06-decisions.sql)

#### Statement 14: Create risk_summary view
```sql
CREATE VIEW risk_summary AS
SELECT 
  customer_id,
  risk_score,
  CASE 
    WHEN risk_score > 60 THEN 'ESCALATE'
    WHEN risk_score > 30 THEN 'MONITOR'
    ELSE 'NO_ACTION'
  END as suggested_action,
  event_time
FROM signals_risk;
```
✅ Click "Run" → Wait for success

---

## ✅ Verification After Each Phase

### After Phase 1 (Source Tables):
```sql
SHOW TABLES;
SELECT * FROM raw_orders LIMIT 5;
```

### After Phase 2 (Clean Orders):
```sql
SELECT COUNT(*) FROM clean_orders;
```

### After Phase 3 (Clean Payments):
```sql
SELECT COUNT(*) FROM clean_payments;
```

### After Phase 4 (Customer 360):
```sql
SELECT * FROM enriched_customer_360 LIMIT 10;
```

### After Phase 5 (Risk Signals):
```sql
SELECT * FROM signals_risk ORDER BY risk_score DESC LIMIT 10;
```

### After Phase 6 (Decision View):
```sql
SELECT * FROM risk_summary ORDER BY risk_score DESC LIMIT 10;
```

---

## 📊 Check All Jobs Running

```sql
SHOW JOBS;
```

Expected: Should show multiple jobs in RUNNING state

---

## 🚨 Important Notes

1. **One statement at a time** - Copy each statement separately
2. **Wait for success** - Don't proceed until current statement succeeds
3. **CREATE before INSERT** - Always create table before inserting data
4. **INSERT starts a job** - INSERT INTO statements create continuous streaming jobs
5. **Views are instant** - CREATE VIEW statements execute immediately

---

## 💡 Tips

- Use Ctrl+A to select all text in editor before pasting new statement
- Check job status in Flink → Jobs after each INSERT
- If a statement fails, check the error message and fix before retrying
- You can stop a job from Flink → Jobs if needed

---

## Next: Fleet Pipeline

After completing retail pipeline, continue with fleet tables following the same pattern:
- Execute one CREATE TABLE at a time
- Execute one INSERT INTO at a time
- Verify after each phase

Files to execute:
- 10-fleet-source-tables.sql
- 11-fleet-metrics.sql
- 13-fleet-agent-decisions.sql
- 12-fleet-risk-alerts.sql