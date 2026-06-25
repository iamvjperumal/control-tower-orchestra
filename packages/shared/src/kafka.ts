import { Kafka, KafkaConfig } from 'kafkajs';

export function createKafkaClient(config?: Partial<KafkaConfig>): Kafka {
  const useConfluent = process.env.USE_CONFLUENT || 'local';
  
  // Base configuration
  const baseConfig: Partial<KafkaConfig> = {
    clientId: 'cto-engine',
    retry: { retries: 5 },
  };

  if (useConfluent === 'cloud') {
    // Confluent Cloud configuration
    const bootstrapServers = process.env.CONFLUENT_BOOTSTRAP_SERVERS;
    const apiKey = process.env.CONFLUENT_API_KEY;
    const apiSecret = process.env.CONFLUENT_API_SECRET;

    if (!bootstrapServers || !apiKey || !apiSecret) {
      throw new Error(
        'Confluent Cloud credentials missing. Required: CONFLUENT_BOOTSTRAP_SERVERS, CONFLUENT_API_KEY, CONFLUENT_API_SECRET'
      );
    }

    return new Kafka({
      ...baseConfig,
      brokers: bootstrapServers.split(','),
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: apiKey,
        password: apiSecret,
      },
      ...config,
    });
  } else {
    // Local Kafka configuration
    return new Kafka({
      ...baseConfig,
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      ...config,
    });
  }
}
