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
  kafkaBrokers,
  schemaRegistryUrl,
  schemaRegistryAuth,
  useConfluent,
  watsonxApiKey: process.env.WATSONX_API_KEY || '',
  watsonxUrl: process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
  watsonxProjectId: process.env.WATSONX_PROJECT_ID || '',
  watsonxModelId: process.env.WATSONX_MODEL_ID || 'ibm/granite-13b-chat-v2',
  generatorIntervalMs: parseInt(process.env.GENERATOR_INTERVAL_MS || '5000', 10),
  scenarioMode: process.env.SCENARIO_MODE === 'true',
};
