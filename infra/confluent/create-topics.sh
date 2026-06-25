#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Determine which Kafka to use
if [ "$USE_CONFLUENT" = "cloud" ]; then
  echo "Using Confluent Cloud..."
  KAFKA_BOOTSTRAP="$CONFLUENT_BOOTSTRAP_SERVERS"
  KAFKA_CONFIG="--command-config <(cat <<EOF
bootstrap.servers=$CONFLUENT_BOOTSTRAP_SERVERS
security.protocol=SASL_SSL
sasl.mechanisms=PLAIN
sasl.username=$CONFLUENT_API_KEY
sasl.password=$CONFLUENT_API_SECRET
EOF
)"
else
  echo "Using local Kafka..."
  KAFKA_BOOTSTRAP="${KAFKA_BROKERS:-localhost:9092}"
  KAFKA_CONFIG=""
fi

echo "Bootstrap servers: $KAFKA_BOOTSTRAP"
echo ""

# RetailOps Control Tower topics
RETAIL_TOPICS=(
  "retail.orders.raw" "retail.payments.raw" "retail.support.raw"
  "retail.shipments.raw" "retail.customers.raw"
  "retail.orders.clean" "retail.payments.clean"
  "retail.support.clean" "retail.shipments.clean"
  "retail.customer_360.enriched"
  "retail.risk.signals"
  "retail.recommendations.decisions"
  "retail.agent_actions.actions"
  "retail.inference.audit"
)

# FleetOps Control Tower topics
FLEET_TOPICS=(
  "fleet.telemetry.raw" "fleet.location_updates.raw"
  "fleet.driver_events.raw" "fleet.order_events.raw"
  "fleet.route_events.raw" "fleet.coldchain.raw"
  "fleet.maintenance.raw" "fleet.support_events.raw"
  "fleet.metrics.live" "fleet.risk.alerts"
  "fleet.agent.decisions" "fleet.agent.actions"
  "fleet.audit.log"
)

ALL_TOPICS=("${RETAIL_TOPICS[@]}" "${FLEET_TOPICS[@]}")

# Create topics
if [ "$USE_CONFLUENT" = "cloud" ]; then
  # For Confluent Cloud, use kafka-topics with config file
  CONFIG_FILE=$(mktemp)
  cat > "$CONFIG_FILE" <<EOF
bootstrap.servers=$CONFLUENT_BOOTSTRAP_SERVERS
security.protocol=SASL_SSL
sasl.mechanisms=PLAIN
sasl.username=$CONFLUENT_API_KEY
sasl.password=$CONFLUENT_API_SECRET
EOF

  for topic in "${ALL_TOPICS[@]}"; do
    echo "Creating topic: $topic"
    kafka-topics --bootstrap-server "$KAFKA_BOOTSTRAP" \
      --command-config "$CONFIG_FILE" \
      --create --topic "$topic" \
      --partitions 3 --replication-factor 3 \
      --if-not-exists 2>&1 | grep -v "already exists" || true
  done
  
  rm -f "$CONFIG_FILE"
else
  # For local Kafka
  for topic in "${ALL_TOPICS[@]}"; do
    kafka-topics --bootstrap-server "$KAFKA_BOOTSTRAP" \
      --create --topic "$topic" \
      --partitions 3 --replication-factor 1 \
      --if-not-exists
    echo "Created topic: $topic"
  done
fi

echo ""
echo "✅ All ${#ALL_TOPICS[@]} topics processed."
