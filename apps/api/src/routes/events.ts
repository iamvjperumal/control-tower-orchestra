import { FastifyInstance } from 'fastify';
import { TOPICS } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';
import { eventSSE } from '../services/sse-manager.js';
import { stateStore } from '../services/state-store.js';

const EVENT_TOPIC_MAP: Record<string, string> = {
  'order-created': TOPICS.RAW_ORDERS,
  'payment-failed': TOPICS.RAW_PAYMENTS,
  'support-ticket-updated': TOPICS.RAW_SUPPORT,
  'shipment-delayed': TOPICS.RAW_SHIPMENTS,
  'customer-profile-updated': TOPICS.RAW_CUSTOMERS,
};

export async function eventRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { event_type: string; payload: Record<string, unknown> } }>(
    '/events/inject',
    async (request, reply) => {
      const { event_type, payload } = request.body;
      const topic = EVENT_TOPIC_MAP[event_type];
      if (!topic) {
        return reply.status(400).send({ error: `Unknown event_type: ${event_type}` });
      }

      const event = {
        event_id: crypto.randomUUID(),
        event_type,
        event_time: new Date().toISOString(),
        source_system: 'manual-inject',
        ...payload,
      };

      const customerId = (payload.customer_id as string) || 'unknown';
      await publishMessage(topic, customerId, event);
      return { status: 'published', topic, event_id: event.event_id };
    },
  );

  app.get('/events', async (_request, reply) => {
    return reply.send(stateStore.getRecentEvents());
  });

  app.get('/events/stream', async (_request, reply) => {
    eventSSE.addClient(reply);
  });
}
