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
  shipping_address_hash: string;
}

export interface PaymentFailed extends BaseEvent {
  event_type: 'payment-failed';
  order_id: string;
  payment_id: string;
  failure_code: string;
  amount: number;
  currency: string;
  attempt_number: number;
}

export interface SupportTicketUpdated extends BaseEvent {
  event_type: 'support-ticket-updated';
  ticket_id: string;
  channel: 'chat' | 'email' | 'phone';
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  category: string;
  summary_hash: string;
}

export interface ShipmentDelayed extends BaseEvent {
  event_type: 'shipment-delayed';
  order_id: string;
  shipment_id: string;
  carrier: string;
  delay_hours: number;
  reason: string;
  original_eta: string;
  revised_eta: string;
}

export interface CustomerProfileUpdated extends BaseEvent {
  event_type: 'customer-profile-updated';
  tier: 'standard' | 'premium' | 'vip';
  lifetime_value: number;
  account_age_days: number;
  region: string;
  email_hash: string;
}

export interface RiskSignalGenerated extends BaseEvent {
  event_type: 'risk-signal-generated';
  risk_score: number;
  contributing_signals: string[];
  window_start: string;
  window_end: string;
  related_order_ids: string[];
}

export type RecommendedAction =
  | 'ESCALATE_FRAUD_REVIEW'
  | 'VIP_RETENTION'
  | 'REFUND_APPROVE'
  | 'MONITOR'
  | 'NO_ACTION';

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

export interface OperatorAction {
  action_id: string;
  recommendation_id: string;
  operator_id: string;
  action_taken: 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'DISMISSED';
  timestamp: string;
  notes?: string;
}

export type RawEvent =
  | OrderCreated
  | PaymentFailed
  | SupportTicketUpdated
  | ShipmentDelayed
  | CustomerProfileUpdated;

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

// --- FleetOps Control Tower Types ---

export type VehicleType = 'van' | 'truck' | 'reefer';
export type VehicleStatus = 'en_route' | 'idle' | 'delayed' | 'maintenance' | 'alert';
export type FleetIncidentType = 'eta_drift' | 'cold_chain_breach' | 'safety_alert' | 'maintenance_warning' | 'route_deviation';
export type FleetSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FleetAgentType = 'delay_agent' | 'coldchain_agent' | 'safety_agent' | 'maintenance_agent';
export type FleetDecisionStatus = 'pending' | 'approved' | 'executed' | 'dismissed';

export interface FleetBaseEvent {
  event_id: string;
  event_type: string;
  event_time: string;
  source_system: string;
  vehicle_id: string;
}

export interface TelemetryEvent extends FleetBaseEvent {
  event_type: 'telemetry';
  lat: number;
  lng: number;
  speed_kmh: number;
  heading: number;
  fuel_pct: number;
  engine_temp_c: number;
  odometer_km: number;
}

export interface LocationUpdate extends FleetBaseEvent {
  event_type: 'location_update';
  lat: number;
  lng: number;
  speed_kmh: number;
  heading: number;
  accuracy_m: number;
}

export interface RouteEvent extends FleetBaseEvent {
  event_type: 'route_update' | 'route_deviation' | 'route_completed';
  route_id: string;
  origin: string;
  destination: string;
  planned_eta: string;
  current_eta: string;
  eta_drift_minutes: number;
  deviation_score: number;
  distance_remaining_km: number;
}

export interface FleetOrderEvent extends FleetBaseEvent {
  event_type: 'delivery_assigned' | 'delivery_started' | 'delivery_completed' | 'delivery_failed';
  order_id: string;
  customer_name_hash: string;
  destination: string;
  sla_deadline: string;
  priority: 'standard' | 'express' | 'critical';
}

export interface ColdChainEvent extends FleetBaseEvent {
  event_type: 'coldchain_reading' | 'coldchain_breach' | 'coldchain_recovery';
  compartment_id: string;
  current_temp_c: number;
  target_temp_c: number;
  deviation_c: number;
  door_open: boolean;
  humidity_pct: number;
}

export interface MaintenanceEvent extends FleetBaseEvent {
  event_type: 'maintenance_signal' | 'fault_code' | 'service_due' | 'breakdown';
  fault_code: string | null;
  engine_temp_c: number;
  oil_pressure_psi: number;
  brake_wear_pct: number;
  tire_pressure_psi: number[];
  maintenance_risk_score: number;
  description: string;
}

export interface DriverEvent extends FleetBaseEvent {
  event_type: 'harsh_braking' | 'harsh_acceleration' | 'overspeed' | 'fatigue_alert' | 'break_started' | 'break_ended';
  deceleration_g?: number;
  acceleration_g?: number;
  speed_kmh?: number;
  speed_limit_kmh?: number;
  fatigue_score?: number;
}

export interface FleetRiskAlert extends FleetBaseEvent {
  event_type: 'fleet_risk_alert';
  alert_type: FleetIncidentType;
  severity: FleetSeverity;
  message: string;
  contributing_signals: string[];
  risk_score: number;
}

export interface FleetAgentDecision {
  decision_id: string;
  agent_type: FleetAgentType;
  vehicle_id: string;
  severity: FleetSeverity;
  reason: string;
  recommended_action: string;
  confidence: number;
  generated_at: string;
  status: FleetDecisionStatus;
  context: Record<string, unknown>;
}

export interface FleetAgentAction {
  action_id: string;
  decision_id: string;
  agent_type: FleetAgentType;
  vehicle_id: string;
  action_taken: 'approved' | 'dismissed' | 'escalated' | 'auto_executed';
  operator_id: string;
  timestamp: string;
  notes?: string;
}

export interface FleetAuditEntry {
  audit_id: string;
  agent_type: FleetAgentType;
  decision_id: string;
  vehicle_id: string;
  model_id: string;
  prompt_hash: string;
  input_context_hash: string;
  confidence: number;
  latency_ms: number;
  timestamp: string;
}

export type FleetRawEvent =
  | TelemetryEvent
  | LocationUpdate
  | RouteEvent
  | FleetOrderEvent
  | ColdChainEvent
  | MaintenanceEvent
  | DriverEvent;

export interface VehicleState {
  vehicle_id: string;
  driver_name: string;
  vehicle_type: VehicleType;
  status: VehicleStatus;
  lat: number;
  lng: number;
  speed_kmh: number;
  heading: number;
  fuel_pct: number;
  engine_temp_c: number;
  eta_minutes: number;
  eta_drift_minutes: number;
  route_deviation_score: number;
  safety_score: number;
  current_order_id: string;
  destination: string;
  coldchain_temp_c: number | null;
  coldchain_target_c: number | null;
  maintenance_risk: number;
  last_update: string;
}
