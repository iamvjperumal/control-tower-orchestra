import { Producer } from 'kafkajs';
import { createKafkaClient } from '@signaltwin/shared';

let producer: Producer;

export async function getProducer(): Promise<Producer> {
  if (!producer) {
    const kafka = createKafkaClient();
    producer = kafka.producer();
    await producer.connect();
  }
  return producer;
}

export async function publishMessage(
  topic: string,
  key: string,
  value: unknown,
): Promise<void> {
  const p = await getProducer();
  await p.send({
    topic,
    messages: [{ key, value: JSON.stringify(value) }],
  });
}

export async function stopProducer(): Promise<void> {
  if (producer) await producer.disconnect();
}
