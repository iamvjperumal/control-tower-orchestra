import type {
  UseCaseDefinition,
  LineageDefinition,
  GovernanceMetrics,
  DataContract,
  PIIFieldMapping,
  TopicMetadata,
} from './types.js';
import { registry } from './use-case-registry.js';

export function getLineageForDomain(domain: string): LineageDefinition | null {
  const def = registry.get(domain);
  if (!def) return null;
  return def.lineage;
}

export function getCrossdomainLineage(): LineageDefinition {
  const allDefs = registry.getAll();
  const nodes = allDefs.flatMap((def) => def.lineage.nodes);
  const edges = allDefs.flatMap((def) => def.lineage.edges);
  return { nodes, edges };
}

export function getAllTopicsWithMetadata(): TopicMetadata[] {
  return registry.getAllTopicsWithMetadata();
}

export function getTopicsForDomain(domain: string): TopicMetadata[] {
  return registry.getAllTopicsWithMetadata().filter((t) => t.domain === domain);
}

export function getPIIReport(): PIIFieldMapping[] {
  return registry.getAll().flatMap((def) => def.piiFields);
}

export function getPIIReportByDomain(domain: string): PIIFieldMapping[] {
  const def = registry.get(domain);
  return def ? def.piiFields : [];
}

export function getDataContracts(): DataContract[] {
  return registry.getAll().flatMap((def) =>
    def.schemas.map((s) => ({
      subject: s.subject,
      topic: s.topic,
      domain: def.domain,
      compatibilityLevel: s.compatibilityLevel,
    })),
  );
}

export function getGovernanceMetrics(): GovernanceMetrics {
  const allDefs = registry.getAll();
  return {
    totalDomains: allDefs.length,
    totalTopics: allDefs.reduce((sum, d) => sum + d.allTopics.length, 0),
    totalSchemas: allDefs.reduce((sum, d) => sum + d.schemas.length, 0),
    totalPIIFields: allDefs.reduce((sum, d) => sum + d.piiFields.length, 0),
    domainBreakdown: allDefs.map((def) => ({
      domain: def.domain,
      displayName: def.displayName,
      topicCount: def.allTopics.length,
      schemaCount: def.schemas.length,
      piiFieldCount: def.piiFields.length,
      agentCount: def.agents.length,
    })),
  };
}
