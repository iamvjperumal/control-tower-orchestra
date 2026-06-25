#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
elif [ -f ../../.env ]; then
  export $(cat ../../.env | grep -v '^#' | xargs)
fi

# Determine which Schema Registry to use
if [ "$USE_CONFLUENT" = "cloud" ]; then
  echo "🌩️  Using Confluent Cloud Schema Registry..."
  SCHEMA_REGISTRY="$CONFLUENT_SCHEMA_REGISTRY_URL"
  SR_AUTH="-u $CONFLUENT_SCHEMA_REGISTRY_API_KEY:$CONFLUENT_SCHEMA_REGISTRY_API_SECRET"
else
  echo "🏠 Using local Schema Registry..."
  SCHEMA_REGISTRY="${SCHEMA_REGISTRY_URL:-http://localhost:8081}"
  SR_AUTH=""
fi

if [ -z "$SCHEMA_REGISTRY" ]; then
  echo "❌ Error: Schema Registry URL not configured"
  echo "Please set CONFLUENT_SCHEMA_REGISTRY_URL in .env for cloud mode"
  echo "or SCHEMA_REGISTRY_URL for local mode"
  exit 1
fi

echo "Schema Registry: $SCHEMA_REGISTRY"
echo ""

# Subject -> compatibility level
# BACKWARD: consumers can read old + new (safe field addition)
# FORWARD: producers can write old + new (safe field removal)
# FULL: both directions (strictest)
CONTRACTS=(
  "retail.orders.raw-value:BACKWARD"
  "retail.payments.raw-value:BACKWARD"
  "retail.support.raw-value:BACKWARD"
  "retail.shipments.raw-value:BACKWARD"
  "retail.customers.raw-value:FULL"
  "retail.risk.signals-value:FORWARD"
  "retail.recommendations.decisions-value:FULL"
  "fleet.telemetry.raw-value:BACKWARD"
  "fleet.location_updates.raw-value:BACKWARD"
  "fleet.driver_events.raw-value:BACKWARD"
  "fleet.route_events.raw-value:BACKWARD"
  "fleet.coldchain.raw-value:FULL"
  "fleet.maintenance.raw-value:BACKWARD"
  "fleet.order_events.raw-value:BACKWARD"
  "fleet.risk.alerts-value:FORWARD"
  "fleet.agent.decisions-value:FULL"
)

echo "Setting compatibility levels for ${#CONTRACTS[@]} schema subjects..."
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for entry in "${CONTRACTS[@]}"; do
  subject="${entry%%:*}"
  compat="${entry##*:}"

  echo "📝 Setting $subject → $compat"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$SCHEMA_REGISTRY/config/$subject" \
    $SR_AUTH \
    -H "Content-Type: application/vnd.schemaregistry.v1+json" \
    -d "{\"compatibility\": \"$compat\"}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Success"
    ((SUCCESS_COUNT++))
  else
    echo "   ❌ Failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
    ((FAIL_COUNT++))
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Data Contract Configuration Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Success: $SUCCESS_COUNT"
echo "❌ Failed:  $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
  echo "⚠️  Some contracts failed to set. Check the errors above."
  exit 1
else
  echo "🎉 All data contracts set successfully!"
  echo ""
  echo "View in Confluent Cloud:"
  echo "https://confluent.cloud → Schema Registry → Compatibility"
fi
