import type { UseCaseDefinition } from '../types.js';

const TOPICS = {
  RAW_ADMISSIONS: 'care.admissions.raw',
  RAW_VITALS: 'care.vitals.raw',
  RAW_BED_EVENTS: 'care.bed_events.raw',
  RAW_LAB_RESULTS: 'care.lab_results.raw',
  RAW_DISCHARGE_EVENTS: 'care.discharge_events.raw',
  ENRICHED_PATIENT_360: 'care.patient_360.enriched',
  SIGNALS_RISK: 'care.risk.signals',
  DECISIONS_CLINICAL: 'care.clinical_decisions.decisions',
  ACTIONS_CARE: 'care.care_actions.actions',
  AUDIT_HIPAA: 'care.hipaa.audit',
} as const;

const RISK_WEIGHTS = {
  VITAL_DETERIORATION: 40,
  READMISSION_RISK: 30,
  BED_CAPACITY_BREACH: 20,
  LAB_CRITICAL_FLAG: 10,
} as const;

const CONSUMER_GROUPS = {
  API_STATE: 'care-api-state',
  WORKER_RISK: 'care-worker-risk',
  WORKER_RECOMMEND: 'care-worker-recommend',
} as const;

export const careflowDefinition: UseCaseDefinition = {
  domain: 'care',
  displayName: 'CareFlow AI',
  description: 'Real-time patient flow optimization, clinical escalation detection, and readmission risk scoring',
  entityIdField: 'patient_id',
  accentColor: '#34d399',
  icon: 'heartbeat',

  topics: {
    raw: {
      admissions: TOPICS.RAW_ADMISSIONS,
      vitals: TOPICS.RAW_VITALS,
      bed_events: TOPICS.RAW_BED_EVENTS,
      lab_results: TOPICS.RAW_LAB_RESULTS,
      discharge_events: TOPICS.RAW_DISCHARGE_EVENTS,
    },
    enriched: {
      patient_360: TOPICS.ENRICHED_PATIENT_360,
    },
    signals: {
      risk: TOPICS.SIGNALS_RISK,
    },
    decisions: {
      clinical_decisions: TOPICS.DECISIONS_CLINICAL,
    },
    actions: {
      care_actions: TOPICS.ACTIONS_CARE,
    },
    audit: {
      hipaa: TOPICS.AUDIT_HIPAA,
    },
  },

  allTopics: Object.values(TOPICS),

  thresholds: {
    ESCALATION_THRESHOLD: 65,
    READMISSION_RISK_HIGH: 70,
    BED_CAPACITY_WARNING: 85,
  },

  consumerGroups: CONSUMER_GROUPS,

  scoring: {
    inputTopics: [
      TOPICS.RAW_ADMISSIONS,
      TOPICS.RAW_VITALS,
      TOPICS.RAW_BED_EVENTS,
      TOPICS.RAW_LAB_RESULTS,
      TOPICS.RAW_DISCHARGE_EVENTS,
    ],
    weights: RISK_WEIGHTS,
    escalationThreshold: 65,
  },

  agents: [
    {
      agentType: 'clinical_risk_scorer',
      displayName: 'Clinical Risk Scorer',
      description: 'Monitors vitals deterioration, readmission risk factors, and capacity constraints in real time',
      inputTopics: [TOPICS.RAW_ADMISSIONS, TOPICS.RAW_VITALS, TOPICS.RAW_BED_EVENTS, TOPICS.RAW_LAB_RESULTS],
      outputTopic: TOPICS.SIGNALS_RISK,
      auditTopic: TOPICS.AUDIT_HIPAA,
      consumerGroup: CONSUMER_GROUPS.WORKER_RISK,
    },
    {
      agentType: 'recommendation_engine',
      displayName: 'AI Clinical Decision Engine',
      description: 'Generates care recommendations and escalation alerts from clinical risk signals',
      inputTopics: [TOPICS.SIGNALS_RISK],
      outputTopic: TOPICS.DECISIONS_CLINICAL,
      auditTopic: TOPICS.AUDIT_HIPAA,
      consumerGroup: CONSUMER_GROUPS.WORKER_RECOMMEND,
    },
  ],

  lineage: {
    nodes: [
      { id: TOPICS.RAW_ADMISSIONS, layer: 'raw', domain: 'care' },
      { id: TOPICS.RAW_VITALS, layer: 'raw', domain: 'care' },
      { id: TOPICS.RAW_BED_EVENTS, layer: 'raw', domain: 'care' },
      { id: TOPICS.RAW_LAB_RESULTS, layer: 'raw', domain: 'care' },
      { id: TOPICS.RAW_DISCHARGE_EVENTS, layer: 'raw', domain: 'care' },
      { id: TOPICS.ENRICHED_PATIENT_360, layer: 'enriched', domain: 'care' },
      { id: TOPICS.SIGNALS_RISK, layer: 'signals', domain: 'care' },
      { id: TOPICS.DECISIONS_CLINICAL, layer: 'decisions', domain: 'care' },
      { id: TOPICS.ACTIONS_CARE, layer: 'actions', domain: 'care' },
      { id: TOPICS.AUDIT_HIPAA, layer: 'audit', domain: 'care' },
    ],
    edges: [
      { from: TOPICS.RAW_ADMISSIONS, to: TOPICS.ENRICHED_PATIENT_360, processor: 'Flink: patient join' },
      { from: TOPICS.RAW_VITALS, to: TOPICS.ENRICHED_PATIENT_360, processor: 'Flink: latest vitals' },
      { from: TOPICS.RAW_LAB_RESULTS, to: TOPICS.ENRICHED_PATIENT_360, processor: 'Flink: lab enrichment' },
      { from: TOPICS.ENRICHED_PATIENT_360, to: TOPICS.SIGNALS_RISK, processor: 'Flink: deterioration scoring' },
      { from: TOPICS.RAW_BED_EVENTS, to: TOPICS.SIGNALS_RISK, processor: 'Flink: capacity window' },
      { from: TOPICS.SIGNALS_RISK, to: TOPICS.DECISIONS_CLINICAL, processor: 'AI: watsonx/Claude recommendation' },
      { from: TOPICS.DECISIONS_CLINICAL, to: TOPICS.ACTIONS_CARE, processor: 'Care team action' },
      { from: TOPICS.DECISIONS_CLINICAL, to: TOPICS.AUDIT_HIPAA, processor: 'HIPAA audit logger' },
    ],
  },

  schemas: [
    { schemaFile: 'care-admission.avsc', topic: TOPICS.RAW_ADMISSIONS, subject: `${TOPICS.RAW_ADMISSIONS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'care-vitals.avsc', topic: TOPICS.RAW_VITALS, subject: `${TOPICS.RAW_VITALS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'care-bed-event.avsc', topic: TOPICS.RAW_BED_EVENTS, subject: `${TOPICS.RAW_BED_EVENTS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'care-lab-result.avsc', topic: TOPICS.RAW_LAB_RESULTS, subject: `${TOPICS.RAW_LAB_RESULTS}-value`, compatibilityLevel: 'BACKWARD' },
    { schemaFile: 'care-risk-signal.avsc', topic: TOPICS.SIGNALS_RISK, subject: `${TOPICS.SIGNALS_RISK}-value`, compatibilityLevel: 'FORWARD' },
    { schemaFile: 'care-clinical-decision.avsc', topic: TOPICS.DECISIONS_CLINICAL, subject: `${TOPICS.DECISIONS_CLINICAL}-value`, compatibilityLevel: 'FULL' },
  ],

  piiFields: [
    { schema: 'care-admission', field: 'patient_id', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'care-admission', field: 'date_of_birth', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'care-vitals', field: 'patient_id', classification: 'DIRECT', handling: 'HASH' },
    { schema: 'care-admission', field: 'diagnosis_code', classification: 'SENSITIVE', handling: 'REDACT' },
    { schema: 'care-admission', field: 'room_number', classification: 'QUASI', handling: 'MASK' },
    { schema: 'care-lab-result', field: 'ordering_physician_id', classification: 'QUASI', handling: 'MASK' },
  ],
};
