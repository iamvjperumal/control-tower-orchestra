import type { UseCaseDefinition } from '../types.js';

const TOPICS = {
  RAW_TRANSACTIONS: 'finguard.transactions.raw',
  RAW_AML_EVENTS: 'finguard.aml_events.raw',
  RAW_PAYMENT_RISK: 'finguard.payment_risk.raw',
  RAW_ACCOUNT_EVENTS: 'finguard.account_events.raw',
  ENRICHED_ACCOUNT_360: 'finguard.account_360.enriched',
  SIGNALS_FRAUD: 'finguard.fraud.signals',
  DECISIONS_RISK: 'finguard.risk_decisions.decisions',
  ACTIONS_CASE: 'finguard.case_actions.actions',
  AUDIT_COMPLIANCE: 'finguard.compliance.audit',
} as const;

const RISK_WEIGHTS = {
  TRANSACTION_VELOCITY: 35,
  AML_FLAG: 30,
  PAYMENT_RISK_SCORE: 25,
  ACCOUNT_AGE: 10,
} as const;

const CONSUMER_GROUPS = {
  API_STATE: 'finguard-api-state',
  WORKER_RISK: 'finguard-worker-risk',
  WORKER_RECOMMEND: 'finguard-worker-recommend',
} as const;

export const finguardDefinition: UseCaseDefinition = {
  domain: 'finguard',
  displayName: 'FinGuard AI',
  description: 'Real-time financial fraud detection, AML compliance, and payment risk scoring across transaction streams',
  entityIdField: 'account_id',
  accentColor: '#f59e0b',
  icon: 'shield-check',

  topics: {
    raw: {
      transactions: TOPICS.RAW_TRANSACTIONS,
      aml_events: TOPICS.RAW_AML_EVENTS,
      payment_risk: TOPICS.RAW_PAYMENT_RISK,
      account_events: TOPICS.RAW_ACCOUNT_EVENTS,
    },
    enriched: {
      account_360: TOPICS.ENRICHED_ACCOUNT_360,
    },
    signals: {
      fraud: TOPICS.SIGNALS_FRAUD,
    },
    decisions: {
      risk_decisions: TOPICS.DECISIONS_RISK,
    },
    actions: {
      case_actions: TOPICS.ACTIONS_CASE,
    },
    audit: {
      compliance: TOPICS.AUDIT_COMPLIANCE,
    },
  },

  allTopics: Object.values(TOPICS),

  thresholds: {
    ESCALATION_THRESHOLD: 70,
    AML_FLAG_THRESHOLD: 50,
    VELOCITY_ALERT_COUNT: 5,
  },

  consumerGroups: CONSUMER_GROUPS,

  scoring: {
    inputTopics: [
      TOPICS.RAW_TRANSACTIONS,
      TOPICS.RAW_AML_EVENTS,
      TOPICS.RAW_PAYMENT_RISK,
      TOPICS.RAW_ACCOUNT_EVENTS,
    ],
    weights: RISK_WEIGHTS,
    escalationThreshold: 70,
  },

  agents: [
    {
      agentType: 'fraud_detector',
      displayName: 'Fraud Detector',
      description: 'Detects transaction velocity anomalies, AML flags, and payment risk patterns in real time',
      inputTopics: [TOPICS.RAW_TRANSACTIONS, TOPICS.RAW_AML_EVENTS, TOPICS.RAW_PAYMENT_RISK, TOPICS.RAW_ACCOUNT_EVENTS],
      outputTopic: TOPICS.SIGNALS_FRAUD,
      auditTopic: TOPICS.AUDIT_COMPLIANCE,
      consumerGroup: CONSUMER_GROUPS.WORKER_RISK,
    },
    {
      agentType: 'recommendation_engine',
      displayName: 'AI Risk Decision Engine',
      description: 'Generates AI-powered fraud disposition recommendations from risk signals',
      inputTopics: [TOPICS.SIGNALS_FRAUD],
      outputTopic: TOPICS.DECISIONS_RISK,
      auditTopic: TOPICS.AUDIT_COMPLIANCE,
      consumerGroup: CONSUMER_GROUPS.WORKER_RECOMMEND,
    },
  ],

  lineage: {
    nodes: [
      { id: TOPICS.RAW_TRANSACTIONS, layer: 'raw', domain: 'finguard' },
      { id: TOPICS.RAW_AML_EVENTS, layer: 'raw', domain: 'finguard' },
      { id: TOPICS.RAW_PAYMENT_RISK, layer: 'raw', domain: 'finguard' },
      { id: TOPICS.RAW_ACCOUNT_EVENTS, layer: 'raw', domain: 'finguard' },
      { id: TOPICS.ENRICHED_ACCOUNT_360, layer: 'enriched', domain: 'finguard' },
      { id: TOPICS.SIGNALS_FRAUD, layer: 'signals', domain: 'finguard' },
      { id: TOPICS.DECISIONS_RISK, layer: 'decisions', domain: 'finguard' },
      { id: TOPICS.ACTIONS_CASE, layer: 'actions', domain: 'finguard' },
      { id: TOPICS.AUDIT_COMPLIANCE, layer: 'audit', domain: 'finguard' },
    ],
    edges: [
      { from: TOPICS.RAW_TRANSACTIONS, to: TOPICS.ENRICHED_ACCOUNT_360, processor: 'Flink: temporal join' },
      { from: TOPICS.RAW_ACCOUNT_EVENTS, to: TOPICS.ENRICHED_ACCOUNT_360, processor: 'Flink: account lookup' },
      { from: TOPICS.ENRICHED_ACCOUNT_360, to: TOPICS.SIGNALS_FRAUD, processor: 'Flink: velocity scoring' },
      { from: TOPICS.RAW_AML_EVENTS, to: TOPICS.SIGNALS_FRAUD, processor: 'Flink: AML flag detection' },
      { from: TOPICS.RAW_PAYMENT_RISK, to: TOPICS.SIGNALS_FRAUD, processor: 'Flink: risk aggregation' },
      { from: TOPICS.SIGNALS_FRAUD, to: TOPICS.DECISIONS_RISK, processor: 'AI: watsonx/Claude recommendation' },
      { from: TOPICS.DECISIONS_RISK, to: TOPICS.ACTIONS_CASE, processor: 'Analyst case action' },
      { from: TOPICS.DECISIONS_RISK, to: TOPICS.AUDIT_COMPLIANCE, processor: 'Compliance audit logger' },
    ],
  },

  schemas: [
    { schemaFile: 'finguard-transaction.avsc', topic: TOPICS.RAW_TRANSACTIONS, subject: `${TOPICS.RAW_TRANSACTIONS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'finguard-aml-event.avsc', topic: TOPICS.RAW_AML_EVENTS, subject: `${TOPICS.RAW_AML_EVENTS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'finguard-payment-risk.avsc', topic: TOPICS.RAW_PAYMENT_RISK, subject: `${TOPICS.RAW_PAYMENT_RISK}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'finguard-fraud-signal.avsc', topic: TOPICS.SIGNALS_FRAUD, subject: `${TOPICS.SIGNALS_FRAUD}-value`, compatibilityLevel: 'FORWARD' },
    { schemaFile: 'finguard-risk-decision.avsc', topic: TOPICS.DECISIONS_RISK, subject: `${TOPICS.DECISIONS_RISK}-value`, compatibilityLevel: 'FULL' },
  ],

  piiFields: [
    { schema: 'finguard-transaction', field: 'account_id', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'finguard-transaction', field: 'card_last4', classification: 'SENSITIVE', handling: 'ENCRYPT' },
    { schema: 'finguard-aml-event', field: 'beneficiary_account', classification: 'SENSITIVE', handling: 'ENCRYPT' },
    { schema: 'finguard-transaction', field: 'ip_address', classification: 'QUASI', handling: 'MASK' },
    { schema: 'finguard-transaction', field: 'merchant_id', classification: 'QUASI', handling: 'MASK' },
  ],
};
