export interface DomainTopics {
  raw: Record<string, string>;
  curated?: Record<string, string>;
  enriched?: Record<string, string>;
  signals: Record<string, string>;
  decisions: Record<string, string>;
  actions: Record<string, string>;
  audit: Record<string, string>;
}

export type CompatibilityLevel = 'BACKWARD' | 'FORWARD' | 'FULL' | 'NONE';
export type PIIClassification = 'DIRECT' | 'QUASI' | 'SENSITIVE';
export type PIIHandling = 'HASH' | 'REDACT' | 'MASK' | 'ENCRYPT';

export interface ScoringConfig {
  inputTopics: string[];
  weights: Record<string, number>;
  escalationThreshold: number;
}

export interface AgentConfig {
  agentType: string;
  displayName: string;
  description: string;
  inputTopics: string[];
  outputTopic: string;
  auditTopic: string;
  consumerGroup: string;
}

export interface LineageNode {
  id: string;
  layer: string;
  domain: string;
}

export interface LineageEdge {
  from: string;
  to: string;
  processor?: string;
}

export interface LineageDefinition {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface SchemaMapping {
  schemaFile: string;
  topic: string;
  subject: string;
  compatibilityLevel: CompatibilityLevel;
}

export interface PIIFieldMapping {
  schema: string;
  field: string;
  classification: PIIClassification;
  handling: PIIHandling;
}

export interface UseCaseDefinition {
  domain: string;
  displayName: string;
  description: string;
  entityIdField: string;
  accentColor: string;
  icon: string;

  topics: DomainTopics;
  allTopics: string[];
  thresholds: Record<string, number>;
  consumerGroups: Record<string, string>;

  scoring: ScoringConfig;
  agents: AgentConfig[];
  lineage: LineageDefinition;
  schemas: SchemaMapping[];
  piiFields: PIIFieldMapping[];
}

export interface TopicMetadata {
  name: string;
  domain: string;
  layer: string;
  entity: string;
}

export interface GovernanceMetrics {
  totalDomains: number;
  totalTopics: number;
  totalSchemas: number;
  totalPIIFields: number;
  domainBreakdown: {
    domain: string;
    displayName: string;
    topicCount: number;
    schemaCount: number;
    piiFieldCount: number;
    agentCount: number;
  }[];
}

export interface DataContract {
  subject: string;
  topic: string;
  domain: string;
  compatibilityLevel: CompatibilityLevel;
}
