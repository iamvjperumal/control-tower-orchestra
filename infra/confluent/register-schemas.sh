#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Determine which Schema Registry to use
if [ "$USE_CONFLUENT" = "cloud" ]; then
  echo "Using Confluent Cloud Schema Registry..."
  SCHEMA_REGISTRY="$CONFLUENT_SCHEMA_REGISTRY_URL"
  SR_AUTH="-u $CONFLUENT_SCHEMA_REGISTRY_API_KEY:$CONFLUENT_SCHEMA_REGISTRY_API_SECRET"
else
  echo "Using local Schema Registry..."
  SCHEMA_REGISTRY="${SCHEMA_REGISTRY_URL:-http://localhost:8081}"
  SR_AUTH=""
fi

echo "Schema Registry: $SCHEMA_REGISTRY"
echo ""

SCHEMA_DIR="packages/schemas/avro"

# RetailOps schema-to-topic mappings
RETAIL_MAP=(
  "order-created:retail.orders.raw"
  "payment-failed:retail.payments.raw"
  "support-ticket-updated:retail.support.raw"
  "shipment-delayed:retail.shipments.raw"
  "customer-profile-updated:retail.customers.raw"
  "risk-signal-generated:retail.risk.signals"
  "ai-recommendation-created:retail.recommendations.decisions"
)

# FleetOps schema-to-topic mappings
FLEET_MAP=(
  "telemetry-event:fleet.telemetry.raw"
  "location-update:fleet.location_updates.raw"
  "driver-event:fleet.driver_events.raw"
  "route-event:fleet.route_events.raw"
  "coldchain-event:fleet.coldchain.raw"
  "maintenance-event:fleet.maintenance.raw"
  "fleet-order-event:fleet.order_events.raw"
  "fleet-risk-alert:fleet.risk.alerts"
  "fleet-agent-decision:fleet.agent.decisions"
)

ALL_MAP=("${RETAIL_MAP[@]}" "${FLEET_MAP[@]}")

for entry in "${ALL_MAP[@]}"; do
  schema_name="${entry%%:*}"
  topic_name="${entry##*:}"
  schema_file="$SCHEMA_DIR/${schema_name}.avsc"

  if [ ! -f "$schema_file" ]; then
    echo "Schema file not found: $schema_file (skipping)"
    continue
  fi

  echo "Registering schema for ${topic_name}-value..."
  curl -s -X POST "$SCHEMA_REGISTRY/subjects/${topic_name}-value/versions" \
    $SR_AUTH \
    -H "Content-Type: application/vnd.schemaregistry.v1+json" \
    -d "{\"schemaType\": \"AVRO\", \"schema\": $(cat "$schema_file" | jq -Rs .)}"
  echo ""
done
echo "All schemas registered."
