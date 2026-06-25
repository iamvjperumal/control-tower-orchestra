import { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import {
  registry,
  getLineageForDomain,
  getCrossdomainLineage,
  getAllTopicsWithMetadata,
  getTopicsForDomain,
  getPIIReport,
  getPIIReportByDomain,
  getDataContracts,
  getGovernanceMetrics,
} from '@signaltwin/core';
import { lineageTracker } from '../services/lineage-tracker.js';
import { lineageSSE } from '../services/sse-manager.js';

export async function governanceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/governance/domains', async () => {
    return registry.getAll().map((def) => ({
      domain: def.domain,
      displayName: def.displayName,
      description: def.description,
      accentColor: def.accentColor,
      icon: def.icon,
      topicCount: def.allTopics.length,
      schemaCount: def.schemas.length,
      agentCount: def.agents.length,
      piiFieldCount: def.piiFields.length,
    }));
  });

  app.get('/governance/schemas', async (_request, reply) => {
    try {
      const res = await fetch(`${config.schemaRegistryUrl}/subjects`);
      const subjects = await res.json();
      return subjects;
    } catch {
      return reply.status(503).send({ error: 'Schema Registry unavailable' });
    }
  });

  app.get<{ Params: { subject: string } }>(
    '/governance/schemas/:subject',
    async (request, reply) => {
      try {
        const res = await fetch(
          `${config.schemaRegistryUrl}/subjects/${request.params.subject}/versions/latest`,
        );
        const schema = await res.json();
        return schema;
      } catch {
        return reply.status(503).send({ error: 'Schema Registry unavailable' });
      }
    },
  );

  app.get('/governance/topics', async () => {
    return getAllTopicsWithMetadata();
  });

  app.get<{ Params: { domain: string } }>('/governance/topics/:domain', async (request) => {
    return getTopicsForDomain(request.params.domain);
  });

  app.get('/governance/lineage', async () => {
    return getCrossdomainLineage();
  });

  /**
   * GET /governance/lineage/stats
   * Returns live per-topic throughput and consumer-group lag.
   * Confluent Cloud: the lag values are populated as messages flow; on a
   * fresh cluster they will all be 0 until data is produced.
   */
  app.get('/governance/lineage/stats', async () => {
    return lineageTracker.getStats();
  });

  /**
   * GET /governance/lineage/stream
   * SSE endpoint that pushes a "lineage-msg" event for every Kafka message
   * received on any subscribed topic.  The dashboard uses this to animate
   * edges in the Stream Lineage view.
   *
   * Event shape: { topic: string; ts: number }
   *
   * Also pushes a full "lineage-stats" snapshot every 5 seconds so the UI
   * can update throughput counters even when the tab is idle.
   */
  app.get('/governance/lineage/stream', async (_request, reply) => {
    const id = lineageSSE.addClient(reply);

    // Send initial snapshot immediately
    const snapshot = lineageTracker.getStats();
    reply.raw.write(`event: lineage-stats\ndata: ${JSON.stringify(snapshot)}\n\n`);

    // Push a full stats snapshot every 5 s
    const interval = setInterval(() => {
      const stats = lineageTracker.getStats();
      reply.raw.write(`event: lineage-stats\ndata: ${JSON.stringify(stats)}\n\n`);
    }, 5_000);

    reply.raw.on('close', () => {
      clearInterval(interval);
    });

    // Keep Fastify from closing the response
    await new Promise(() => {});
  });

  app.get<{ Params: { domain: string } }>('/governance/lineage/:domain', async (request) => {
    const lineage = getLineageForDomain(request.params.domain);
    if (!lineage) return { nodes: [], edges: [] };
    return lineage;
  });

  app.get('/governance/pii', async () => {
    return getPIIReport();
  });

  app.get<{ Params: { domain: string } }>('/governance/pii/:domain', async (request) => {
    return getPIIReportByDomain(request.params.domain);
  });

  app.get('/governance/contracts', async () => {
    return getDataContracts();
  });

  app.get('/governance/metrics', async () => {
    return getGovernanceMetrics();
  });

  app.get('/governance/agents', async () => {
    return registry.getAll().flatMap((def) =>
      def.agents.map((agent) => ({
        ...agent,
        domain: def.domain,
        domainDisplayName: def.displayName,
      })),
    );
  });
}
