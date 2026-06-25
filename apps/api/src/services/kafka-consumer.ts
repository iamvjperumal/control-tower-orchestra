import { Consumer } from 'kafkajs';
import {
  createKafkaClient,
  TOPICS,
  CONSUMER_GROUPS,
  BaseEvent,
  AIRecommendationCreated,
  CustomerProfileUpdated,
} from '@signaltwin/shared';
import { stateStore } from './state-store.js';
import { eventSSE, recommendationSSE } from './sse-manager.js';
import { lineageTracker } from './lineage-tracker.js';
import { lineageSSE } from './sse-manager.js';

let consumer: Consumer;

export async function startConsumer(): Promise<void> {
  const kafka = createKafkaClient();
  consumer = kafka.consumer({ groupId: CONSUMER_GROUPS.API_STATE });

  await consumer.connect();
  await consumer.subscribe({
    topics: [
      TOPICS.RAW_ORDERS,
      TOPICS.RAW_PAYMENTS,
      TOPICS.RAW_SUPPORT,
      TOPICS.RAW_SHIPMENTS,
      TOPICS.RAW_CUSTOMERS,
      TOPICS.DECISIONS_RECOMMENDATIONS,
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;
      const data = JSON.parse(message.value.toString());

      // Track message for live lineage stats
      lineageTracker.record(topic);
      // Broadcast a lightweight delta so the UI can pulse the relevant edge
      lineageSSE.broadcast('lineage-msg', { topic, ts: Date.now() });

      if (topic === TOPICS.RAW_CUSTOMERS) {
        stateStore.updateCustomerProfile(data as CustomerProfileUpdated);
      }

      if (topic === TOPICS.DECISIONS_RECOMMENDATIONS) {
        const rec = data as AIRecommendationCreated;
        stateStore.addRecommendation(rec);
        recommendationSSE.broadcast('recommendation', rec);
      } else {
        const event = data as BaseEvent;
        stateStore.addEvent(event);
        eventSSE.broadcast('event', event);
      }
    },
  });

  console.log('API Kafka consumer started');
}

export async function stopConsumer(): Promise<void> {
  if (consumer) await consumer.disconnect();
}
