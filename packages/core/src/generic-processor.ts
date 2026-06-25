import { Kafka, Consumer, KafkaConfig } from 'kafkajs';

export interface ProcessorConfig {
  clientId?: string;
  brokers?: string[];
  consumerGroup: string;
  inputTopics: string[];
  handler: (topic: string, data: Record<string, unknown>) => Promise<void>;
  fromBeginning?: boolean;
}

export interface Processor {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function createProcessor(config: ProcessorConfig): Processor {
  const kafkaConfig: KafkaConfig = {
    clientId: config.clientId || 'cto-processor',
    brokers: config.brokers || (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: { retries: 5 },
  };

  const kafka = new Kafka(kafkaConfig);
  let consumer: Consumer;

  return {
    async start() {
      consumer = kafka.consumer({ groupId: config.consumerGroup });
      await consumer.connect();
      await consumer.subscribe({
        topics: config.inputTopics,
        fromBeginning: config.fromBeginning ?? false,
      });

      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          if (!message.value) return;
          const data = JSON.parse(message.value.toString());
          await config.handler(topic, data);
        },
      });
    },

    async stop() {
      if (consumer) await consumer.disconnect();
    },
  };
}
