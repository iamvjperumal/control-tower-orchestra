#!/bin/bash

# Script to prepare Flink SQL files with actual configuration values
# This creates deployment-ready SQL files in a 'prepared' directory

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
elif [ -f ../../.env ]; then
  export $(cat ../../.env | grep -v '^#' | xargs)
fi

# Check if running in cloud mode
if [ "$USE_CONFLUENT" != "cloud" ]; then
  echo "⚠️  Warning: USE_CONFLUENT is not set to 'cloud'"
  echo "This script is designed for Confluent Cloud deployment"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Get configuration values
KAFKA_BROKERS="${CONFLUENT_BOOTSTRAP_SERVERS}"
SCHEMA_REGISTRY="${CONFLUENT_SCHEMA_REGISTRY_URL}"

if [ -z "$KAFKA_BROKERS" ] || [ -z "$SCHEMA_REGISTRY" ]; then
  echo "❌ Error: Missing Confluent Cloud configuration"
  echo ""
  echo "Required environment variables:"
  echo "  CONFLUENT_BOOTSTRAP_SERVERS"
  echo "  CONFLUENT_SCHEMA_REGISTRY_URL"
  echo ""
  echo "Please set these in your .env file"
  exit 1
fi

echo "🔧 Preparing Flink SQL files for deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Kafka Brokers: $KAFKA_BROKERS"
echo "Schema Registry: $SCHEMA_REGISTRY"
echo ""

# Create prepared directory
PREPARED_DIR="../../packages/streaming/flink-sql/prepared"
SOURCE_DIR="../../packages/streaming/flink-sql"

rm -rf "$PREPARED_DIR"
mkdir -p "$PREPARED_DIR"

# SQL files to process
SQL_FILES=(
  "01-create-source-tables.sql"
  "02-clean-orders.sql"
  "03-clean-payments.sql"
  "04-customer-360.sql"
  "05-risk-signals.sql"
  "06-decisions.sql"
  "10-fleet-source-tables.sql"
  "11-fleet-metrics.sql"
  "12-fleet-risk-alerts.sql"
  "13-fleet-agent-decisions.sql"
)

echo "📝 Processing SQL files..."
echo ""

for sql_file in "${SQL_FILES[@]}"; do
  if [ ! -f "$SOURCE_DIR/$sql_file" ]; then
    echo "⚠️  Skipping $sql_file (not found)"
    continue
  fi
  
  echo "   Processing: $sql_file"
  
  # Replace placeholders and save to prepared directory
  sed -e "s|{{KAFKA_BROKERS}}|$KAFKA_BROKERS|g" \
      -e "s|{{SCHEMA_REGISTRY_URL}}|$SCHEMA_REGISTRY|g" \
      "$SOURCE_DIR/$sql_file" > "$PREPARED_DIR/$sql_file"
  
  echo "   ✅ Created: prepared/$sql_file"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ SQL files prepared successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📂 Location: packages/streaming/flink-sql/prepared/"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Open Confluent Cloud Console"
echo "2. Navigate to: Flink → SQL Workspace"
echo "3. Select your compute pool"
echo "4. Copy and execute SQL files in order:"
echo ""
echo "   Retail Pipeline:"
echo "   ├─ 01-create-source-tables.sql"
echo "   ├─ 02-clean-orders.sql"
echo "   ├─ 03-clean-payments.sql"
echo "   ├─ 04-customer-360.sql"
echo "   ├─ 05-risk-signals.sql"
echo "   └─ 06-decisions.sql"
echo ""
echo "   Fleet Pipeline:"
echo "   ├─ 10-fleet-source-tables.sql"
echo "   ├─ 11-fleet-metrics.sql"
echo "   ├─ 13-fleet-agent-decisions.sql"
echo "   └─ 12-fleet-risk-alerts.sql"
echo ""
echo "📖 Detailed guide: infra/confluent/deploy-flink-jobs.md"
echo ""
echo "💡 Tip: Execute CREATE TABLE statements first, then INSERT INTO"
echo ""

# Made with Bob
