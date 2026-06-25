import type { UseCaseDefinition } from '../types.js';

const TOPICS = {
  RAW_OEE_TELEMETRY: 'factory.oee_telemetry.raw',
  RAW_SENSOR_EVENTS: 'factory.sensor_events.raw',
  RAW_QUALITY_DEFECTS: 'factory.quality_defects.raw',
  RAW_MAINTENANCE_ALERTS: 'factory.maintenance_alerts.raw',
  RAW_PRODUCTION_RUNS: 'factory.production_runs.raw',
  ENRICHED_OEE_METRICS: 'factory.oee_metrics.enriched',
  SIGNALS_DOWNTIME: 'factory.downtime.signals',
  DECISIONS_MAINTENANCE: 'factory.maintenance_decisions.decisions',
  ACTIONS_WORK_ORDERS: 'factory.work_orders.actions',
  AUDIT_COMPLIANCE: 'factory.compliance.audit',
} as const;

const RISK_WEIGHTS = {
  OEE_DEGRADATION: 35,
  VIBRATION_ANOMALY: 25,
  QUALITY_DEFECT_RATE: 25,
  MAINTENANCE_OVERDUE: 15,
} as const;

const CONSUMER_GROUPS = {
  API_STATE: 'factory-api-state',
  WORKER_RISK: 'factory-worker-risk',
  WORKER_RECOMMEND: 'factory-worker-recommend',
} as const;

export const factoryGuardianDefinition: UseCaseDefinition = {
  domain: 'factory',
  displayName: 'FactoryGuardian AI',
  description: 'Real-time OEE monitoring, predictive maintenance, and quality defect detection across production lines',
  entityIdField: 'machine_id',
  accentColor: '#f97316',
  icon: 'factory',

  topics: {
    raw: {
      oee_telemetry: TOPICS.RAW_OEE_TELEMETRY,
      sensor_events: TOPICS.RAW_SENSOR_EVENTS,
      quality_defects: TOPICS.RAW_QUALITY_DEFECTS,
      maintenance_alerts: TOPICS.RAW_MAINTENANCE_ALERTS,
      production_runs: TOPICS.RAW_PRODUCTION_RUNS,
    },
    enriched: {
      oee_metrics: TOPICS.ENRICHED_OEE_METRICS,
    },
    signals: {
      downtime: TOPICS.SIGNALS_DOWNTIME,
    },
    decisions: {
      maintenance_decisions: TOPICS.DECISIONS_MAINTENANCE,
    },
    actions: {
      work_orders: TOPICS.ACTIONS_WORK_ORDERS,
    },
    audit: {
      compliance: TOPICS.AUDIT_COMPLIANCE,
    },
  },

  allTopics: Object.values(TOPICS),

  thresholds: {
    ESCALATION_THRESHOLD: 65,
    OEE_WARNING: 75,
    OEE_CRITICAL: 60,
    VIBRATION_ALERT_G: 2.5,
  },

  consumerGroups: CONSUMER_GROUPS,

  scoring: {
    inputTopics: [
      TOPICS.RAW_OEE_TELEMETRY,
      TOPICS.RAW_SENSOR_EVENTS,
      TOPICS.RAW_QUALITY_DEFECTS,
      TOPICS.RAW_MAINTENANCE_ALERTS,
      TOPICS.RAW_PRODUCTION_RUNS,
    ],
    weights: RISK_WEIGHTS,
    escalationThreshold: 65,
  },

  agents: [
    {
      agentType: 'oee_monitor',
      displayName: 'OEE Monitor',
      description: 'Tracks equipment effectiveness, detects degradation patterns, and flags quality anomalies',
      inputTopics: [TOPICS.RAW_OEE_TELEMETRY, TOPICS.RAW_SENSOR_EVENTS, TOPICS.RAW_QUALITY_DEFECTS, TOPICS.RAW_MAINTENANCE_ALERTS],
      outputTopic: TOPICS.SIGNALS_DOWNTIME,
      auditTopic: TOPICS.AUDIT_COMPLIANCE,
      consumerGroup: CONSUMER_GROUPS.WORKER_RISK,
    },
    {
      agentType: 'recommendation_engine',
      displayName: 'AI Maintenance Decision Engine',
      description: 'Recommends preventive maintenance actions and production adjustments from OEE signals',
      inputTopics: [TOPICS.SIGNALS_DOWNTIME],
      outputTopic: TOPICS.DECISIONS_MAINTENANCE,
      auditTopic: TOPICS.AUDIT_COMPLIANCE,
      consumerGroup: CONSUMER_GROUPS.WORKER_RECOMMEND,
    },
  ],

  lineage: {
    nodes: [
      { id: TOPICS.RAW_OEE_TELEMETRY, layer: 'raw', domain: 'factory' },
      { id: TOPICS.RAW_SENSOR_EVENTS, layer: 'raw', domain: 'factory' },
      { id: TOPICS.RAW_QUALITY_DEFECTS, layer: 'raw', domain: 'factory' },
      { id: TOPICS.RAW_MAINTENANCE_ALERTS, layer: 'raw', domain: 'factory' },
      { id: TOPICS.RAW_PRODUCTION_RUNS, layer: 'raw', domain: 'factory' },
      { id: TOPICS.ENRICHED_OEE_METRICS, layer: 'enriched', domain: 'factory' },
      { id: TOPICS.SIGNALS_DOWNTIME, layer: 'signals', domain: 'factory' },
      { id: TOPICS.DECISIONS_MAINTENANCE, layer: 'decisions', domain: 'factory' },
      { id: TOPICS.ACTIONS_WORK_ORDERS, layer: 'actions', domain: 'factory' },
      { id: TOPICS.AUDIT_COMPLIANCE, layer: 'audit', domain: 'factory' },
    ],
    edges: [
      { from: TOPICS.RAW_OEE_TELEMETRY, to: TOPICS.ENRICHED_OEE_METRICS, processor: 'Flink: rolling OEE calc' },
      { from: TOPICS.RAW_PRODUCTION_RUNS, to: TOPICS.ENRICHED_OEE_METRICS, processor: 'Flink: run join' },
      { from: TOPICS.ENRICHED_OEE_METRICS, to: TOPICS.SIGNALS_DOWNTIME, processor: 'Flink: threshold detection' },
      { from: TOPICS.RAW_SENSOR_EVENTS, to: TOPICS.SIGNALS_DOWNTIME, processor: 'Flink: vibration analysis' },
      { from: TOPICS.RAW_QUALITY_DEFECTS, to: TOPICS.SIGNALS_DOWNTIME, processor: 'Flink: defect rate window' },
      { from: TOPICS.RAW_MAINTENANCE_ALERTS, to: TOPICS.SIGNALS_DOWNTIME, processor: 'Flink: alert aggregation' },
      { from: TOPICS.SIGNALS_DOWNTIME, to: TOPICS.DECISIONS_MAINTENANCE, processor: 'AI: watsonx/Claude recommendation' },
      { from: TOPICS.DECISIONS_MAINTENANCE, to: TOPICS.ACTIONS_WORK_ORDERS, processor: 'MES work order creation' },
      { from: TOPICS.DECISIONS_MAINTENANCE, to: TOPICS.AUDIT_COMPLIANCE, processor: 'Compliance audit logger' },
    ],
  },

  schemas: [
    { schemaFile: 'factory-oee-telemetry.avsc', topic: TOPICS.RAW_OEE_TELEMETRY, subject: `${TOPICS.RAW_OEE_TELEMETRY}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'factory-sensor-event.avsc', topic: TOPICS.RAW_SENSOR_EVENTS, subject: `${TOPICS.RAW_SENSOR_EVENTS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'factory-quality-defect.avsc', topic: TOPICS.RAW_QUALITY_DEFECTS, subject: `${TOPICS.RAW_QUALITY_DEFECTS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'factory-downtime-signal.avsc', topic: TOPICS.SIGNALS_DOWNTIME, subject: `${TOPICS.SIGNALS_DOWNTIME}-value`, compatibilityLevel: 'FORWARD' },
    { schemaFile: 'factory-maintenance-decision.avsc', topic: TOPICS.DECISIONS_MAINTENANCE, subject: `${TOPICS.DECISIONS_MAINTENANCE}-value`, compatibilityLevel: 'FULL' },
  ],

  piiFields: [
    { schema: 'factory-oee-telemetry', field: 'operator_id', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'factory-quality-defect', field: 'inspector_id', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'factory-sensor-event', field: 'machine_id', classification: 'QUASI', handling: 'MASK' },
  ],
};
