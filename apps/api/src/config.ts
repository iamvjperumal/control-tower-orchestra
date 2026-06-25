const useConfluent = process.env.USE_CONFLUENT || 'local';

// Determine Kafka brokers based on environment
const kafkaBrokers = useConfluent === 'cloud'
  ? (process.env.CONFLUENT_BOOTSTRAP_SERVERS || '').split(',')
  : (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

// Determine Schema Registry URL based on environment
const schemaRegistryUrl = useConfluent === 'cloud'
  ? process.env.CONFLUENT_SCHEMA_REGISTRY_URL || ''
  : process.env.SCHEMA_REGISTRY_URL || 'http://localhost:8081';

// Schema Registry authentication for Confluent Cloud
const schemaRegistryAuth = useConfluent === 'cloud' ? {
  username: process.env.CONFLUENT_SCHEMA_REGISTRY_API_KEY || '',
  password: process.env.CONFLUENT_SCHEMA_REGISTRY_API_SECRET || '',
} : undefined;

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  kafkaBrokers,
  schemaRegistryUrl,
  schemaRegistryAuth,
  useConfluent,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
