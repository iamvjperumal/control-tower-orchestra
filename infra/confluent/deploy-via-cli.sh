#!/bin/bash

# Deploy Flink SQL jobs via Confluent CLI
# This script executes SQL statements using the Confluent Flink shell

set -e

# Configuration
COMPUTE_POOL="lfcp-doow3xo"
ENVIRONMENT="env-36mq5j"
SQL_DIR="../../packages/streaming/flink-sql/prepared"

echo "🚀 Deploying Flink SQL Jobs via Confluent CLI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Compute Pool: $COMPUTE_POOL"
echo "Environment: $ENVIRONMENT"
echo "SQL Directory: $SQL_DIR"
echo ""

# Check if confluent CLI is installed
if ! command -v confluent &> /dev/null; then
    echo "❌ Error: Confluent CLI not found"
    echo "Please install: https://docs.confluent.io/confluent-cli/current/install.html"
    exit 1
fi

# Check if logged in
echo "Checking Confluent CLI authentication..."
if ! confluent environment list &> /dev/null; then
    echo "❌ Not logged in. Please run: confluent login"
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Function to execute SQL file
execute_sql_file() {
    local file=$1
    local description=$2
    
    echo "📝 Executing: $description"
    echo "   File: $file"
    
    if [ ! -f "$file" ]; then
        echo "   ⚠️  File not found, skipping"
        return
    fi
    
    # Execute SQL file
    confluent flink shell \
        --compute-pool "$COMPUTE_POOL" \
        --environment "$ENVIRONMENT" \
        --file "$file"
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Success"
    else
        echo "   ❌ Failed"
        read -p "   Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    echo ""
}

# Execute SQL files in order
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 1: Retail Source Tables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
execute_sql_file "$SQL_DIR/01-create-source-tables.sql" "Create source tables"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 2: Clean Orders"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
execute_sql_file "$SQL_DIR/02-clean-orders.sql" "Create and populate clean orders"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 3: Clean Payments"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
execute_sql_file "$SQL_DIR/03-clean-payments.sql" "Create and populate clean payments"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 4: Customer 360"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
execute_sql_file "$SQL_DIR/04-customer-360.sql" "Create and populate customer 360"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 5: Risk Signals"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
execute_sql_file "$SQL_DIR/05-risk-signals.sql" "Create and populate risk signals"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 6: Decision View"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
execute_sql_file "$SQL_DIR/06-decisions.sql" "Create decision view"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 7: Fleet Source Tables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
execute_sql_file "$SQL_DIR/10-fleet-source-tables.sql" "Create fleet source tables"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 8: Fleet Metrics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
execute_sql_file "$SQL_DIR/11-fleet-metrics.sql" "Create fleet metrics"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 9: Fleet Agent Decisions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
execute_sql_file "$SQL_DIR/13-fleet-agent-decisions.sql" "Create fleet agent decisions"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 10: Fleet Risk Alerts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
execute_sql_file "$SQL_DIR/12-fleet-risk-alerts.sql" "Create fleet risk alerts"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Verify deployment:"
echo "   confluent flink shell --compute-pool $COMPUTE_POOL --environment $ENVIRONMENT"
echo "   Then run: SHOW TABLES;"
echo ""
echo "📊 Check jobs:"
echo "   confluent flink shell --compute-pool $COMPUTE_POOL --environment $ENVIRONMENT"
echo "   Then run: SHOW JOBS;"
echo ""

# Made with Bob
