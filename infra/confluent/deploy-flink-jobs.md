# Flink SQL Jobs Deployment Guide for Confluent Cloud

This guide walks you through deploying all Flink SQL jobs to Confluent Cloud.

## Prerequisites

✅ Confluent Cloud account with Flink enabled
✅ Kafka cluster running
✅ Schema Registry enabled with schemas registered
✅ Topics created (retail + fleet)
✅ Data contracts set (compatibility levels)

## Step 1: Create Flink Compute Pool

### Via Confluent Cloud UI:

1. Navigate to **Confluent Cloud Console**
2. Select your **Environment**
3. Go to **Flink** → **Compute Pools**
4. Click **Create Compute Pool**
5. Configure:
   - **Name**: `signaltwin-compute-pool`
   - **Region**: Same as your Kafka cluster
   - **Max CFUs**: Start with 5-10 CFUs for development
6. Click **Create**
7. Wait for pool to be **Running** (takes 2-3 minutes)

### Via Confluent CLI:

```bash
# Login
confluent login

# Set environment
confluent environment use <env-id>

# Create compute pool
confluent flink compute-pool create signaltwin-compute-pool \
  --cloud aws \
  --region us-east-1 \
  --max-cfu 10
```

## Step 2: Gather Configuration Values

You'll need these values for SQL placeholders:

```bash
# Get from Confluent Cloud UI or CLI
KAFKA_BROKERS="pkc-xxxxx.us-east-1.aws.confluent.cloud:9092"
SCHEMA_REGISTRY_URL="https://psrc-xxxxx.us-east-1.aws.confluent.cloud"
```

**How to find these:**
- **Kafka Brokers**: Cluster → Settings → Bootstrap server
- **Schema Registry**: Environment → Schema Registry → API endpoint

## Step 3: Deploy Retail Pipeline Jobs

### Job 1: Create Source Tables (01-create-source-tables.sql)

1. Open **Flink SQL Workspace** in Confluent Cloud
2. Select your compute pool: `signaltwin-compute-pool`
3. Copy content from `packages/streaming/flink-sql/01-create-source-tables.sql`
4. Replace placeholders:
   ```sql
   -- Find and replace:
   {{KAFKA_BROKERS}} → pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
   {{SCHEMA_REGISTRY_URL}} → https://psrc-xxxxx.us-east-1.aws.confluent.cloud
   ```
5. Execute each CREATE TABLE statement **one at a time**:
   - `raw_orders`
   - `raw_payments`
   - `raw_support`
   - `raw_shipments`
   - `raw_customers`

**Verify:**
```sql
SHOW TABLES;
-- Should show: raw_orders, raw_payments, raw_support, raw_shipments, raw_customers

SELECT * FROM raw_orders LIMIT 5;
-- Should return data if topics have messages
```

---

### Job 2: Clean Orders (02-clean-orders.sql)

1. Copy content from `packages/streaming/flink-sql/02-clean-orders.sql`
2. Replace placeholders
3. Execute **CREATE TABLE** statement first
4. Then execute **INSERT INTO** statement

**Verify:**
```sql
DESCRIBE clean_orders;
SELECT COUNT(*) FROM clean_orders;
SELECT * FROM clean_orders LIMIT 5;
```

---

### Job 3: Clean Payments (03-clean-payments.sql)

1. Copy content from `packages/streaming/flink-sql/03-clean-payments.sql`
2. Replace placeholders
3. Execute CREATE TABLE
4. Execute INSERT INTO

**Verify:**
```sql
SELECT COUNT(*) FROM clean_payments;
SELECT failure_code, COUNT(*) as count 
FROM clean_payments 
WHERE failure_code IS NOT NULL 
GROUP BY failure_code;
```

---

### Job 4: Customer 360 (04-customer-360.sql)

**Important:** This uses `upsert-kafka` connector for changelog semantics.

1. Copy content from `packages/streaming/flink-sql/04-customer-360.sql`
2. Replace placeholders
3. Execute CREATE TABLE (note PRIMARY KEY)
4. Execute INSERT INTO

**Verify:**
```sql
SELECT customer_id, tier, lifetime_value, recent_failure_count
FROM enriched_customer_360
LIMIT 10;

-- Check VIP customers with issues
SELECT * FROM enriched_customer_360 
WHERE tier = 'vip' AND recent_failure_count > 0;
```

---

### Job 5: Risk Signals (05-risk-signals.sql)

1. Copy content from `packages/streaming/flink-sql/05-risk-signals.sql`
2. Replace placeholders
3. Execute CREATE TABLE
4. Execute INSERT INTO

**Verify:**
```sql
SELECT customer_id, risk_score, 
       payment_failures_10m, has_premium_delay, 
       negative_support_24h, is_vip
FROM signals_risk
ORDER BY risk_score DESC
LIMIT 20;

-- Risk distribution
SELECT 
  CASE 
    WHEN risk_score >= 60 THEN 'HIGH'
    WHEN risk_score >= 30 THEN 'MEDIUM'
    ELSE 'LOW'
  END as risk_level,
  COUNT(*) as count
FROM signals_risk
GROUP BY 
  CASE 
    WHEN risk_score >= 60 THEN 'HIGH'
    WHEN risk_score >= 30 THEN 'MEDIUM'
    ELSE 'LOW'
  END;
```

---

### Job 6: Decision Routing (06-decisions.sql)

1. Copy content from `packages/streaming/flink-sql/06-decisions.sql`
2. Execute CREATE VIEW (no placeholders needed)

**Verify:**
```sql
SELECT customer_id, risk_score, suggested_action
FROM risk_summary
ORDER BY risk_score DESC
LIMIT 20;

-- Action distribution
SELECT suggested_action, COUNT(*) as count
FROM risk_summary
GROUP BY suggested_action;
```

---

## Step 4: Deploy Fleet Pipeline Jobs

### Job 7: Fleet Source Tables (10-fleet-source-tables.sql)

1. Copy content from `packages/streaming/flink-sql/10-fleet-source-tables.sql`
2. Replace placeholders
3. Execute each CREATE TABLE statement:
   - `fleet_telemetry`
   - `fleet_driver_events`
   - `fleet_route_events`
   - `fleet_coldchain`
   - `fleet_maintenance`

**Verify:**
```sql
SHOW TABLES;
SELECT * FROM fleet_telemetry LIMIT 5;
```

---

### Job 8: Fleet Metrics (11-fleet-metrics.sql)

**Important:** Uses windowed aggregations (TUMBLE windows).

1. Copy content from `packages/streaming/flink-sql/11-fleet-metrics.sql`
2. Replace placeholders
3. Execute all CREATE TABLE statements
4. Execute all INSERT INTO statements

**Verify:**
```sql
-- Check ETA drift metrics
SELECT * FROM fleet_eta_drift_metrics 
ORDER BY window_start DESC 
LIMIT 10;

-- Check cold chain violations
SELECT * FROM fleet_coldchain_metrics
WHERE violation_count > 0
ORDER BY window_start DESC
LIMIT 10;
```

---

### Job 9: Fleet Agent Decisions (13-fleet-agent-decisions.sql)

1. Copy content from `packages/streaming/flink-sql/13-fleet-agent-decisions.sql`
2. Replace placeholders
3. Execute CREATE TABLE statements

**Verify:**
```sql
DESCRIBE fleet_agent_decisions;
DESCRIBE fleet_agent_actions;
```

---

### Job 10: Fleet Risk Alerts (12-fleet-risk-alerts.sql)

**Important:** Execute this AFTER Job 9 (depends on those tables).

1. Copy content from `packages/streaming/flink-sql/12-fleet-risk-alerts.sql`
2. Replace placeholders
3. Execute CREATE TABLE
4. Execute INSERT INTO

**Verify:**
```sql
SELECT alert_type, severity, COUNT(*) as count
FROM fleet_risk_alerts
GROUP BY alert_type, severity
ORDER BY severity DESC;

SELECT * FROM fleet_risk_alerts
WHERE severity = 'CRITICAL'
ORDER BY event_time DESC
LIMIT 10;
```

---

## Step 5: Monitor Flink Jobs

### Check Job Status

```sql
-- List all running jobs
SHOW JOBS;

-- Get job details
DESCRIBE JOB '<job-name>';

-- Stop a job if needed
STOP JOB '<job-name>';
```

### Via Confluent Cloud UI:

1. Navigate to **Flink** → **Jobs**
2. View all running jobs
3. Click on a job to see:
   - Execution plan
   - Metrics (records/sec, latency)
   - Logs
   - Checkpoints

### Monitor Data Flow

```sql
-- Check record counts across pipeline
SELECT 'raw_orders' as table_name, COUNT(*) as count FROM raw_orders
UNION ALL
SELECT 'clean_orders', COUNT(*) FROM clean_orders
UNION ALL
SELECT 'enriched_customer_360', COUNT(*) FROM enriched_customer_360
UNION ALL
SELECT 'signals_risk', COUNT(*) FROM signals_risk;
```

---

## Step 6: Troubleshooting

### Common Issues

**Issue: No data flowing**
```sql
-- Check if source topics have data
SELECT * FROM raw_orders LIMIT 1;
```
- Solution: Verify topics exist and have messages
- Check: Confluent Cloud → Topics → Messages

**Issue: INSERT statement fails**
- Solution: Ensure CREATE TABLE executed successfully first
- Check: `SHOW TABLES;`

**Issue: Placeholder not replaced**
- Solution: Search for `{{` in SQL and replace all
- Use: Find & Replace in your editor

**Issue: Schema mismatch**
- Solution: Verify schemas in Schema Registry
- Check: Confluent Cloud → Schema Registry → Subjects

**Issue: Job keeps restarting**
- Check job logs in Flink UI
- Verify compute pool has enough resources
- Check for data quality issues (nulls, invalid formats)

### View Job Logs

1. Flink → Jobs → Click on job name
2. Go to **Logs** tab
3. Filter by log level (ERROR, WARN, INFO)

---

## Step 7: Validation Checklist

After deploying all jobs, verify:

- [ ] All 5 retail source tables created
- [ ] Clean orders and payments tables receiving data
- [ ] Customer 360 table updating (upsert working)
- [ ] Risk signals being generated
- [ ] Decision view showing suggested actions
- [ ] All 5 fleet source tables created
- [ ] Fleet metrics calculating (windowed aggregations)
- [ ] Fleet risk alerts generating
- [ ] Fleet agent decision tables ready
- [ ] All jobs showing as RUNNING in Flink UI
- [ ] No errors in job logs
- [ ] Data flowing end-to-end

---

## Performance Tuning

### Optimize Compute Resources

```sql
-- For high-throughput jobs, increase parallelism
SET 'parallelism.default' = '4';

-- Adjust checkpoint interval (default 3 minutes)
SET 'execution.checkpointing.interval' = '1min';
```

### Monitor Metrics

Key metrics to watch:
- **Records/sec**: Throughput per job
- **Latency**: End-to-end processing time
- **Backpressure**: If jobs are falling behind
- **Checkpoint duration**: Should be < 1 minute

---

## Cost Optimization

1. **Right-size compute pool**: Start small (5 CFUs), scale as needed
2. **Stop unused jobs**: Use `STOP JOB` for jobs not in use
3. **Monitor CFU usage**: Confluent Cloud → Billing → Usage
4. **Use appropriate windows**: Smaller windows = more compute

---

## Next Steps

After successful deployment:

1. ✅ Start data generators (worker service)
2. ✅ Monitor dashboard for real-time updates
3. ✅ Test AI agent recommendations
4. ✅ Set up alerts for critical events
5. ✅ Configure Stream Governance

---

## Quick Reference

### SQL Execution Order

**Retail Pipeline:**
1. 01-create-source-tables.sql
2. 02-clean-orders.sql
3. 03-clean-payments.sql
4. 04-customer-360.sql
5. 05-risk-signals.sql
6. 06-decisions.sql

**Fleet Pipeline:**
7. 10-fleet-source-tables.sql
8. 11-fleet-metrics.sql
9. 13-fleet-agent-decisions.sql
10. 12-fleet-risk-alerts.sql

### Useful Commands

```sql
-- List all tables
SHOW TABLES;

-- List all jobs
SHOW JOBS;

-- Describe table structure
DESCRIBE <table_name>;

-- Stop a job
STOP JOB '<job_name>';

-- Preview data
SELECT * FROM <table_name> LIMIT 10;
```

---

## Support Resources

- **Confluent Flink Docs**: https://docs.confluent.io/cloud/current/flink/
- **SQL Reference**: https://docs.confluent.io/cloud/current/flink/reference/
- **Community**: https://forum.confluent.io/
- **Project Guide**: `packages/streaming/flink-sql/RETAIL_EXECUTION_GUIDE.md`

---

**Ready to deploy? Start with Step 1!** 🚀