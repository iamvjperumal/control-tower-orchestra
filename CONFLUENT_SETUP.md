# Confluent Cloud Configuration Guide

This guide explains how to configure SignalTwinAI to work with either local Kafka or Confluent Cloud.

## Environment Configuration

The application uses the `USE_CONFLUENT` environment variable to determine which Kafka infrastructure to use:

- `USE_CONFLUENT=local` - Use local Kafka (default)
- `USE_CONFLUENT=cloud` - Use Confluent Cloud

## Local Kafka Setup

For local development with Docker Compose:

```bash
# .env file
USE_CONFLUENT=local
KAFKA_BROKERS=localhost:9092
SCHEMA_REGISTRY_URL=http://localhost:8081
```

Start local infrastructure:
```bash
docker-compose up -d
```

## Confluent Cloud Setup

### Prerequisites

1. A Confluent Cloud account
2. A Kafka cluster created in Confluent Cloud
3. API keys for both Kafka and Schema Registry

### Step 1: Create Confluent Cloud Resources

1. **Create a Kafka Cluster**
   - Log in to [Confluent Cloud](https://confluent.cloud)
   - Create a new cluster (Basic, Standard, or Dedicated)
   - Note the bootstrap server URL (e.g., `pkc-xxxxx.us-east-1.aws.confluent.cloud:9092`)

2. **Create Kafka API Keys**
   - Navigate to your cluster → API Keys
   - Click "Add key" and select "Global access"
   - Save the API Key and Secret securely

3. **Enable Schema Registry**
   - Navigate to Schema Registry in your environment
   - Note the Schema Registry URL (e.g., `https://psrc-xxxxx.us-east-1.aws.confluent.cloud`)

4. **Create Schema Registry API Keys**
   - In Schema Registry, go to API Keys
   - Create a new API key
   - Save the API Key and Secret securely

### Step 2: Configure Environment Variables

Create a `.env` file with your Confluent Cloud credentials:

```bash
# Kafka Configuration Mode
USE_CONFLUENT=cloud

# Confluent Cloud Kafka Configuration
CONFLUENT_BOOTSTRAP_SERVERS=pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
CONFLUENT_API_KEY=your-kafka-api-key
CONFLUENT_API_SECRET=your-kafka-api-secret

# Confluent Cloud Schema Registry Configuration
CONFLUENT_SCHEMA_REGISTRY_URL=https://psrc-xxxxx.us-east-1.aws.confluent.cloud
CONFLUENT_SCHEMA_REGISTRY_API_KEY=your-schema-registry-key
CONFLUENT_SCHEMA_REGISTRY_API_SECRET=your-schema-registry-secret

# Other configurations
WATSONX_API_KEY=your-watsonx-api-key
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=your-project-id
WATSONX_MODEL_ID=ibm/granite-13b-chat-v2
POSTGRES_URL=postgresql://signaltwin:signaltwin_dev@localhost:5434/signaltwin
API_PORT=3001
VITE_API_URL=http://localhost:3001
```

### Step 3: Create Topics in Confluent Cloud

You can create topics using the Confluent Cloud UI or CLI:

#### Using Confluent Cloud UI:
1. Navigate to your cluster → Topics
2. Click "Create topic"
3. Create the following topics:
   - `raw-orders`
   - `raw-payments`
   - `raw-shipments`
   - `raw-support-tickets`
   - `clean-orders`
   - `clean-payments`
   - `customer-360`
   - `risk-signals`
   - `ai-recommendations`
   - Fleet topics (if using fleet use case)

#### Using Confluent CLI:
```bash
# Login to Confluent Cloud
confluent login

# Set your environment and cluster
confluent environment use <env-id>
confluent kafka cluster use <cluster-id>

# Create topics
confluent kafka topic create raw-orders --partitions 3
confluent kafka topic create raw-payments --partitions 3
confluent kafka topic create raw-shipments --partitions 3
confluent kafka topic create raw-support-tickets --partitions 3
confluent kafka topic create clean-orders --partitions 3
confluent kafka topic create clean-payments --partitions 3
confluent kafka topic create customer-360 --partitions 3
confluent kafka topic create risk-signals --partitions 3
confluent kafka topic create ai-recommendations --partitions 3
```

### Step 4: Register Schemas

Register your Avro schemas in Confluent Cloud Schema Registry:

```bash
# Using the provided script (update with your credentials)
cd infra/confluent
./register-schemas.sh
```

Or manually via the Confluent Cloud UI:
1. Navigate to Schema Registry → Schemas
2. Click "Add schema"
3. Upload each `.avsc` file from `packages/schemas/avro/`

### Step 5: Set Up Flink SQL (Optional)

If using Flink for stream processing:

1. Create a Flink compute pool in Confluent Cloud
2. Navigate to Flink → SQL Workspace
3. Execute the SQL statements from `packages/streaming/flink-sql/`

## Running the Application

### With Local Kafka:
```bash
# Set environment
export USE_CONFLUENT=local

# Start services
npm run dev
```

### With Confluent Cloud:
```bash
# Set environment
export USE_CONFLUENT=cloud

# Ensure all Confluent Cloud credentials are in .env
# Start services
npm run dev
```

## Architecture Details

### Kafka Client Configuration

The `packages/shared/src/kafka.ts` module automatically configures the Kafka client based on `USE_CONFLUENT`:

**Local Mode:**
- Uses plaintext connection
- No authentication required
- Connects to `localhost:9092`

**Cloud Mode:**
- Uses SSL/TLS encryption
- SASL/PLAIN authentication with API keys
- Connects to Confluent Cloud bootstrap servers

### Configuration Files

The following files have been updated to support both modes:

1. **`packages/shared/src/kafka.ts`** - Kafka client factory with conditional configuration
2. **`apps/api/src/config.ts`** - API service configuration
3. **`apps/worker/src/config.ts`** - Worker service configuration
4. **`.env.example`** - Environment variable template

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to Confluent Cloud
- Verify bootstrap server URL is correct
- Check API key and secret are valid
- Ensure your IP is not blocked by network policies

**Problem:** Schema Registry authentication fails
- Verify Schema Registry URL is correct
- Check Schema Registry API credentials
- Ensure Schema Registry is enabled in your environment

### Topic Issues

**Problem:** Topics not found
- Create topics in Confluent Cloud before running the application
- Verify topic names match the application configuration

### Performance Issues

**Problem:** High latency with Confluent Cloud
- Consider using a cluster in a region closer to your application
- Upgrade to a higher tier cluster (Standard or Dedicated)
- Optimize batch sizes and compression settings

## Security Best Practices

1. **Never commit credentials** - Use `.env` files and add them to `.gitignore`
2. **Rotate API keys regularly** - Create new keys and delete old ones
3. **Use least privilege** - Create separate API keys for different services
4. **Enable audit logging** - Track all access to your Confluent Cloud resources
5. **Use ACLs** - Restrict topic access to specific service accounts

## Cost Optimization

1. **Use appropriate cluster tiers** - Basic for development, Standard/Dedicated for production
2. **Monitor usage** - Track throughput and storage in Confluent Cloud UI
3. **Set retention policies** - Configure appropriate retention for topics
4. **Use compression** - Enable compression to reduce storage and network costs

## Additional Resources

- [Confluent Cloud Documentation](https://docs.confluent.io/cloud/current/overview.html)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Confluent Cloud Pricing](https://www.confluent.io/confluent-cloud/pricing/)
- [Confluent Cloud CLI](https://docs.confluent.io/confluent-cli/current/overview.html)