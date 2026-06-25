import { FastifyInstance } from 'fastify';
import { stateStore } from '../services/state-store.js';

export async function customerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/customers', async () => {
    return stateStore.getAllCustomers();
  });

  app.get<{ Params: { id: string } }>('/customers/:id', async (request, reply) => {
    const customer = stateStore.getCustomer(request.params.id);
    if (!customer) return reply.status(404).send({ error: 'Customer not found' });
    return customer;
  });

  app.get<{ Params: { id: string } }>('/customers/:id/timeline', async (request) => {
    return stateStore.getCustomerTimeline(request.params.id);
  });
}
