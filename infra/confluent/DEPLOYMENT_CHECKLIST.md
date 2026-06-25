# Confluent Cloud Deployment Checklist

Complete step-by-step checklist for deploying SignalTwinAI to Confluent Cloud.

## 📋 Pre-Deployment Checklist

- [ ] Confluent Cloud account created
- [ ] Kafka cluster provisioned
- [ ] Schema Registry enabled
- [ ] API keys generated (Kafka + Schema Registry)
- [ ] `.env` file configured with credentials
- [ ] `USE_CONFLUENT=cloud` set in `.env`

## 🚀 Deployment Steps

### Phase 1: Infrastructure Setup

#### ✅ Step 1: Create Topics
```bash
cd infra/confluent
node create-topics-kafka.js
```

**Expected Output:**
- ✅ 27 topics created (14 retail + 13 fleet)
- Topics visible in Confluent Cloud UI

**Verification:**
```bash
# Check in Confluent Cloud Console
# Navigate to: Topics → View all topics
```

---

#### ✅ Step 2: Register Schemas
```bash
cd infra/confluent
./register-schemas.sh
```

**Expected Output:**
- ✅ 16 schemas registered in Schema Registry
- Schemas visible in Confluent Cloud UI

**Verification:**
```bash
# Check in Confluent Cloud Console
# Navigate to: Schema Registry → Subjects
# Should see subjects like:
# - retail.orders.raw-value
# - retail.payments.raw-value
# - fleet.telemetry.raw-value
# etc.
```

---

#### 🔄 Step 3: Set Data Contracts
```bash
cd infra/confluent
./set-data-contracts.sh
```

**Expected Output:**
- ✅ Compatibility levels set for 16 schema subjects
- Success: 16, Failed: 0

**Verification:**
```bash
# Check in Confluent Cloud Console
# Navigate to: Schema Registry → Click on a subject → Compatibility tab
# Should show: BACKWARD, FORWARD, or FULL
```

---

### Phase 2: Flink SQL Deployment

#### 🔄 Step 4: Create Flink Compute Pool

**Via Confluent Cloud UI:**
1. Navigate to **Flink** → **Compute Pools**
2. Click **Create Compute Pool**
3. Configure:
   - Name: `signaltwin-compute-pool`
   - Region: Same as Kafka cluster
   - Max CFUs: 5-10 (for development)
4. Click **Create**
5. Wait for status: **Running** (2-3 minutes)

**Via CLI:**
```bash
confluent login
confluent environment use <env-id>
confluent flink compute-pool create signaltwin-compute-pool \
  --cloud aws \
  --region us-east-1 \
  --max-cfu 10
```

**Verification:**
- [ ] Compute pool shows as **Running**
- [ ] Can access Flink SQL Workspace

---

#### 🔄 Step 5: Prepare SQL Files
```bash
cd infra/confluent
./prepare-flink-sql.sh
```

**Expected Output:**
- ✅ 10 SQL files prepared with your configuration
- Files created in: `packages/streaming/flink-sql/prepared/`

**What this does:**
- Replaces `{{KAFKA_BROKERS}}` with your actual brokers
- Replaces `{{SCHEMA_REGISTRY_URL}}` with your actual URL
- Creates deployment-ready SQL files

---

#### 🔄 Step 6: Deploy Retail Pipeline

Execute in **Flink SQL Workspace** (Confluent Cloud UI):

**6.1: Source Tables** (`01-create-source-tables.sql`)
- [ ] Copy from `prepared/01-create-source-tables.sql`
- [ ] Execute each CREATE TABLE statement separately
- [ ] Verify: `SHOW TABLES;` shows 5 tables
- [ ] Test: `SELECT * FROM raw_orders LIMIT 5;`

**6.2: Clean Orders** (`02-clean-orders.sql`)
- [ ] Execute CREATE TABLE statement
- [ ] Execute INSERT INTO statement
- [ ] Verify: `SELECT COUNT(*) FROM clean_orders;`

**6.3: Clean Payments** (`03-clean-payments.sql`)
- [ ] Execute CREATE TABLE statement
- [ ] Execute INSERT INTO statement
- [ ] Verify: `SELECT COUNT(*) FROM clean_payments;`

**6.4: Customer 360** (`04-customer-360.sql`)
- [ ] Execute CREATE TABLE statement (upsert-kafka)
- [ ] Execute INSERT INTO statement
- [ ] Verify: `SELECT * FROM enriched_customer_360 LIMIT 10;`

**6.5: Risk Signals** (`05-risk-signals.sql`)
- [ ] Execute CREATE TABLE statement
- [ ] Execute INSERT INTO statement
- [ ] Verify: `SELECT * FROM signals_risk ORDER BY risk_score DESC LIMIT 10;`

**6.6: Decision View** (`06-decisions.sql`)
- [ ] Execute CREATE VIEW statement
- [ ] Verify: `SELECT * FROM risk_summary LIMIT 10;`

---

#### 🔄 Step 7: Deploy Fleet Pipeline

Execute in **Flink SQL Workspace**:

**7.1: Fleet Source Tables** (`10-fleet-source-tables.sql`)
- [ ] Execute each CREATE TABLE statement
- [ ] Verify: `SHOW TABLES;` shows fleet tables
- [ ] Test: `SELECT * FROM fleet_telemetry LIMIT 5;`

**7.2: Fleet Metrics** (`11-fleet-metrics.sql`)
- [ ] Execute all CREATE TABLE statements
- [ ] Execute all INSERT INTO statements
- [ ] Verify: `SELECT * FROM fleet_eta_drift_metrics LIMIT 10;`

**7.3: Fleet Agent Decisions** (`13-fleet-agent-decisions.sql`)
- [ ] Execute CREATE TABLE statements
- [ ] Verify: `DESCRIBE fleet_agent_decisions;`

**7.4: Fleet Risk Alerts** (`12-fleet-risk-alerts.sql`)
- [ ] Execute CREATE TABLE statement
- [ ] Execute INSERT INTO statement
- [ ] Verify: `SELECT * FROM fleet_risk_alerts LIMIT 10;`

---

### Phase 3: Validation & Testing

#### 🔄 Step 8: Verify All Jobs Running

**Check in Flink UI:**
- [ ] Navigate to **Flink** → **Jobs**
- [ ] All jobs show status: **RUNNING**
- [ ] No jobs in **FAILED** state
- [ ] Check job metrics (records/sec, latency)

**SQL Verification:**
```sql
-- List all jobs
SHOW JOBS;

-- Check data flow
SELECT 'raw_orders' as table_name, COUNT(*) as count FROM raw_orders
UNION ALL
SELECT 'clean_orders', COUNT(*) FROM clean_orders
UNION ALL
SELECT 'enriched_customer_360', COUNT(*) FROM enriched_customer_360
UNION ALL
SELECT 'signals_risk', COUNT(*) FROM signals_risk;
```

---

#### 🔄 Step 9: Start Data Generators

**Start the worker service to generate test data:**
```bash
# In project root
npm run worker
```

**Expected Output:**
- Worker connects to Confluent Cloud
- Generates orders, payments, support tickets
- Generates fleet telemetry, driver events, etc.

**Verification:**
- [ ] Messages appearing in Kafka topics (check UI)
- [ ] Flink jobs processing data (check metrics)
- [ ] Data flowing through pipeline

---

#### 🔄 Step 10: Test End-to-End Flow

**Monitor in Confluent Cloud:**

1. **Topics** → Check message counts increasing
   - [ ] retail.orders.raw has messages
   - [ ] retail.payments.raw has messages
   - [ ] fleet.telemetry.raw has messages

2. **Flink Jobs** → Check processing metrics
   - [ ] Records/sec > 0
   - [ ] No backpressure
   - [ ] Checkpoints succeeding

3. **Schema Registry** → Verify schemas in use
   - [ ] Schemas showing usage statistics

**SQL Verification:**
```sql
-- Check retail pipeline
SELECT COUNT(*) as orders FROM raw_orders;
SELECT COUNT(*) as clean_orders FROM clean_orders;
SELECT COUNT(*) as customers FROM enriched_customer_360;
SELECT COUNT(*) as risk_signals FROM signals_risk;

-- Check fleet pipeline
SELECT COUNT(*) as telemetry FROM fleet_telemetry;
SELECT COUNT(*) as metrics FROM fleet_eta_drift_metrics;
SELECT COUNT(*) as alerts FROM fleet_risk_alerts;

-- Check high-risk customers
SELECT customer_id, risk_score, suggested_action
FROM risk_summary
WHERE risk_score > 60
ORDER BY risk_score DESC
LIMIT 10;
```

---

### Phase 4: Optional Enhancements

#### ⏸️ Step 11: Set Up Stream Governance (Optional)

**Enable Stream Lineage:**
- [ ] Navigate to **Stream Lineage**
- [ ] View data flow visualization
- [ ] Track upstream/downstream dependencies

**Configure Data Quality Rules:**
- [ ] Set up quality rules for critical fields
- [ ] Configure alerts for quality violations

**Add Business Metadata:**
- [ ] Tag topics with business context
- [ ] Add descriptions and ownership info

---

#### ⏸️ Step 12: Configure Monitoring & Alerts (Optional)

**Set up alerts for:**
- [ ] High consumer lag (> 1000 messages)
- [ ] Failed Flink jobs
- [ ] Schema compatibility violations
- [ ] Topic throughput anomalies
- [ ] Compute pool resource usage

**Configure in Confluent Cloud:**
1. Navigate to **Alerts**
2. Click **Create Alert**
3. Select alert type and thresholds
4. Configure notification channels (email, Slack, etc.)

---

## 📊 Success Criteria

### All Systems Go ✅

- [x] Topics created (27 total)
- [x] Schemas registered (16 total)
- [ ] Data contracts set (16 subjects)
- [ ] Flink compute pool running
- [ ] All Flink jobs deployed and running (10 jobs)
- [ ] Data flowing end-to-end
- [ ] No errors in job logs
- [ ] Worker generating test data
- [ ] Dashboard showing real-time updates

---

## 🐛 Troubleshooting

### Common Issues & Solutions

**Issue: Topics not created**
```bash
# Check credentials in .env
echo $CONFLUENT_BOOTSTRAP_SERVERS
echo $CONFLUENT_API_KEY

# Verify cluster is running in UI
# Re-run: node create-topics-kafka.js
```

**Issue: Schema registration fails**
```bash
# Check Schema Registry credentials
echo $CONFLUENT_SCHEMA_REGISTRY_URL
echo $CONFLUENT_SCHEMA_REGISTRY_API_KEY

# Verify Schema Registry is enabled
# Re-run: ./register-schemas.sh
```

**Issue: Flink job fails to start**
- Check SQL syntax (no placeholders remaining)
- Verify compute pool is running
- Check job logs in Flink UI
- Ensure source tables exist before INSERT

**Issue: No data flowing**
- Verify worker is running and connected
- Check topic has messages in UI
- Verify Flink job is RUNNING
- Check for schema compatibility issues

**Issue: High latency**
- Increase compute pool CFUs
- Optimize SQL queries
- Check for backpressure in jobs
- Reduce checkpoint interval

---

## 📚 Reference Documentation

- **Deployment Guide**: `infra/confluent/deploy-flink-jobs.md`
- **Retail Pipeline Guide**: `packages/streaming/flink-sql/RETAIL_EXECUTION_GUIDE.md`
- **Confluent Setup**: `CONFLUENT_SETUP.md`
- **Confluent Docs**: https://docs.confluent.io/cloud/

---

## 🎯 Next Steps After Deployment

1. **Monitor Performance**
   - Watch Flink job metrics
   - Track topic throughput
   - Monitor compute pool usage

2. **Test Use Cases**
   - Generate various scenarios
   - Test AI recommendations
   - Verify risk scoring logic

3. **Optimize**
   - Tune parallelism settings
   - Adjust window sizes
   - Right-size compute resources

4. **Production Readiness**
   - Set up proper monitoring
   - Configure alerts
   - Document runbooks
   - Plan for scaling

---

**Last Updated**: 2026-06-25
**Status**: Ready for deployment 🚀