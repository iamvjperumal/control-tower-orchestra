# Simple Flink SQL Execution Guide for Confluent Cloud

## ✅ No Database Creation Needed!

Confluent Cloud Flink doesn't require explicit database creation. You can execute SQL statements directly in the default catalog.

---

## 🚀 Quick Start - Execute These SQL Files in Order

### Prerequisites
- Confluent Cloud account logged in
- Flink compute pool: `lfcp-doow3xo`
- Environment: `env-36mq5j`

---

## 📝 Execution Steps

### Step 1: Open Flink SQL Workspace

1. Go to https://confluent.cloud
2. Navigate to **Flink** → **SQL Workspace**
3. Select compute pool: `lfcp-doow3xo`

---

### Step 2: Execute SQL Files (Copy-Paste Each Statement)

#### Phase 1: Create Source Tables (5 tables)

**File:** `packages/streaming/flink-sql/prepared/01-create-source-tables.sql`

Copy and execute each CREATE TABLE statement separately:

1. `CREATE TABLE raw_orders (...)`
2. `CREATE TABLE raw_payments (...)`
3. `CREATE TABLE raw_support_tickets (...)`
4. `CREATE TABLE raw_shipments (...)`
5. `CREATE TABLE raw_customer_profiles (...)`

**Verify:**
```sql
SHOW TABLES;
```
Expected: 5 tables listed

---

#### Phase 2: Create Clean Orders Table + Start Job

**File:** `packages/streaming/flink-sql/prepared/02-clean-orders.sql`

Execute both statements:

1. `CREATE TABLE clean_orders (...)`
2. `INSERT INTO clean_orders SELECT ...`

**Verify:**
```sql
SHOW JOBS;
SELECT * FROM clean_orders LIMIT 5;
```

---

#### Phase 3: Create Clean Payments Table + Start Job

**File:** `packages/streaming/flink-sql/prepared/03-clean-payments.sql`

Execute both statements:

1. `CREATE TABLE clean_payments (...)`
2. `INSERT INTO clean_payments SELECT ...`

**Verify:**
```sql
SELECT * FROM clean_payments LIMIT 5;
```

---

#### Phase 4: Create Customer 360 Table + Start Job

**File:** `packages/streaming/flink-sql/prepared/04-customer-360.sql`

Execute both statements:

1. `CREATE TABLE customer_360 (...)`
2. `INSERT INTO customer_360 SELECT ...`

**Verify:**
```sql
SELECT * FROM customer_360 LIMIT 5;
```

---

#### Phase 5: Create Risk Signals Table + Start Job

**File:** `packages/streaming/flink-sql/prepared/05-risk-signals.sql`

Execute both statements:

1. `CREATE TABLE risk_signals (...)`
2. `INSERT INTO risk_signals SELECT ...`

**Verify:**
```sql
SELECT * FROM risk_signals WHERE risk_score > 50 LIMIT 10;
```

---

#### Phase 6: Create Decision View

**File:** `packages/streaming/flink-sql/prepared/06-decisions.sql`

Execute:

1. `CREATE VIEW decision_routing AS SELECT ...`

**Verify:**
```sql
SELECT * FROM decision_routing LIMIT 5;
```

---

#### Phase 7: Fleet Source Tables (5 tables)

**File:** `packages/streaming/flink-sql/prepared/10-fleet-source-tables.sql`

Execute each CREATE TABLE statement:

1. `CREATE TABLE fleet_telemetry (...)`
2. `CREATE TABLE fleet_driver_events (...)`
3. `CREATE TABLE fleet_routes (...)`
4. `CREATE TABLE fleet_coldchain (...)`
5. `CREATE TABLE fleet_maintenance (...)`

**Verify:**
```sql
SHOW TABLES;
```
Expected: 10+ tables listed

---

#### Phase 8: Fleet Metrics (Optional)

**File:** `packages/streaming/flink-sql/prepared/11-fleet-metrics.sql`

Execute both statements:

1. `CREATE TABLE fleet_metrics (...)`
2. `INSERT INTO fleet_metrics SELECT ...`

---

#### Phase 9: Fleet Risk Alerts (Optional)

**File:** `packages/streaming/flink-sql/prepared/12-fleet-risk-alerts.sql`

Execute both statements:

1. `CREATE TABLE fleet_risk_alerts (...)`
2. `INSERT INTO fleet_risk_alerts SELECT ...`

---

#### Phase 10: Fleet Agent Decisions (Optional)

**File:** `packages/streaming/flink-sql/prepared/13-fleet-agent-decisions.sql`

Execute both statements:

1. `CREATE TABLE fleet_agent_decisions (...)`
2. `INSERT INTO fleet_agent_decisions SELECT ...`

---

## 🔍 Verification Queries

### Check All Tables
```sql
SHOW TABLES;
```

### Check Running Jobs
```sql
SHOW JOBS;
```

### Sample Data from Key Tables
```sql
-- Orders
SELECT * FROM raw_orders LIMIT 5;
SELECT * FROM clean_orders LIMIT 5;

-- Customer 360
SELECT customer_id, total_orders, total_spent, risk_score 
FROM customer_360 
ORDER BY risk_score DESC 
LIMIT 10;

-- Risk Signals
SELECT customer_id, risk_score, risk_factors 
FROM risk_signals 
WHERE risk_score > 70 
ORDER BY event_time DESC 
LIMIT 10;

-- Decisions
SELECT * FROM decision_routing 
WHERE action IN ('ESCALATE_FRAUD_REVIEW', 'BLOCK_TRANSACTION') 
LIMIT 10;
```

---

## 📊 Expected Results

After executing all statements, you should have:

- **10 source tables** (5 retail + 5 fleet)
- **5 processing tables** (clean_orders, clean_payments, customer_360, risk_signals, fleet_metrics)
- **1 view** (decision_routing)
- **6-8 running Flink jobs** (INSERT statements)

---

## ⚠️ Common Issues

### Issue 1: "Table already exists"
**Solution:** Drop the table first:
```sql
DROP TABLE IF EXISTS table_name;
```

### Issue 2: "No data in tables"
**Solution:** Check if worker is running:
```bash
# In your terminal
npm run dev:worker
```

### Issue 3: "Job failed"
**Solution:** Check job logs in Confluent Cloud UI:
- Go to Flink → Jobs
- Click on failed job
- View error details

### Issue 4: "Authentication error"
**Solution:** Verify credentials in prepared SQL files match your Confluent Cloud setup

---

## 🎯 Success Criteria

✅ All tables created successfully  
✅ All INSERT jobs running  
✅ Data flowing through pipeline  
✅ Risk signals being generated  
✅ Customer 360 view updating  

---

## 📞 Next Steps After Execution

1. **Verify data flow:** Check that events are being processed
2. **Monitor jobs:** Ensure all jobs are running without errors
3. **Test queries:** Run sample queries to verify data quality
4. **Connect dashboard:** Point your dashboard to consume from output topics
5. **Set up alerts:** Configure monitoring for job failures

---

## 💡 Pro Tips

- Execute statements **one at a time** and wait for confirmation
- Use `SHOW JOBS;` frequently to monitor job status
- Start with retail pipeline (phases 1-6) before fleet pipeline
- Keep the SQL Workspace tab open to monitor jobs
- Check Confluent Cloud metrics for throughput and latency

---

## 🔗 Related Files

- SQL Files: `packages/streaming/flink-sql/prepared/*.sql`
- Deployment Guide: `infra/confluent/deploy-flink-jobs.md`
- Detailed Guide: `infra/confluent/FLINK_EXECUTION_GUIDE.md`

---

**Ready to execute! Start with Phase 1 and work through each phase sequentially.** 🚀