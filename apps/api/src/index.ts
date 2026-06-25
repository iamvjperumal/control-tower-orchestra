import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { healthRoutes } from './routes/health.js';
import { eventRoutes } from './routes/events.js';
import { recommendationRoutes } from './routes/recommendations.js';
import { customerRoutes } from './routes/customers.js';
import { actionRoutes } from './routes/actions.js';
import { governanceRoutes } from './routes/governance.js';
import { copilotRoutes } from './routes/copilot.js';
import { replayRoutes } from './routes/replay.js';
import { fleetRoutes } from './routes/fleet.js';
import { startConsumer, stopConsumer } from './services/kafka-consumer.js';
import { stopProducer } from './services/kafka-producer.js';

const app = Fastify({ logger: true });

async function setup(): Promise<void> {
  await app.register(cors, { origin: config.corsOrigin });
  await app.register(healthRoutes);
  await app.register(eventRoutes);
  await app.register(recommendationRoutes);
  await app.register(customerRoutes);
  await app.register(actionRoutes);
  await app.register(governanceRoutes);
  await app.register(copilotRoutes);
  await app.register(replayRoutes);
  await app.register(fleetRoutes);
}

async function start(): Promise<void> {
  try {
    await setup();
    try {
      await startConsumer();
    } catch (err) {
      console.warn('Kafka consumer failed to start — running without Kafka:', (err as Error).message);
    }
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`CTO API listening on port ${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

async function shutdown(): Promise<void> {
  console.log('Shutting down...');
  await stopConsumer();
  await stopProducer();
  await app.close();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
