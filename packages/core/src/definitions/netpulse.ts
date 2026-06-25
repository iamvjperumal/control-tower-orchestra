import type { UseCaseDefinition } from '../types.js';

const TOPICS = {
  RAW_DEVICE_TELEMETRY: 'netpulse.device_telemetry.raw',
  RAW_SLA_EVENTS: 'netpulse.sla_events.raw',
  RAW_CAPACITY_METRICS: 'netpulse.capacity_metrics.raw',
  RAW_ANOMALY_EVENTS: 'netpulse.anomaly_events.raw',
  ENRICHED_DEVICE_HEALTH: 'netpulse.device_health.enriched',
  SIGNALS_ANOMALY: 'netpulse.anomaly.signals',
  DECISIONS_INCIDENT: 'netpulse.incident_decisions.decisions',
  ACTIONS_REMEDIATION: 'netpulse.remediation_actions.actions',
  AUDIT_OPS: 'netpulse.ops.audit',
} as const;

const RISK_WEIGHTS = {
  PACKET_LOSS_RATE: 30,
  LATENCY_SPIKE: 25,
  CAPACITY_SATURATION: 25,
  SLA_BREACH_RISK: 20,
} as const;

const CONSUMER_GROUPS = {
  API_STATE: 'netpulse-api-state',
  WORKER_RISK: 'netpulse-worker-risk',
  WORKER_RECOMMEND: 'netpulse-worker-recommend',
} as const;

export const netpulseDefinition: UseCaseDefinition = {
  domain: 'netpulse',
  displayName: 'NetPulse AI',
  description: 'Real-time network anomaly detection, SLA breach prediction, and capacity saturation alerting',
  entityIdField: 'device_id',
  accentColor: '#38bdf8',
  icon: 'network',

  topics: {
    raw: {
      device_telemetry: TOPICS.RAW_DEVICE_TELEMETRY,
      sla_events: TOPICS.RAW_SLA_EVENTS,
      capacity_metrics: TOPICS.RAW_CAPACITY_METRICS,
      anomaly_events: TOPICS.RAW_ANOMALY_EVENTS,
    },
    enriched: {
      device_health: TOPICS.ENRICHED_DEVICE_HEALTH,
    },
    signals: {
      anomaly: TOPICS.SIGNALS_ANOMALY,
    },
    decisions: {
      incident_decisions: TOPICS.DECISIONS_INCIDENT,
    },
    actions: {
      remediation_actions: TOPICS.ACTIONS_REMEDIATION,
    },
    audit: {
      ops: TOPICS.AUDIT_OPS,
    },
  },

  allTopics: Object.values(TOPICS),

  thresholds: {
    ESCALATION_THRESHOLD: 70,
    PACKET_LOSS_PCT: 5,
    LATENCY_MS_ALERT: 200,
    CAPACITY_PCT_ALERT: 90,
  },

  consumerGroups: CONSUMER_GROUPS,

  scoring: {
    inputTopics: [
      TOPICS.RAW_DEVICE_TELEMETRY,
      TOPICS.RAW_SLA_EVENTS,
      TOPICS.RAW_CAPACITY_METRICS,
      TOPICS.RAW_ANOMALY_EVENTS,
    ],
    weights: RISK_WEIGHTS,
    escalationThreshold: 70,
  },

  agents: [
    {
      agentType: 'anomaly_detector',
      displayName: 'Network Anomaly Detector',
      description: 'Detects packet loss, latency spikes, capacity saturation, and SLA breach risks in real time',
      inputTopics: [TOPICS.RAW_DEVICE_TELEMETRY, TOPICS.RAW_SLA_EVENTS, TOPICS.RAW_CAPACITY_METRICS, TOPICS.RAW_ANOMALY_EVENTS],
      outputTopic: TOPICS.SIGNALS_ANOMALY,
      auditTopic: TOPICS.AUDIT_OPS,
      consumerGroup: CONSUMER_GROUPS.WORKER_RISK,
    },
    {
      agentType: 'recommendation_engine',
      displayName: 'AI Incident Response Engine',
      description: 'Recommends remediation actions and escalation paths from network anomaly signals',
      inputTopics: [TOPICS.SIGNALS_ANOMALY],
      outputTopic: TOPICS.DECISIONS_INCIDENT,
      auditTopic: TOPICS.AUDIT_OPS,
      consumerGroup: CONSUMER_GROUPS.WORKER_RECOMMEND,
    },
  ],

  lineage: {
    nodes: [
      { id: TOPICS.RAW_DEVICE_TELEMETRY, layer: 'raw', domain: 'netpulse' },
      { id: TOPICS.RAW_SLA_EVENTS, layer: 'raw', domain: 'netpulse' },
      { id: TOPICS.RAW_CAPACITY_METRICS, layer: 'raw', domain: 'netpulse' },
      { id: TOPICS.RAW_ANOMALY_EVENTS, layer: 'raw', domain: 'netpulse' },
      { id: TOPICS.ENRICHED_DEVICE_HEALTH, layer: 'enriched', domain: 'netpulse' },
      { id: TOPICS.SIGNALS_ANOMALY, layer: 'signals', domain: 'netpulse' },
      { id: TOPICS.DECISIONS_INCIDENT, layer: 'decisions', domain: 'netpulse' },
      { id: TOPICS.ACTIONS_REMEDIATION, layer: 'actions', domain: 'netpulse' },
      { id: TOPICS.AUDIT_OPS, layer: 'audit', domain: 'netpulse' },
    ],
    edges: [
      { from: TOPICS.RAW_DEVICE_TELEMETRY, to: TOPICS.ENRICHED_DEVICE_HEALTH, processor: 'Flink: device state join' },
      { from: TOPICS.RAW_CAPACITY_METRICS, to: TOPICS.ENRICHED_DEVICE_HEALTH, processor: 'Flink: capacity enrichment' },
      { from: TOPICS.ENRICHED_DEVICE_HEALTH, to: TOPICS.SIGNALS_ANOMALY, processor: 'Flink: anomaly scoring' },
      { from: TOPICS.RAW_SLA_EVENTS, to: TOPICS.SIGNALS_ANOMALY, processor: 'Flink: SLA breach detection' },
      { from: TOPICS.RAW_ANOMALY_EVENTS, to: TOPICS.SIGNALS_ANOMALY, processor: 'Flink: event correlation' },
      { from: TOPICS.SIGNALS_ANOMALY, to: TOPICS.DECISIONS_INCIDENT, processor: 'AI: watsonx/Claude recommendation' },
      { from: TOPICS.DECISIONS_INCIDENT, to: TOPICS.ACTIONS_REMEDIATION, processor: 'NOC remediation action' },
      { from: TOPICS.DECISIONS_INCIDENT, to: TOPICS.AUDIT_OPS, processor: 'Ops audit logger' },
    ],
  },

  schemas: [
    { schemaFile: 'netpulse-device-telemetry.avsc', topic: TOPICS.RAW_DEVICE_TELEMETRY, subject: `${TOPICS.RAW_DEVICE_TELEMETRY}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'netpulse-sla-event.avsc', topic: TOPICS.RAW_SLA_EVENTS, subject: `${TOPICS.RAW_SLA_EVENTS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'netpulse-capacity-metric.avsc', topic: TOPICS.RAW_CAPACITY_METRICS, subject: `${TOPICS.RAW_CAPACITY_METRICS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'netpulse-anomaly-signal.avsc', topic: TOPICS.SIGNALS_ANOMALY, subject: `${TOPICS.SIGNALS_ANOMALY}-value`, compatibilityLevel: 'FORWARD' },
    { schemaFile: 'netpulse-incident-decision.avsc', topic: TOPICS.DECISIONS_INCIDENT, subject: `${TOPICS.DECISIONS_INCIDENT}-value`, compatibilityLevel: 'FULL' },
  ],

  piiFields: [
    { schema: 'netpulse-device-telemetry', field: 'device_id', classification: 'QUASI', handling: 'MASK' },
    { schema: 'netpulse-sla-event', field: 'customer_id', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'netpulse-sla-event', field: 'service_contract_id', classification: 'SENSITIVE', handling: 'ENCRYPT' },
  ],
};
