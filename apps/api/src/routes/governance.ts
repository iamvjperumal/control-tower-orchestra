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
