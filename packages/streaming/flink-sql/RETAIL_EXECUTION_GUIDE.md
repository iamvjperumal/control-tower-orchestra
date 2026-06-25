# RetailOps Stream Processing - Step-by-Step Execution Guide

This guide provides detailed instructions for executing the RetailOps Flink SQL pipeline on Confluent Cloud.

## Prerequisites

1. **Confluent Cloud Account** with Flink enabled
2. **Kafka Cluster** running in Confluent Cloud
3. **Schema Registry** enabled
4. **Flink Compute Pool** created
5. **API Keys** for Kafka and Schema Registry

## Configuration

Before starting, gather these values:
- `KAFKA_BROKERS`: Your Kafka bootstrap servers (e.g., `pkc-xxxxx.us-east-1.aws.confluent.cloud:9092`)
- `SCHEMA_REGISTRY_URL`: Your Schema Registry URL (e.g., `https://psrc-xxxxx.us-east-1.aws.confluent.cloud`)

## Step-by-Step Execution

### Step 1: Create Source Tables (01-create-source-tables.sql)

**Purpose**: Define source tables that read from raw Kafka topics

**Actions**:
1. Open Confluent Cloud Console → Flink → SQL Workspace
2. Copy the content of `01-create-source-tables.sql`
3. Replace placeholders:
   - `{{KAFKA_BROKERS}}` → Your Kafka bootstrap servers
   - `{{SCHEMA_REGISTRY_URL}}` → Your Schema Registry URL
4. Execute each CREATE TABLE statement separately:
   - `raw_orders`
   - `raw_payments`
   - `raw_support`
   - `raw_shipments`
   - `raw_customers`

**Verification**:
```sql
-- Check if tables are created
SHOW TABLES;

-- Preview data from a source table
SELECT * FROM raw_orders LIMIT 10;
```

**Expected Result**: 5 source tables created, data flowing from Kafka topics

---

### Step 2: Create Clean Orders Table (02-clean-orders.sql)

**Purpose**: Validate and standardize order data

**Actions**:
1. Copy the entire content of `02-clean-orders.sql`
2. Replace placeholders (same as Step 1)
3. Execute the CREATE TABLE statement first
4. Then execute the INSERT INTO statement

**Verification**:
```sql
-- Check table structure
DESCRIBE clean_orders;

-- Verify data is flowing
SELECT COUNT(*) FROM clean_orders;

-- Check sample records
SELECT * FROM clean_orders LIMIT 10;
```

**Expected Result**: 
- Table `clean_orders` created
- Data being inserted from `raw_orders`
- Only valid orders (order_id NOT NULL, total_amount > 0)

---

### Step 3: Create Clean Payments Table (03-clean-payments.sql)

**Purpose**: Validate and standardize payment data

**Actions**:
1. Copy the entire content of `03-clean-payments.sql`
2. Replace placeholders
3. Execute CREATE TABLE statement
4. Execute INSERT INTO statement

**Verification**:
```sql
-- Check table structure
DESCRIBE clean_payments;

-- Verify data flow
SELECT COUNT(*) FROM clean_payments;

-- Check for payment failures
SELECT 
  failure_code, 
  COUNT(*) as failure_count 
FROM clean_payments 
WHERE failure_code IS NOT NULL 
GROUP BY failure_code;
```

**Expected Result**:
- Table `clean_payments` created
- Payment data being processed
- Currency values standardized to uppercase

---

### Step 4: Create Customer 360 View (04-customer-360.sql)

**Purpose**: Enrich customer profiles with cross-domain data

**Actions**:
1. Copy the entire content of `04-customer-360.sql`
2. Replace placeholders
3. Execute CREATE TABLE statement (note: uses upsert-kafka connector)
4. Execute INSERT INTO statement

**Verification**:
```sql
-- Check table structure
DESCRIBE enriched_customer_360;

-- View enriched customer data
SELECT 
  customer_id,
  tier,
  lifetime_value,
  latest_order_amount,
  recent_failure_count
FROM enriched_customer_360
LIMIT 10;

-- Check for VIP customers with recent issues
SELECT * 
FROM enriched_customer_360 
WHERE tier = 'vip' 
  AND recent_failure_count > 0;
```

**Expected Result**:
- Upsert table created (maintains latest state per customer)
- Customer profiles enriched with order and payment data
- Real-time updates as new events arrive

---

### Step 5: Create Risk Signals Table (05-risk-signals.sql)

**Purpose**: Generate real-time risk scores based on multiple factors

**Actions**:
1. Copy the entire content of `05-risk-signals.sql`
2. Replace placeholders
3. Execute CREATE TABLE statement
4. Execute INSERT INTO statement

**Verification**:
```sql
-- Check table structure
DESCRIBE signals_risk;

-- View risk signals
SELECT 
  customer_id,
  risk_score,
  payment_failures_10m,
  has_premium_delay,
  negative_support_24h,
  is_vip
FROM signals_risk
ORDER BY risk_score DESC
LIMIT 20;

-- Count risk signals by score range
SELECT 
  CASE 
    WHEN risk_score >= 60 THEN 'HIGH (60+)'
    WHEN risk_score >= 30 THEN 'MEDIUM (30-59)'
    ELSE 'LOW (<30)'
  END as risk_level,
  COUNT(*) as signal_count
FROM signals_risk
GROUP BY 
  CASE 
    WHEN risk_score >= 60 THEN 'HIGH (60+)'
    WHEN risk_score >= 30 THEN 'MEDIUM (30-59)'
    ELSE 'LOW (<30)'
  END;
```

**Expected Result**:
- Risk signals generated for customers with issues
- Risk scores calculated from multiple factors:
  - Payment failures (30 points if >= 2 in 10 min)
  - Premium order delays (20 points)
  - Negative support tickets (25 points)
  - VIP status (10 points bonus)

---

### Step 6: Create Decision Routing View (06-decisions.sql)

**Purpose**: Create a monitoring view for risk-based actions

**Actions**:
1. Copy the content of `06-decisions.sql`
2. Execute the CREATE VIEW statement (no placeholders needed)

**Verification**:
```sql
-- View risk summary with suggested actions
SELECT 
  customer_id,
  risk_score,
  suggested_action,
  event_time
FROM risk_summary
ORDER BY risk_score DESC
LIMIT 20;

-- Count by action type
SELECT 
  suggested_action,
  COUNT(*) as customer_count
FROM risk_summary
GROUP BY suggested_action;
```

**Expected Result**:
- View created for monitoring
- Suggested actions:
  - `ESCALATE` for risk_score > 60
  - `MONITOR` for risk_score > 30
  - `NO_ACTION` for risk_score <= 30

---

## Monitoring and Troubleshooting

### Check Job Status
```sql
-- View running Flink jobs
SHOW JOBS;

-- Check job details
DESCRIBE JOB '<job-id>';
```

### Monitor Data Flow
```sql
-- Check record counts across pipeline
SELECT 'raw_orders' as table_name, COUNT(*) as record_count FROM raw_orders
UNION ALL
SELECT 'clean_orders', COUNT(*) FROM clean_orders
UNION ALL
SELECT 'clean_payments', COUNT(*) FROM clean_payments
UNION ALL
SELECT 'enriched_customer_360', COUNT(*) FROM enriched_customer_360
UNION ALL
SELECT 'signals_risk', COUNT(*) FROM signals_risk;
```

### Common Issues

**Issue**: No data flowing
- **Solution**: Check if Kafka topics exist and have data
- **Verify**: `SELECT * FROM raw_orders LIMIT 1;`

**Issue**: INSERT statement fails
- **Solution**: Ensure CREATE TABLE executed successfully first
- **Verify**: `SHOW TABLES;`

**Issue**: Placeholder not replaced
- **Solution**: Search for `{{` in your SQL and replace all placeholders

**Issue**: Schema mismatch
- **Solution**: Verify Schema Registry has correct schemas registered
- **Check**: Confluent Cloud → Schema Registry → Subjects

---

## Pipeline Architecture

```
Raw Kafka Topics
    ↓
Source Tables (01)
    ↓
Clean Tables (02, 03) ← Data Validation
    ↓
Customer 360 (04) ← Enrichment
    ↓
Risk Signals (05) ← Scoring Logic
    ↓
Decision View (06) ← Monitoring
```

---

## Next Steps

After completing the RetailOps pipeline:

1. **Monitor the Dashboard**: Check the SignalTwin AI dashboard for real-time updates
2. **Test Scenarios**: Use the worker service to generate test events
3. **Deploy FleetOps**: Follow similar steps for fleet management pipeline
4. **Set Up Alerts**: Configure alerts based on risk signals
5. **Integrate AI Agents**: Connect Claude API for recommendation generation

---

## Additional Resources

- **Confluent Flink SQL Reference**: https://docs.confluent.io/cloud/current/flink/reference/overview.html
- **Kafka Connector Options**: https://docs.confluent.io/cloud/current/flink/reference/statements/create-table.html
- **Troubleshooting Guide**: Check Confluent Cloud logs for detailed error messages

---

## Support

For issues or questions:
1. Check Confluent Cloud logs in the Flink SQL workspace
2. Verify Kafka topics have data using Confluent Cloud UI
3. Review Schema Registry for schema compatibility
4. Check this repository's issues for known problems