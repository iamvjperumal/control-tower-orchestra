import type { UseCaseDefinition } from '../types.js';

const TOPICS = {
  RAW_DEMAND_TELEMETRY: 'gridwatch.demand_telemetry.raw',
  RAW_GRID_EVENTS: 'gridwatch.grid_events.raw',
  RAW_OUTAGE_REPORTS: 'gridwatch.outage_reports.raw',
  RAW_LOAD_METRICS: 'gridwatch.load_metrics.raw',
  ENRICHED_GRID_STATE: 'gridwatch.grid_state.enriched',
  SIGNALS_DEMAND_SPIKE: 'gridwatch.demand_spike.signals',
  DECISIONS_GRID: 'gridwatch.grid_decisions.decisions',
  ACTIONS_DISPATCH: 'gridwatch.dispatch_actions.actions',
  AUDIT_REGULATORY: 'gridwatch.regulatory.audit',
} as const;

const RISK_WEIGHTS = {
  DEMAND_SPIKE_SCORE: 35,
  GRID_INSTABILITY: 30,
  OUTAGE_PROXIMITY: 25,
  LOAD_IMBALANCE: 10,
} as const;

const CONSUMER_GROUPS = {
  API_STATE: 'gridwatch-api-state',
  WORKER_RISK: 'gridwatch-worker-risk',
  WORKER_RECOMMEND: 'gridwatch-worker-recommend',
} as const;

export const gridwatchDefinition: UseCaseDefinition = {
  domain: 'gridwatch',
  displayName: 'GridWatch AI',
  description: 'Real-time energy grid demand spike detection, outage prediction, and load balancing decisions',
  entityIdField: 'grid_node_id',
  accentColor: '#facc15',
  icon: 'zap',

  topics: {
    raw: {
      demand_telemetry: TOPICS.RAW_DEMAND_TELEMETRY,
      grid_events: TOPICS.RAW_GRID_EVENTS,
      outage_reports: TOPICS.RAW_OUTAGE_REPORTS,
      load_metrics: TOPICS.RAW_LOAD_METRICS,
    },
    enriched: {
      grid_state: TOPICS.ENRICHED_GRID_STATE,
    },
    signals: {
      demand_spike: TOPICS.SIGNALS_DEMAND_SPIKE,
    },
    decisions: {
      grid_decisions: TOPICS.DECISIONS_GRID,
    },
    actions: {
      dispatch_actions: TOPICS.ACTIONS_DISPATCH,
    },
    audit: {
      regulatory: TOPICS.AUDIT_REGULATORY,
    },
  },

  allTopics: Object.values(TOPICS),

  thresholds: {
    ESCALATION_THRESHOLD: 75,
    DEMAND_SPIKE_PCT: 120,
    LOAD_CRITICAL_PCT: 95,
    OUTAGE_RISK_SCORE: 80,
  },

  consumerGroups: CONSUMER_GROUPS,

  scoring: {
    inputTopics: [
      TOPICS.RAW_DEMAND_TELEMETRY,
      TOPICS.RAW_GRID_EVENTS,
      TOPICS.RAW_OUTAGE_REPORTS,
      TOPICS.RAW_LOAD_METRICS,
    ],
    weights: RISK_WEIGHTS,
    escalationThreshold: 75,
  },

  agents: [
    {
      agentType: 'grid_monitor',
      displayName: 'Grid Monitor',
      description: 'Detects demand spikes, grid instability, and load imbalance patterns in real time',
      inputTopics: [TOPICS.RAW_DEMAND_TELEMETRY, TOPICS.RAW_GRID_EVENTS, TOPICS.RAW_OUTAGE_REPORTS, TOPICS.RAW_LOAD_METRICS],
      outputTopic: TOPICS.SIGNALS_DEMAND_SPIKE,
      auditTopic: TOPICS.AUDIT_REGULATORY,
      consumerGroup: CONSUMER_GROUPS.WORKER_RISK,
    },
    {
      agentType: 'recommendation_engine',
      displayName: 'AI Grid Decision Engine',
      description: 'Recommends load balancing, demand response, and dispatch actions from grid signals',
      inputTopics: [TOPICS.SIGNALS_DEMAND_SPIKE],
      outputTopic: TOPICS.DECISIONS_GRID,
      auditTopic: TOPICS.AUDIT_REGULATORY,
      consumerGroup: CONSUMER_GROUPS.WORKER_RECOMMEND,
    },
  ],

  lineage: {
    nodes: [
      { id: TOPICS.RAW_DEMAND_TELEMETRY, layer: 'raw', domain: 'gridwatch' },
      { id: TOPICS.RAW_GRID_EVENTS, layer: 'raw', domain: 'gridwatch' },
      { id: TOPICS.RAW_OUTAGE_REPORTS, layer: 'raw', domain: 'gridwatch' },
      { id: TOPICS.RAW_LOAD_METRICS, layer: 'raw', domain: 'gridwatch' },
      { id: TOPICS.ENRICHED_GRID_STATE, layer: 'enriched', domain: 'gridwatch' },
      { id: TOPICS.SIGNALS_DEMAND_SPIKE, layer: 'signals', domain: 'gridwatch' },
      { id: TOPICS.DECISIONS_GRID, layer: 'decisions', domain: 'gridwatch' },
      { id: TOPICS.ACTIONS_DISPATCH, layer: 'actions', domain: 'gridwatch' },
      { id: TOPICS.AUDIT_REGULATORY, layer: 'audit', domain: 'gridwatch' },
    ],
    edges: [
      { from: TOPICS.RAW_DEMAND_TELEMETRY, to: TOPICS.ENRICHED_GRID_STATE, processor: 'Flink: demand aggregation' },
      { from: TOPICS.RAW_LOAD_METRICS, to: TOPICS.ENRICHED_GRID_STATE, processor: 'Flink: load enrichment' },
      { from: TOPICS.ENRICHED_GRID_STATE, to: TOPICS.SIGNALS_DEMAND_SPIKE, processor: 'Flink: spike detection' },
      { from: TOPICS.RAW_GRID_EVENTS, to: TOPICS.SIGNALS_DEMAND_SPIKE, processor: 'Flink: event correlation' },
      { from: TOPICS.RAW_OUTAGE_REPORTS, to: TOPICS.SIGNALS_DEMAND_SPIKE, processor: 'Flink: outage proximity' },
      { from: TOPICS.SIGNALS_DEMAND_SPIKE, to: TOPICS.DECISIONS_GRID, processor: 'AI: watsonx/Claude recommendation' },
      { from: TOPICS.DECISIONS_GRID, to: TOPICS.ACTIONS_DISPATCH, processor: 'Grid dispatch action' },
      { from: TOPICS.DECISIONS_GRID, to: TOPICS.AUDIT_REGULATORY, processor: 'Regulatory audit logger' },
    ],
  },

  schemas: [
    { schemaFile: 'gridwatch-demand-telemetry.avsc', topic: TOPICS.RAW_DEMAND_TELEMETRY, subject: `${TOPICS.RAW_DEMAND_TELEMETRY}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'gridwatch-grid-event.avsc', topic: TOPICS.RAW_GRID_EVENTS, subject: `${TOPICS.RAW_GRID_EVENTS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'gridwatch-load-metric.avsc', topic: TOPICS.RAW_LOAD_METRICS, subject: `${TOPICS.RAW_LOAD_METRICS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'gridwatch-demand-spike-signal.avsc', topic: TOPICS.SIGNALS_DEMAND_SPIKE, subject: `${TOPICS.SIGNALS_DEMAND_SPIKE}-value`, compatibilityLevel: 'FORWARD' },
    { schemaFile: 'gridwatch-grid-decision.avsc', topic: TOPICS.DECISIONS_GRID, subject: `${TOPICS.DECISIONS_GRID}-value`, compatibilityLevel: 'FULL' },
  ],

  piiFields: [
    { schema: 'gridwatch-demand-telemetry', field: 'meter_id', classification: 'QUASI', handling: 'MASK' },
    { schema: 'gridwatch-outage-report', field: 'customer_account_id', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'gridwatch-outage-report', field: 'address_hash', classification: 'DIRECT', handling: 'HASH' },
  ],
};
