import type { UseCaseDefinition } from '../types.js';

const TOPICS = {
  TELEMETRY_RAW: 'fleet.telemetry.raw',
  LOCATION_RAW: 'fleet.location_updates.raw',
  DRIVER_EVENTS_RAW: 'fleet.driver_events.raw',
  ORDER_EVENTS_RAW: 'fleet.order_events.raw',
  ROUTE_EVENTS_RAW: 'fleet.route_events.raw',
  COLDCHAIN_RAW: 'fleet.coldchain.raw',
  MAINTENANCE_RAW: 'fleet.maintenance.raw',
  SUPPORT_EVENTS_RAW: 'fleet.support_events.raw',
  METRICS_LIVE: 'fleet.metrics.live',
  RISK_ALERTS: 'fleet.risk.alerts',
  AGENT_DECISIONS: 'fleet.agent.decisions',
  AGENT_ACTIONS: 'fleet.agent.actions',
  AUDIT_LOG: 'fleet.audit.log',
} as const;

const THRESHOLDS = {
  ETA_DRIFT_WARNING_MINUTES: 10,
  ETA_DRIFT_CRITICAL_MINUTES: 20,
  COLDCHAIN_DEVIATION_WARNING_C: 2.0,
  COLDCHAIN_DEVIATION_CRITICAL_C: 5.0,
  SAFETY_SCORE_WARNING: 70,
  SAFETY_SCORE_CRITICAL: 50,
  MAINTENANCE_RISK_WARNING: 40,
  MAINTENANCE_RISK_CRITICAL: 70,
  HARSH_BRAKING_G: 0.5,
  OVERSPEED_KMH: 110,
  ENGINE_TEMP_WARNING_C: 100,
  ENGINE_TEMP_CRITICAL_C: 110,
} as const;

const CONSUMER_GROUPS = {
  API_FLEET: 'fleetops-api-state',
  WORKER_DELAY: 'fleetops-delay-agent',
  WORKER_COLDCHAIN: 'fleetops-coldchain-agent',
  WORKER_SAFETY: 'fleetops-safety-agent',
  WORKER_MAINTENANCE: 'fleetops-maintenance-agent',
} as const;

export const fleetDefinition: UseCaseDefinition = {
  domain: 'fleet',
  displayName: 'FleetOps Control Tower',
  description: 'Real-time logistics control tower with vehicle telemetry, cold-chain monitoring, and autonomous AI agents',
  entityIdField: 'vehicle_id',
  accentColor: '#fb923c',
  icon: 'truck',

  topics: {
    raw: {
      telemetry: TOPICS.TELEMETRY_RAW,
      location_updates: TOPICS.LOCATION_RAW,
      driver_events: TOPICS.DRIVER_EVENTS_RAW,
      order_events: TOPICS.ORDER_EVENTS_RAW,
      route_events: TOPICS.ROUTE_EVENTS_RAW,
      coldchain: TOPICS.COLDCHAIN_RAW,
      maintenance: TOPICS.MAINTENANCE_RAW,
      support_events: TOPICS.SUPPORT_EVENTS_RAW,
    },
    signals: {
      metrics_live: TOPICS.METRICS_LIVE,
      risk_alerts: TOPICS.RISK_ALERTS,
    },
    decisions: {
      agent_decisions: TOPICS.AGENT_DECISIONS,
    },
    actions: {
      agent_actions: TOPICS.AGENT_ACTIONS,
    },
    audit: {
      audit_log: TOPICS.AUDIT_LOG,
    },
  },

  allTopics: Object.values(TOPICS),

  thresholds: THRESHOLDS,

  consumerGroups: CONSUMER_GROUPS,

  scoring: {
    inputTopics: [
      TOPICS.TELEMETRY_RAW,
      TOPICS.ROUTE_EVENTS_RAW,
      TOPICS.COLDCHAIN_RAW,
      TOPICS.DRIVER_EVENTS_RAW,
      TOPICS.MAINTENANCE_RAW,
    ],
    weights: {
      ETA_DRIFT_HIGH: 30,
      COLDCHAIN_BREACH: 35,
      SAFETY_VIOLATION: 25,
      MAINTENANCE_RISK: 20,
      SLA_AT_RISK: 15,
    },
    escalationThreshold: 50,
  },

  agents: [
    {
      agentType: 'delay_agent',
      displayName: 'Delay Agent',
      description: 'Watches ETA drift and traffic anomalies, recommends rerouting or customer notification',
      inputTopics: [TOPICS.ROUTE_EVENTS_RAW, TOPICS.TELEMETRY_RAW],
      outputTopic: TOPICS.AGENT_DECISIONS,
      auditTopic: TOPICS.AUDIT_LOG,
      consumerGroup: CONSUMER_GROUPS.WORKER_DELAY,
    },
    {
      agentType: 'coldchain_agent',
      displayName: 'Cold Chain Agent',
      description: 'Monitors refrigeration telemetry and door-open events, recommends priority handling',
      inputTopics: [TOPICS.COLDCHAIN_RAW],
      outputTopic: TOPICS.AGENT_DECISIONS,
      auditTopic: TOPICS.AUDIT_LOG,
      consumerGroup: CONSUMER_GROUPS.WORKER_COLDCHAIN,
    },
    {
      agentType: 'safety_agent',
      displayName: 'Safety Agent',
      description: 'Detects harsh braking, overspeed, and fatigue, recommends driver coaching or escalation',
      inputTopics: [TOPICS.DRIVER_EVENTS_RAW, TOPICS.TELEMETRY_RAW],
      outputTopic: TOPICS.AGENT_DECISIONS,
      auditTopic: TOPICS.AUDIT_LOG,
      consumerGroup: CONSUMER_GROUPS.WORKER_SAFETY,
    },
    {
      agentType: 'maintenance_agent',
      displayName: 'Maintenance Agent',
      description: 'Watches engine health and fault codes, recommends service scheduling or vehicle swap',
      inputTopics: [TOPICS.MAINTENANCE_RAW, TOPICS.TELEMETRY_RAW],
      outputTopic: TOPICS.AGENT_DECISIONS,
      auditTopic: TOPICS.AUDIT_LOG,
      consumerGroup: CONSUMER_GROUPS.WORKER_MAINTENANCE,
    },
  ],

  lineage: {
    nodes: [
      { id: TOPICS.TELEMETRY_RAW, layer: 'raw', domain: 'fleet' },
      { id: TOPICS.LOCATION_RAW, layer: 'raw', domain: 'fleet' },
      { id: TOPICS.DRIVER_EVENTS_RAW, layer: 'raw', domain: 'fleet' },
      { id: TOPICS.ORDER_EVENTS_RAW, layer: 'raw', domain: 'fleet' },
      { id: TOPICS.ROUTE_EVENTS_RAW, layer: 'raw', domain: 'fleet' },
      { id: TOPICS.COLDCHAIN_RAW, layer: 'raw', domain: 'fleet' },
      { id: TOPICS.MAINTENANCE_RAW, layer: 'raw', domain: 'fleet' },
      { id: TOPICS.SUPPORT_EVENTS_RAW, layer: 'raw', domain: 'fleet' },
      { id: TOPICS.METRICS_LIVE, layer: 'signals', domain: 'fleet' },
      { id: TOPICS.RISK_ALERTS, layer: 'signals', domain: 'fleet' },
      { id: TOPICS.AGENT_DECISIONS, layer: 'decisions', domain: 'fleet' },
      { id: TOPICS.AGENT_ACTIONS, layer: 'actions', domain: 'fleet' },
      { id: TOPICS.AUDIT_LOG, layer: 'audit', domain: 'fleet' },
    ],
    edges: [
      { from: TOPICS.TELEMETRY_RAW, to: TOPICS.METRICS_LIVE, processor: 'Flink: vehicle metrics' },
      { from: TOPICS.LOCATION_RAW, to: TOPICS.METRICS_LIVE, processor: 'Flink: location enrichment' },
      { from: TOPICS.ROUTE_EVENTS_RAW, to: TOPICS.METRICS_LIVE, processor: 'Flink: ETA computation' },
      { from: TOPICS.COLDCHAIN_RAW, to: TOPICS.RISK_ALERTS, processor: 'Flink: breach detection' },
      { from: TOPICS.DRIVER_EVENTS_RAW, to: TOPICS.RISK_ALERTS, processor: 'Flink: safety scoring' },
      { from: TOPICS.MAINTENANCE_RAW, to: TOPICS.RISK_ALERTS, processor: 'Flink: health analysis' },
      { from: TOPICS.METRICS_LIVE, to: TOPICS.RISK_ALERTS, processor: 'Flink: threshold evaluation' },
      { from: TOPICS.RISK_ALERTS, to: TOPICS.AGENT_DECISIONS, processor: 'AI: agent decision' },
      { from: TOPICS.ORDER_EVENTS_RAW, to: TOPICS.RISK_ALERTS, processor: 'Flink: SLA monitoring' },
      { from: TOPICS.SUPPORT_EVENTS_RAW, to: TOPICS.RISK_ALERTS, processor: 'Flink: exception handling' },
      { from: TOPICS.AGENT_DECISIONS, to: TOPICS.AGENT_ACTIONS, processor: 'Operator/auto action' },
      { from: TOPICS.AGENT_DECISIONS, to: TOPICS.AUDIT_LOG, processor: 'Audit logger' },
    ],
  },

  schemas: [
    { schemaFile: 'telemetry-event.avsc', topic: TOPICS.TELEMETRY_RAW, subject: `${TOPICS.TELEMETRY_RAW}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'location-update.avsc', topic: TOPICS.LOCATION_RAW, subject: `${TOPICS.LOCATION_RAW}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'driver-event.avsc', topic: TOPICS.DRIVER_EVENTS_RAW, subject: `${TOPICS.DRIVER_EVENTS_RAW}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'route-event.avsc', topic: TOPICS.ROUTE_EVENTS_RAW, subject: `${TOPICS.ROUTE_EVENTS_RAW}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'coldchain-event.avsc', topic: TOPICS.COLDCHAIN_RAW, subject: `${TOPICS.COLDCHAIN_RAW}-value`, compatibilityLevel: 'FULL' },
    { schemaFile: 'maintenance-event.avsc', topic: TOPICS.MAINTENANCE_RAW, subject: `${TOPICS.MAINTENANCE_RAW}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'fleet-order-event.avsc', topic: TOPICS.ORDER_EVENTS_RAW, subject: `${TOPICS.ORDER_EVENTS_RAW}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'fleet-risk-alert.avsc', topic: TOPICS.RISK_ALERTS, subject: `${TOPICS.RISK_ALERTS}-value`, compatibilityLevel: 'FORWARD' },
    { schemaFile: 'fleet-agent-decision.avsc', topic: TOPICS.AGENT_DECISIONS, subject: `${TOPICS.AGENT_DECISIONS}-value`, compatibilityLevel: 'FULL' },
  ],

  piiFields: [
    { schema: 'fleet-order-event', field: 'customer_name_hash', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'driver-event', field: 'vehicle_id', classification: 'QUASI', handling: 'MASK' },
    { schema: 'telemetry-event', field: 'lat', classification: 'SENSITIVE', handling: 'REDACT' },
    { schema: 'telemetry-event', field: 'lng', classification: 'SENSITIVE', handling: 'REDACT' },
    { schema: 'location-update', field: 'lat', classification: 'SENSITIVE', handling: 'REDACT' },
    { schema: 'location-update', field: 'lng', classification: 'SENSITIVE', handling: 'REDACT' },
  ],
};
