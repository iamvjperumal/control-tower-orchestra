import { FastifyInstance } from 'fastify';
import { TOPICS, OperatorAction } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

export async function actionRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: Omit<OperatorAction, 'action_id' | 'timestamp'> }>(
    '/actions',
    async (request) => {
      const action: OperatorAction = {
        action_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...request.body,
      };

      await publishMessage(TOPICS.ACTIONS_AGENT, action.recommendation_id, action);
      return { status: 'recorded', action_id: action.action_id };
    },
  );
}
