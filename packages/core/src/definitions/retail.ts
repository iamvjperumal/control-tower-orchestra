import type { UseCaseDefinition } from '../types.js';

const TOPICS = {
  RAW_ORDERS: 'retail.orders.raw',
  RAW_PAYMENTS: 'retail.payments.raw',
  RAW_SUPPORT: 'retail.support.raw',
  RAW_SHIPMENTS: 'retail.shipments.raw',
  RAW_CUSTOMERS: 'retail.customers.raw',
  CLEAN_ORDERS: 'retail.orders.clean',
  CLEAN_PAYMENTS: 'retail.payments.clean',
  CLEAN_SUPPORT: 'retail.support.clean',
  CLEAN_SHIPMENTS: 'retail.shipments.clean',
  ENRICHED_CUSTOMER_360: 'retail.customer_360.enriched',
  SIGNALS_RISK: 'retail.risk.signals',
  DECISIONS_RECOMMENDATIONS: 'retail.recommendations.decisions',
  ACTIONS_AGENT: 'retail.agent_actions.actions',
  AUDIT_INFERENCE: 'retail.inference.audit',
} as const;

const RISK_WEIGHTS = {
  PAYMENT_FAILURES_10M: 30,
  PREMIUM_SHIPMENT_DELAY: 20,
  NEGATIVE_SUPPORT_24H: 25,
  REFUND_AFTER_SHIPMENT: 15,
  VIP_PRIORITY: 10,
} as const;

const CONSUMER_GROUPS = {
  API_STATE: 'retailops-api-state',
  WORKER_RISK: 'retailops-worker-risk',
  WORKER_RECOMMEND: 'retailops-worker-recommend',
} as const;

export const retailDefinition: UseCaseDefinition = {
  domain: 'retail',
  displayName: 'RetailOps Control Tower',
  description: 'E-commerce risk, retention, and fraud detection with real-time customer signal correlation',
  entityIdField: 'customer_id',
  accentColor: '#a78bfa',
  icon: 'shopping-cart',

  topics: {
    raw: {
      orders: TOPICS.RAW_ORDERS,
      payments: TOPICS.RAW_PAYMENTS,
      support: TOPICS.RAW_SUPPORT,
      shipments: TOPICS.RAW_SHIPMENTS,
      customers: TOPICS.RAW_CUSTOMERS,
    },
    curated: {
      orders: TOPICS.CLEAN_ORDERS,
      payments: TOPICS.CLEAN_PAYMENTS,
      support: TOPICS.CLEAN_SUPPORT,
      shipments: TOPICS.CLEAN_SHIPMENTS,
    },
    enriched: {
      customer_360: TOPICS.ENRICHED_CUSTOMER_360,
    },
    signals: {
      risk: TOPICS.SIGNALS_RISK,
    },
    decisions: {
      recommendations: TOPICS.DECISIONS_RECOMMENDATIONS,
    },
    actions: {
      agent_actions: TOPICS.ACTIONS_AGENT,
    },
    audit: {
      inference: TOPICS.AUDIT_INFERENCE,
    },
  },

  allTopics: Object.values(TOPICS),

  thresholds: {
    ESCALATION_THRESHOLD: 60,
  },

  consumerGroups: CONSUMER_GROUPS,

  scoring: {
    inputTopics: [
      TOPICS.RAW_ORDERS,
      TOPICS.RAW_PAYMENTS,
      TOPICS.RAW_SUPPORT,
      TOPICS.RAW_SHIPMENTS,
      TOPICS.RAW_CUSTOMERS,
    ],
    weights: RISK_WEIGHTS,
    escalationThreshold: 60,
  },

  agents: [
    {
      agentType: 'risk_scorer',
      displayName: 'Risk Scorer',
      description: 'Computes real-time risk scores from order, payment, support, and shipment signals',
      inputTopics: [TOPICS.RAW_ORDERS, TOPICS.RAW_PAYMENTS, TOPICS.RAW_SUPPORT, TOPICS.RAW_SHIPMENTS, TOPICS.RAW_CUSTOMERS],
      outputTopic: TOPICS.SIGNALS_RISK,
      auditTopic: TOPICS.AUDIT_INFERENCE,
      consumerGroup: CONSUMER_GROUPS.WORKER_RISK,
    },
    {
      agentType: 'recommendation_engine',
      displayName: 'AI Recommendation Engine',
      description: 'Generates AI-powered action recommendations from risk signals using Claude',
      inputTopics: [TOPICS.SIGNALS_RISK],
      outputTopic: TOPICS.DECISIONS_RECOMMENDATIONS,
      auditTopic: TOPICS.AUDIT_INFERENCE,
      consumerGroup: CONSUMER_GROUPS.WORKER_RECOMMEND,
    },
  ],

  lineage: {
    nodes: [
      { id: TOPICS.RAW_ORDERS, layer: 'raw', domain: 'retail' },
      { id: TOPICS.RAW_PAYMENTS, layer: 'raw', domain: 'retail' },
      { id: TOPICS.RAW_SUPPORT, layer: 'raw', domain: 'retail' },
      { id: TOPICS.RAW_SHIPMENTS, layer: 'raw', domain: 'retail' },
      { id: TOPICS.RAW_CUSTOMERS, layer: 'raw', domain: 'retail' },
      { id: TOPICS.CLEAN_ORDERS, layer: 'curated', domain: 'retail' },
      { id: TOPICS.CLEAN_PAYMENTS, layer: 'curated', domain: 'retail' },
      { id: TOPICS.ENRICHED_CUSTOMER_360, layer: 'enriched', domain: 'retail' },
      { id: TOPICS.SIGNALS_RISK, layer: 'signals', domain: 'retail' },
      { id: TOPICS.DECISIONS_RECOMMENDATIONS, layer: 'decisions', domain: 'retail' },
      { id: TOPICS.ACTIONS_AGENT, layer: 'actions', domain: 'retail' },
      { id: TOPICS.AUDIT_INFERENCE, layer: 'audit', domain: 'retail' },
    ],
    edges: [
      { from: TOPICS.RAW_ORDERS, to: TOPICS.CLEAN_ORDERS, processor: 'Flink: validate & standardize' },
      { from: TOPICS.RAW_PAYMENTS, to: TOPICS.CLEAN_PAYMENTS, processor: 'Flink: validate & standardize' },
      { from: TOPICS.CLEAN_ORDERS, to: TOPICS.ENRICHED_CUSTOMER_360, processor: 'Flink: temporal join' },
      { from: TOPICS.CLEAN_PAYMENTS, to: TOPICS.ENRICHED_CUSTOMER_360, processor: 'Flink: temporal join' },
      { from: TOPICS.RAW_CUSTOMERS, to: TOPICS.ENRICHED_CUSTOMER_360, processor: 'Flink: customer lookup' },
      { from: TOPICS.ENRICHED_CUSTOMER_360, to: TOPICS.SIGNALS_RISK, processor: 'Flink: windowed scoring' },
      { from: TOPICS.RAW_SUPPORT, to: TOPICS.SIGNALS_RISK, processor: 'Flink: sentiment analysis' },
      { from: TOPICS.RAW_SHIPMENTS, to: TOPICS.SIGNALS_RISK, processor: 'Flink: delay detection' },
      { from: TOPICS.SIGNALS_RISK, to: TOPICS.DECISIONS_RECOMMENDATIONS, processor: 'AI: Claude recommendation' },
      { from: TOPICS.DECISIONS_RECOMMENDATIONS, to: TOPICS.ACTIONS_AGENT, processor: 'Operator action' },
      { from: TOPICS.DECISIONS_RECOMMENDATIONS, to: TOPICS.AUDIT_INFERENCE, processor: 'Audit logger' },
    ],
  },

  schemas: [
    { schemaFile: 'order-created.avsc', topic: TOPICS.RAW_ORDERS, subject: `${TOPICS.RAW_ORDERS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'payment-failed.avsc', topic: TOPICS.RAW_PAYMENTS, subject: `${TOPICS.RAW_PAYMENTS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'support-ticket-updated.avsc', topic: TOPICS.RAW_SUPPORT, subject: `${TOPICS.RAW_SUPPORT}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'shipment-delayed.avsc', topic: TOPICS.RAW_SHIPMENTS, subject: `${TOPICS.RAW_SHIPMENTS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'customer-profile-updated.avsc', topic: TOPICS.RAW_CUSTOMERS, subject: `${TOPICS.RAW_CUSTOMERS}-value`, compatibilityLevel: 'FULL' },
    { schemaFile: 'risk-signal-generated.avsc', topic: TOPICS.SIGNALS_RISK, subject: `${TOPICS.SIGNALS_RISK}-value`, compatibilityLevel: 'FORWARD' },
    { schemaFile: 'ai-recommendation-created.avsc', topic: TOPICS.DECISIONS_RECOMMENDATIONS, subject: `${TOPICS.DECISIONS_RECOMMENDATIONS}-value`, compatibilityLevel: 'FULL' },
  ],

  piiFields: [
    { schema: 'order-created', field: 'shipping_address_hash', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'customer-profile-updated', field: 'email_hash', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'support-ticket-updated', field: 'summary_hash', classification: 'QUASI', handling: 'HASH' },
    { schema: 'customer-profile-updated', field: 'region', classification: 'QUASI', handling: 'MASK' },
    { schema: 'payment-failed', field: 'payment_id', classification: 'SENSITIVE', handling: 'ENCRYPT' },
    { schema: 'order-created', field: 'customer_id', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'fleet-order-event', field: 'customer_name_hash', classification: 'DIRECT', handling: 'HASH' },
  ],
};
