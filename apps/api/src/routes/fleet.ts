import { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { setFleetDataGetter } from './copilot.js';

// --- Fleet Types ---
interface Vehicle {
  vehicle_id: string;
  driver_name: string;
  vehicle_type: 'van' | 'truck' | 'reefer';
  status: 'en_route' | 'idle' | 'delayed' | 'maintenance' | 'alert';
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

interface FleetIncident {
  incident_id: string;
  vehicle_id: string;
  type: 'eta_drift' | 'cold_chain_breach' | 'safety_alert' | 'maintenance_warning' | 'route_deviation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface AgentDecision {
  decision_id: string;
  agent_type: 'delay_agent' | 'coldchain_agent' | 'safety_agent' | 'maintenance_agent';
  vehicle_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  recommended_action: string;
  confidence: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'executed' | 'dismissed';
}

interface FleetEvent {
  event_id: string;
  event_type: string;
  vehicle_id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// --- Seed Data ---
const vehicles: Vehicle[] = [
  {
    vehicle_id: 'VH-2041', driver_name: 'Marcus Chen', vehicle_type: 'reefer',
    status: 'en_route', lat: 37.7749, lng: -122.4194, speed_kmh: 72, heading: 45,
    fuel_pct: 68, engine_temp_c: 92, eta_minutes: 47, eta_drift_minutes: 0,
    route_deviation_score: 5, safety_score: 92, current_order_id: 'ORD-8821',
    destination: 'Bay Area Distribution Center', coldchain_temp_c: -18.2,
    coldchain_target_c: -20.0, maintenance_risk: 12, last_update: new Date().toISOString(),
  },
  {
    vehicle_id: 'VH-3087', driver_name: 'Sarah Kim', vehicle_type: 'truck',
    status: 'en_route', lat: 34.0522, lng: -118.2437, speed_kmh: 88, heading: 180,
    fuel_pct: 45, engine_temp_c: 95, eta_minutes: 120, eta_drift_minutes: 0,
    route_deviation_score: 3, safety_score: 88, current_order_id: 'ORD-9102',
    destination: 'LA Warehouse Hub', coldchain_temp_c: null, coldchain_target_c: null,
    maintenance_risk: 28, last_update: new Date().toISOString(),
  },
  {
    vehicle_id: 'VH-1955', driver_name: 'James Rivera', vehicle_type: 'van',
    status: 'en_route', lat: 40.7128, lng: -74.0060, speed_kmh: 45, heading: 270,
    fuel_pct: 82, engine_temp_c: 88, eta_minutes: 22, eta_drift_minutes: 0,
    route_deviation_score: 2, safety_score: 95, current_order_id: 'ORD-7734',
    destination: 'Manhattan Drop Point', coldchain_temp_c: null, coldchain_target_c: null,
    maintenance_risk: 8, last_update: new Date().toISOString(),
  },
  {
    vehicle_id: 'VH-4120', driver_name: 'Priya Patel', vehicle_type: 'reefer',
    status: 'en_route', lat: 41.8781, lng: -87.6298, speed_kmh: 65, heading: 90,
    fuel_pct: 55, engine_temp_c: 91, eta_minutes: 85, eta_drift_minutes: 0,
    route_deviation_score: 4, safety_score: 90, current_order_id: 'ORD-6650',
    destination: 'Chicago Cold Storage', coldchain_temp_c: -19.5,
    coldchain_target_c: -20.0, maintenance_risk: 15, last_update: new Date().toISOString(),
  },
  {
    vehicle_id: 'VH-5502', driver_name: 'Tom Williams', vehicle_type: 'truck',
    status: 'idle', lat: 29.7604, lng: -95.3698, speed_kmh: 0, heading: 0,
    fuel_pct: 92, engine_temp_c: 40, eta_minutes: 0, eta_drift_minutes: 0,
    route_deviation_score: 0, safety_score: 97, current_order_id: '',
    destination: 'Houston Depot', coldchain_temp_c: null, coldchain_target_c: null,
    maintenance_risk: 5, last_update: new Date().toISOString(),
  },
  {
    vehicle_id: 'VH-6615', driver_name: 'Elena Vasquez', vehicle_type: 'van',
    status: 'en_route', lat: 47.6062, lng: -122.3321, speed_kmh: 55, heading: 135,
    fuel_pct: 71, engine_temp_c: 89, eta_minutes: 35, eta_drift_minutes: 0,
    route_deviation_score: 6, safety_score: 91, current_order_id: 'ORD-5590',
    destination: 'Seattle Metro Hub', coldchain_temp_c: null, coldchain_target_c: null,
    maintenance_risk: 22, last_update: new Date().toISOString(),
  },
  {
    vehicle_id: 'VH-7789', driver_name: 'Alex Johnson', vehicle_type: 'reefer',
    status: 'en_route', lat: 33.4484, lng: -112.0740, speed_kmh: 78, heading: 315,
    fuel_pct: 38, engine_temp_c: 97, eta_minutes: 95, eta_drift_minutes: 0,
    route_deviation_score: 7, safety_score: 85, current_order_id: 'ORD-4412',
    destination: 'Phoenix Pharma Depot', coldchain_temp_c: 3.8,
    coldchain_target_c: 4.0, maintenance_risk: 35, last_update: new Date().toISOString(),
  },
  {
    vehicle_id: 'VH-8234', driver_name: 'Kenji Tanaka', vehicle_type: 'truck',
    status: 'en_route', lat: 36.1627, lng: -86.7816, speed_kmh: 95, heading: 60,
    fuel_pct: 60, engine_temp_c: 93, eta_minutes: 65, eta_drift_minutes: 0,
    route_deviation_score: 3, safety_score: 82, current_order_id: 'ORD-3301',
    destination: 'Nashville Sorting Center', coldchain_temp_c: null, coldchain_target_c: null,
    maintenance_risk: 18, last_update: new Date().toISOString(),
  },
];

const incidents: FleetIncident[] = [];
const decisions: AgentDecision[] = [];
const events: FleetEvent[] = [];
let demoRunning: string | false = false;

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  vehicle_id: string;
  agents: string[];
  steps: number;
  duration_seconds: number;
  icon: string;
  color: string;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'delay',
    name: 'ETA Delay & Reroute',
    description: 'VH-2041 reefer hits traffic on I-80. ETA drifts from +8min to +18min as an accident is reported ahead. Delay Agent recommends rerouting via US-101, saving 12 minutes.',
    vehicle_id: 'VH-2041',
    agents: ['delay_agent'],
    steps: 5,
    duration_seconds: 12,
    icon: 'clock',
    color: '#fbbf24',
  },
  {
    id: 'coldchain',
    name: 'Cold Chain Breach',
    description: 'VH-4120 reefer compartment temperature rises from -19.5°C past -17°C to -14.2°C while the door is opened during a delay. Cold Chain Agent triggers priority drop at nearest cold storage.',
    vehicle_id: 'VH-4120',
    agents: ['coldchain_agent'],
    steps: 5,
    duration_seconds: 14,
    icon: 'thermometer',
    color: '#38bdf8',
  },
  {
    id: 'safety',
    name: 'Driver Safety Alert',
    description: 'VH-8234 driver triggers multiple harsh braking events, overspeeds at 125 km/h, and receives a fatigue alert. Safety score drops to 47. Safety Agent escalates to dispatcher.',
    vehicle_id: 'VH-8234',
    agents: ['safety_agent'],
    steps: 6,
    duration_seconds: 14,
    icon: 'shield',
    color: '#fb923c',
  },
  {
    id: 'maintenance',
    name: 'Maintenance Emergency',
    description: 'VH-7789 engine temp climbs from 98°C to 112°C with recurring fault code P0217. Maintenance risk hits 78%. Maintenance Agent schedules immediate service and recommends vehicle swap.',
    vehicle_id: 'VH-7789',
    agents: ['maintenance_agent'],
    steps: 5,
    duration_seconds: 14,
    icon: 'wrench',
    color: '#c084fc',
  },
  {
    id: 'full',
    name: 'Full Fleet Demo',
    description: 'Runs all four agent scenarios in sequence — delay, cold chain, safety, and maintenance — across VH-2041, VH-4120, VH-8234, and VH-7789. The complete FleetOps story in one demo.',
    vehicle_id: 'Multiple',
    agents: ['delay_agent', 'coldchain_agent', 'safety_agent', 'maintenance_agent'],
    steps: 21,
    duration_seconds: 60,
    icon: 'layers',
    color: '#fb923c',
  },
];

// SSE clients
const sseClients = new Map<string, any>();

function broadcast(eventType: string, data: unknown): void {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const reply of sseClients.values()) {
    try { reply.raw.write(payload); } catch {}
  }
}

function addEvent(type: string, vehicleId: string, data: Record<string, unknown>): FleetEvent {
  const evt: FleetEvent = {
    event_id: crypto.randomUUID(),
    event_type: type,
    vehicle_id: vehicleId,
    timestamp: new Date().toISOString(),
    data,
  };
  events.unshift(evt);
  if (events.length > 500) events.length = 500;
  broadcast('fleet-event', evt);
  return evt;
}

function addIncident(vehicleId: string, type: FleetIncident['type'], severity: FleetIncident['severity'], message: string): FleetIncident {
  const inc: FleetIncident = {
    incident_id: crypto.randomUUID(),
    vehicle_id: vehicleId,
    type, severity, message,
    timestamp: new Date().toISOString(),
    resolved: false,
  };
  incidents.unshift(inc);
  if (incidents.length > 200) incidents.length = 200;
  broadcast('fleet-incident', inc);
  return inc;
}

function addDecision(agentType: AgentDecision['agent_type'], vehicleId: string, severity: AgentDecision['severity'], reason: string, action: string, confidence: number): AgentDecision {
  const dec: AgentDecision = {
    decision_id: crypto.randomUUID(),
    agent_type: agentType,
    vehicle_id: vehicleId,
    severity, reason,
    recommended_action: action,
    confidence,
    timestamp: new Date().toISOString(),
    status: 'pending',
  };
  decisions.unshift(dec);
  if (decisions.length > 200) decisions.length = 200;
  broadcast('fleet-decision', dec);
  return dec;
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function emitStep(label: string): void {
  broadcast('fleet-demo-step', { step: label, timestamp: new Date().toISOString() });
}

async function runDelayScenario(): Promise<void> {
  const vh = vehicles.find(v => v.vehicle_id === 'VH-2041')!;

  emitStep('Normal telemetry from VH-2041');
  addEvent('telemetry', vh.vehicle_id, { speed_kmh: 72, engine_temp_c: 92, fuel_pct: 68 });
  await delay(2000);

  emitStep('Traffic congestion detected on I-80');
  vh.eta_drift_minutes = 8;
  vh.speed_kmh = 45;
  vh.status = 'delayed';
  vh.last_update = new Date().toISOString();
  addEvent('eta_update', vh.vehicle_id, { eta_drift_minutes: 8, reason: 'traffic_congestion' });
  addIncident(vh.vehicle_id, 'eta_drift', 'medium', 'ETA drift +8min due to traffic congestion on I-80');
  broadcast('fleet-vehicle-update', vh);
  await delay(2500);

  emitStep('Accident ahead — ETA drift worsens to +18min');
  vh.eta_drift_minutes = 18;
  vh.speed_kmh = 25;
  vh.route_deviation_score = 35;
  vh.last_update = new Date().toISOString();
  addEvent('eta_update', vh.vehicle_id, { eta_drift_minutes: 18, reason: 'accident_ahead' });
  addIncident(vh.vehicle_id, 'eta_drift', 'high', 'ETA drift +18min — accident reported ahead on primary route');
  broadcast('fleet-vehicle-update', vh);
  await delay(2000);

  emitStep('Delay Agent recommends reroute via US-101');
  addDecision('delay_agent', vh.vehicle_id, 'high',
    'ETA drift of 18 minutes exceeds SLA threshold. Alternative route via US-101 saves 12 minutes.',
    'REROUTE_VIA_US101', 0.91);
  await delay(2500);

  emitStep('Reroute accepted — ETA recovering');
  vh.status = 'en_route';
  vh.eta_drift_minutes = 6;
  vh.speed_kmh = 65;
  vh.route_deviation_score = 12;
  vh.last_update = new Date().toISOString();
  addEvent('route_change', vh.vehicle_id, { new_route: 'US-101 via Hayward', eta_improvement_minutes: 12 });
  broadcast('fleet-vehicle-update', vh);
}

async function runColdChainScenario(): Promise<void> {
  const vh = vehicles.find(v => v.vehicle_id === 'VH-4120')!;

  emitStep('Normal cold chain reading from VH-4120');
  addEvent('coldchain_reading', vh.vehicle_id, { temp_c: -19.5, target_c: -20.0, deviation: 0.5 });
  await delay(2000);

  emitStep('Temperature rising — deviation reaches 3°C');
  vh.coldchain_temp_c = -17.0;
  vh.last_update = new Date().toISOString();
  addEvent('coldchain_reading', vh.vehicle_id, { temp_c: -17.0, target_c: -20.0, deviation: 3.0 });
  addIncident(vh.vehicle_id, 'cold_chain_breach', 'medium', 'Cold chain temp -17.0°C, target -20.0°C — 3.0° deviation');
  broadcast('fleet-vehicle-update', vh);
  await delay(2500);

  emitStep('Temperature breach — door opened during delay');
  vh.coldchain_temp_c = -14.2;
  vh.last_update = new Date().toISOString();
  addEvent('coldchain_reading', vh.vehicle_id, { temp_c: -14.2, target_c: -20.0, deviation: 5.8, door_open: true });
  addIncident(vh.vehicle_id, 'cold_chain_breach', 'critical', 'Cold chain temp -14.2°C — 5.8° deviation, door opened');
  broadcast('fleet-vehicle-update', vh);
  await delay(2000);

  emitStep('Cold Chain Agent: priority drop at nearest cold storage');
  addDecision('coldchain_agent', vh.vehicle_id, 'critical',
    'Temperature breach: -14.2°C vs -20.0°C target (5.8° deviation). Door open event detected. Spoilage imminent — divert to nearest cold storage.',
    'PRIORITY_DROP_NEAREST_COLD_STORAGE', 0.94);
  await delay(2500);

  emitStep('Temperature recovering after door closed');
  vh.coldchain_temp_c = -18.0;
  vh.last_update = new Date().toISOString();
  addEvent('coldchain_reading', vh.vehicle_id, { temp_c: -18.0, target_c: -20.0, deviation: 2.0, door_open: false });
  broadcast('fleet-vehicle-update', vh);
}

async function runSafetyScenario(): Promise<void> {
  const vh = vehicles.find(v => v.vehicle_id === 'VH-8234')!;

  emitStep('VH-8234 harsh braking detected — 0.55g');
  vh.safety_score = 85;
  vh.last_update = new Date().toISOString();
  addEvent('safety_event', vh.vehicle_id, { type: 'harsh_braking', deceleration_g: 0.55 });
  addIncident(vh.vehicle_id, 'safety_alert', 'medium', 'Harsh braking — 0.55g deceleration');
  broadcast('fleet-vehicle-update', vh);
  await delay(2000);

  emitStep('Overspeed event — 125 km/h in 100 km/h zone');
  vh.safety_score = 72;
  vh.last_update = new Date().toISOString();
  addEvent('safety_event', vh.vehicle_id, { type: 'overspeed', speed_kmh: 125, speed_limit_kmh: 100 });
  addIncident(vh.vehicle_id, 'safety_alert', 'high', 'Overspeed — 125 km/h in 100 km/h zone');
  broadcast('fleet-vehicle-update', vh);
  await delay(2000);

  emitStep('Second harsh braking — 0.72g');
  vh.safety_score = 62;
  vh.last_update = new Date().toISOString();
  addEvent('safety_event', vh.vehicle_id, { type: 'harsh_braking', deceleration_g: 0.72 });
  broadcast('fleet-vehicle-update', vh);
  await delay(2000);

  emitStep('Fatigue alert triggered — score 0.78');
  vh.safety_score = 47;
  vh.status = 'alert';
  vh.last_update = new Date().toISOString();
  addEvent('safety_event', vh.vehicle_id, { type: 'fatigue_alert', fatigue_score: 0.78 });
  addIncident(vh.vehicle_id, 'safety_alert', 'critical', 'Driver fatigue alert — fatigue score 0.78, safety score 47');
  broadcast('fleet-vehicle-update', vh);
  await delay(2000);

  emitStep('Safety Agent: escalate to dispatcher');
  addDecision('safety_agent', vh.vehicle_id, 'critical',
    'Safety score dropped to 47. 2 harsh braking events, 1 overspeed, and fatigue alert within the hour. Immediate dispatcher review required.',
    'ESCALATE_TO_DISPATCHER', 0.92);
  await delay(2500);

  emitStep('Driver instructed to pull over for rest break');
  vh.status = 'idle';
  vh.speed_kmh = 0;
  vh.last_update = new Date().toISOString();
  addEvent('driver_event', vh.vehicle_id, { type: 'break_started', reason: 'dispatcher_ordered' });
  broadcast('fleet-vehicle-update', vh);
}

async function runMaintenanceScenario(): Promise<void> {
  const vh = vehicles.find(v => v.vehicle_id === 'VH-7789')!;

  emitStep('VH-7789 engine temp rising — 98°C');
  vh.engine_temp_c = 98;
  vh.maintenance_risk = 35;
  vh.last_update = new Date().toISOString();
  addEvent('maintenance_signal', vh.vehicle_id, { engine_temp_c: 98, maintenance_risk: 35 });
  broadcast('fleet-vehicle-update', vh);
  await delay(2000);

  emitStep('Fault code P0217 — coolant over-temperature');
  vh.engine_temp_c = 104;
  vh.maintenance_risk = 52;
  vh.last_update = new Date().toISOString();
  addEvent('maintenance_signal', vh.vehicle_id, { engine_temp_c: 104, maintenance_risk: 52, fault_code: 'P0217' });
  addIncident(vh.vehicle_id, 'maintenance_warning', 'high', 'Engine temp 104°C — fault code P0217 (coolant overtemp)');
  broadcast('fleet-vehicle-update', vh);
  await delay(2500);

  emitStep('Engine temp critical — 108°C, recurring fault');
  vh.engine_temp_c = 108;
  vh.maintenance_risk = 68;
  vh.last_update = new Date().toISOString();
  addEvent('maintenance_signal', vh.vehicle_id, { engine_temp_c: 108, maintenance_risk: 68, fault_code: 'P0217' });
  addIncident(vh.vehicle_id, 'maintenance_warning', 'critical', 'Engine temp 108°C — recurring P0217 fault, reefer compressor strain');
  broadcast('fleet-vehicle-update', vh);
  await delay(2000);

  emitStep('Maintenance Agent: schedule immediate service');
  addDecision('maintenance_agent', vh.vehicle_id, 'critical',
    'Engine temp 108°C with recurring fault P0217 (coolant overtemp). 3rd occurrence in 48h — compressor strain from reefer load. Risk score 68%.',
    'SCHEDULE_IMMEDIATE_SERVICE', 0.90);
  await delay(2500);

  emitStep('Second fault P2263 — turbo/supercharger boost');
  vh.engine_temp_c = 112;
  vh.maintenance_risk = 78;
  vh.status = 'maintenance';
  vh.last_update = new Date().toISOString();
  addEvent('maintenance_signal', vh.vehicle_id, { engine_temp_c: 112, maintenance_risk: 78, fault_code: 'P2263' });
  addIncident(vh.vehicle_id, 'maintenance_warning', 'critical', 'Engine temp 112°C + fault P2263 — vehicle entering maintenance mode');
  addDecision('maintenance_agent', vh.vehicle_id, 'critical',
    'Engine temp 112°C with dual faults P0217 + P2263. Maintenance risk 78%. Recommend vehicle swap and roadside service dispatch.',
    'RECOMMEND_VEHICLE_SWAP', 0.95);
  broadcast('fleet-vehicle-update', vh);
}

async function runScenarioById(id: string): Promise<void> {
  if (demoRunning) return;
  demoRunning = id;
  broadcast('fleet-demo-status', { scenario_id: id, status: 'running' });

  try {
    switch (id) {
      case 'delay': await runDelayScenario(); break;
      case 'coldchain': await runColdChainScenario(); break;
      case 'safety': await runSafetyScenario(); break;
      case 'maintenance': await runMaintenanceScenario(); break;
      case 'full':
        await runDelayScenario();
        await delay(2000);
        await runColdChainScenario();
        await delay(2000);
        await runSafetyScenario();
        await delay(2000);
        await runMaintenanceScenario();
        break;
    }
  } finally {
    demoRunning = false;
    broadcast('fleet-demo-status', { scenario_id: id, status: 'completed' });
  }
}

export async function fleetRoutes(app: FastifyInstance): Promise<void> {
  // Register fleet data getter for copilot
  setFleetDataGetter(() => ({
    vehicles,
    incidents,
    decisions,
  }));

  app.get('/api/fleet/vehicles', async () => vehicles);

  app.get<{ Params: { id: string } }>('/api/fleet/vehicles/:id', async (request, reply) => {
    const v = vehicles.find(v => v.vehicle_id === request.params.id);
    if (!v) return reply.status(404).send({ error: 'Vehicle not found' });
    return v;
  });

  app.get('/api/fleet/metrics', async () => {
    const active = vehicles.filter(v => v.status !== 'idle');
    const delayed = vehicles.filter(v => v.eta_drift_minutes > 10);
    const avgSafety = Math.round(vehicles.reduce((s, v) => s + v.safety_score, 0) / vehicles.length);
    const coldChainVehicles = vehicles.filter(v => v.coldchain_temp_c !== null);
    const coldChainBreaches = coldChainVehicles.filter(v =>
      v.coldchain_temp_c !== null && v.coldchain_target_c !== null &&
      Math.abs(v.coldchain_temp_c - v.coldchain_target_c) > 2
    );
    const avgEtaDrift = Math.round(active.reduce((s, v) => s + v.eta_drift_minutes, 0) / Math.max(active.length, 1));
    const activeIncidents = incidents.filter(i => !i.resolved).length;
    const pendingDecisions = decisions.filter(d => d.status === 'pending').length;

    return {
      total_vehicles: vehicles.length,
      active_vehicles: active.length,
      delayed_vehicles: delayed.length,
      avg_safety_score: avgSafety,
      avg_eta_drift_minutes: avgEtaDrift,
      coldchain_breaches: coldChainBreaches.length,
      active_incidents: activeIncidents,
      pending_decisions: pendingDecisions,
      on_time_rate: Math.round(((active.length - delayed.length) / Math.max(active.length, 1)) * 100),
      fleet_health: Math.round(100 - (vehicles.reduce((s, v) => s + v.maintenance_risk, 0) / vehicles.length)),
    };
  });

  app.get('/api/fleet/incidents', async () => incidents.slice(0, 50));

  app.get('/api/fleet/agents', async () => decisions.slice(0, 50));

  app.get('/api/fleet/events', async () => events.slice(0, 100));

  app.get('/api/fleet/events/stream', async (_request, reply) => {
    const id = crypto.randomUUID();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    sseClients.set(id, reply);
    reply.raw.on('close', () => sseClients.delete(id));

    // Send initial state
    reply.raw.write(`event: fleet-init\ndata: ${JSON.stringify({ vehicles, incidents: incidents.slice(0, 20), decisions: decisions.slice(0, 20) })}\n\n`);
  });

  app.get('/api/fleet/demo/scenarios', async () => ({
    scenarios: DEMO_SCENARIOS,
    running: demoRunning,
  }));

  app.post<{ Params: { id: string } }>('/api/fleet/demo/start/:id', async (request, reply) => {
    const scenario = DEMO_SCENARIOS.find(s => s.id === request.params.id);
    if (!scenario) return reply.status(404).send({ error: 'Scenario not found' });
    if (demoRunning) return reply.status(409).send({ error: 'A scenario is already running', running: demoRunning });
    runScenarioById(scenario.id).catch(console.error);
    return { status: 'started', scenario_id: scenario.id };
  });

  app.post<{ Params: { id: string }; Body: { status: string } }>(
    '/api/fleet/agents/:id/action',
    async (request, reply) => {
      const dec = decisions.find(d => d.decision_id === request.params.id);
      if (!dec) return reply.status(404).send({ error: 'Decision not found' });
      dec.status = request.body.status as AgentDecision['status'];
      broadcast('fleet-decision-update', dec);
      return { status: 'updated', decision: dec };
    },
  );
}
