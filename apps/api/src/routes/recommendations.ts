import { FastifyInstance } from 'fastify';
import { stateStore } from '../services/state-store.js';
import { recommendationSSE } from '../services/sse-manager.js';

export async function recommendationRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { limit?: string } }>('/recommendations', async (request) => {
    const limit = parseInt(request.query.limit || '50', 10);
    return stateStore.getRecommendations(limit);
  });

  app.get('/recommendations/stream', async (_request, reply) => {
    recommendationSSE.addClient(reply);
  });
}
