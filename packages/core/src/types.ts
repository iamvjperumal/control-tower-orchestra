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

export type LineageNodeType =
  | 'producer'
  | 'source_connector'
  | 'topic'
  | 'ksql_stream'
  | 'ksql_table'
  | 'flink_job'
  | 'consumer'
  | 'sink_connector'
  | 'ai_agent';

export interface LineageNode {
  id: string;
  layer: string;
  domain: string;
  /** Logical node type — drives icon and colour in the Stream Lineage view */
  nodeType?: LineageNodeType;
  /** Human-friendly label (defaults to id if absent) */
  label?: string;
  /** Consumer group that reads this topic (for consumer nodes) */
  consumerGroup?: string;
}

export interface LineageEdge {
  from: string;
  to: string;
  processor?: string;
  /** Whether the edge carries live-observable data (shown as animated in the UI) */
  live?: boolean;
}

export interface LineageDefinition {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

/** Live per-topic throughput + consumer-group lag snapshot */
export interface TopicStats {
  topic: string;
  domain: string;
  layer: string;
  messagesIn: number;   // total since API start
  messagesOut: number;  // total since API start
  msgPerSec: number;    // rolling 10-second window
  consumerGroups: { groupId: string; lag: number }[];
  lastUpdated: number;  // epoch ms
}

export interface LineageStatsResponse {
  topics: TopicStats[];
  generatedAt: number;
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
