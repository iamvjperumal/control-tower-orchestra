export const TOPICS = {
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

export const ALL_TOPICS = Object.values(TOPICS);

export const RISK_WEIGHTS = {
  PAYMENT_FAILURES_10M: 30,
  PREMIUM_SHIPMENT_DELAY: 20,
  NEGATIVE_SUPPORT_24H: 25,
  REFUND_AFTER_SHIPMENT: 15,
  VIP_PRIORITY: 10,
} as const;

export const ESCALATION_THRESHOLD = 60;

export const CONSUMER_GROUPS = {
  API_STATE: 'retailops-api-state',
  WORKER_RISK: 'retailops-worker-risk',
  WORKER_RECOMMEND: 'retailops-worker-recommend',
} as const;

// --- FleetOps Control Tower ---

export const FLEET_TOPICS = {
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

export const ALL_FLEET_TOPICS = Object.values(FLEET_TOPICS);

export const FLEET_THRESHOLDS = {
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

export const FLEET_CONSUMER_GROUPS = {
  API_FLEET: 'fleetops-api-state',
  WORKER_DELAY: 'fleetops-delay-agent',
  WORKER_COLDCHAIN: 'fleetops-coldchain-agent',
  WORKER_SAFETY: 'fleetops-safety-agent',
  WORKER_MAINTENANCE: 'fleetops-maintenance-agent',
} as const;
