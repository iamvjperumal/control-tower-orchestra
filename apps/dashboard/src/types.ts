export interface BaseEvent {
  event_id: string;
  event_type: string;
  event_time: string;
  source_system: string;
  customer_id: string;
}

export interface OrderCreated extends BaseEvent {
  event_type: 'order-created';
  order_id: string;
  total_amount: number;
  currency: string;
  item_count: number;
  is_premium: boolean;
}

export interface PaymentFailed extends BaseEvent {
  event_type: 'payment-failed';
  order_id: string;
  payment_id: string;
  failure_code: string;
  amount: number;
  attempt_number: number;
}

export interface SupportTicketUpdated extends BaseEvent {
  event_type: 'support-ticket-updated';
  ticket_id: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  category: string;
}

export interface ShipmentDelayed extends BaseEvent {
  event_type: 'shipment-delayed';
  order_id: string;
  shipment_id: string;
  delay_hours: number;
  reason: string;
}

export interface CustomerProfileUpdated extends BaseEvent {
  event_type: 'customer-profile-updated';
  tier: 'standard' | 'premium' | 'vip';
  lifetime_value: number;
  region: string;
}

export type RecommendedAction = 'ESCALATE_FRAUD_REVIEW' | 'VIP_RETENTION' | 'REFUND_APPROVE' | 'MONITOR' | 'NO_ACTION';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AIRecommendationCreated extends BaseEvent {
  event_type: 'ai-recommendation-created';
  risk_score: number;
  action: RecommendedAction;
  reason: string[];
  priority: Priority;
  confidence: number;
  model_id: string;
  prompt_hash: string;
  latency_ms: number;
}

export interface Customer360 {
  customer_id: string;
  tier: 'standard' | 'premium' | 'vip';
  lifetime_value: number;
  account_age_days: number;
  region: string;
  current_risk_score: number;
  recent_events: BaseEvent[];
  active_recommendations: AIRecommendationCreated[];
}

export interface LineageData {
  nodes: { id: string; layer: string; domain: string }[];
  edges: { from: string; to: string; processor?: string }[];
}

export interface GovernanceDomain {
  domain: string;
  displayName: string;
  description: string;
  accentColor: string;
  icon: string;
  topicCount: number;
  schemaCount: number;
  agentCount: number;
  piiFieldCount: number;
}

export interface TopicMetadata {
  name: string;
  domain: string;
  layer: string;
  entity: string;
}

export interface PIIFieldMapping {
  schema: string;
  field: string;
  classification: 'DIRECT' | 'QUASI' | 'SENSITIVE';
  handling: 'HASH' | 'REDACT' | 'MASK' | 'ENCRYPT';
}

export interface DataContract {
  subject: string;
  topic: string;
  domain: string;
  compatibilityLevel: 'BACKWARD' | 'FORWARD' | 'FULL' | 'NONE';
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

export interface AgentInfo {
  agentType: string;
  displayName: string;
  description: string;
  inputTopics: string[];
  outputTopic: string;
  auditTopic: string;
  consumerGroup: string;
  domain: string;
  domainDisplayName: string;
}
