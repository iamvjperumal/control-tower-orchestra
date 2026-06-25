import { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';

interface ReplayEvent {
  event_id: string;
  event_type: string;
  event_time: string;
  source_system: string;
  customer_id: string;
  delay_ms: number;
  metadata: Record<string, unknown>;
}

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  customer_id: string;
  duration_seconds: number;
  events: ReplayEvent[];
}

function buildFraudScenario(): DemoScenario {
  const customerId = 'c-1003';
  const baseTime = Date.now();

  return {
    id: 'fraud-escalation',
    name: 'Fraud Risk Escalation',
    description: 'Premium customer with multiple payment failures, shipment delay, and negative support interaction triggering fraud review.',
    customer_id: customerId,
    duration_seconds: 60,
    events: [
      {
        event_id: crypto.randomUUID(),
        event_type: 'customer-profile-updated',
        event_time: new Date(baseTime).toISOString(),
        source_system: 'crm',
        customer_id: customerId,
        delay_ms: 0,
        metadata: { tier: 'standard', lifetime_value: 450, region: 'EU-WEST', account_age_days: 30 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'order-created',
        event_time: new Date(baseTime + 2000).toISOString(),
        source_system: 'order-service',
        customer_id: customerId,
        delay_ms: 2000,
        metadata: { order_id: 'ord-demo-001', total_amount: 2499.99, currency: 'USD', item_count: 3, is_premium: true },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'payment-failed',
        event_time: new Date(baseTime + 5000).toISOString(),
        source_system: 'payment-gateway',
        customer_id: customerId,
        delay_ms: 5000,
        metadata: { order_id: 'ord-demo-001', payment_id: 'pay-demo-001', failure_code: 'CARD_DECLINED', amount: 2499.99, attempt_number: 1 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'payment-failed',
        event_time: new Date(baseTime + 9000).toISOString(),
        source_system: 'payment-gateway',
        customer_id: customerId,
        delay_ms: 9000,
        metadata: { order_id: 'ord-demo-001', payment_id: 'pay-demo-002', failure_code: 'FRAUD_SUSPECTED', amount: 2499.99, attempt_number: 2 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'risk-signal-generated',
        event_time: new Date(baseTime + 11000).toISOString(),
        source_system: 'cto-processor',
        customer_id: customerId,
        delay_ms: 11000,
        metadata: { risk_score: 30, contributing_signals: ['2 payment failures in 10 minutes'] },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'shipment-delayed',
        event_time: new Date(baseTime + 14000).toISOString(),
        source_system: 'logistics-service',
        customer_id: customerId,
        delay_ms: 14000,
        metadata: { order_id: 'ord-demo-001', shipment_id: 'shp-demo-001', delay_hours: 48, reason: 'warehouse_delay', carrier: 'FedEx' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'risk-signal-generated',
        event_time: new Date(baseTime + 16000).toISOString(),
        source_system: 'cto-processor',
        customer_id: customerId,
        delay_ms: 16000,
        metadata: { risk_score: 50, contributing_signals: ['2 payment failures in 10 minutes', 'shipment delayed for premium order'] },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'support-ticket-updated',
        event_time: new Date(baseTime + 19000).toISOString(),
        source_system: 'zendesk',
        customer_id: customerId,
        delay_ms: 19000,
        metadata: { ticket_id: 'tkt-demo-001', sentiment: 'negative', sentiment_score: -0.85, category: 'billing', channel: 'chat' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'risk-signal-generated',
        event_time: new Date(baseTime + 21000).toISOString(),
        source_system: 'cto-processor',
        customer_id: customerId,
        delay_ms: 21000,
        metadata: { risk_score: 75, contributing_signals: ['2 payment failures in 10 minutes', 'shipment delayed for premium order', '1 negative support event(s) in 24h'] },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'ai-recommendation-created',
        event_time: new Date(baseTime + 24000).toISOString(),
        source_system: 'cto-ai',
        customer_id: customerId,
        delay_ms: 24000,
        metadata: {
          risk_score: 75,
          action: 'ESCALATE_FRAUD_REVIEW',
          reason: ['2 failed payments in 10 minutes', 'Premium order value $2,499.99 above threshold', 'Shipment delay created churn risk', 'Negative support sentiment detected'],
          priority: 'HIGH',
          confidence: 0.86,
        },
      },
    ],
  };
}

function buildVipRetentionScenario(): DemoScenario {
  const customerId = 'c-1001';
  const baseTime = Date.now();

  return {
    id: 'vip-retention',
    name: 'VIP Retention Alert',
    description: 'VIP customer experiencing shipment delays and negative support interactions, triggering retention protocol.',
    customer_id: customerId,
    duration_seconds: 45,
    events: [
      {
        event_id: crypto.randomUUID(),
        event_type: 'customer-profile-updated',
        event_time: new Date(baseTime).toISOString(),
        source_system: 'crm',
        customer_id: customerId,
        delay_ms: 0,
        metadata: { tier: 'vip', lifetime_value: 15000, region: 'US-WEST', account_age_days: 730 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'order-created',
        event_time: new Date(baseTime + 2000).toISOString(),
        source_system: 'order-service',
        customer_id: customerId,
        delay_ms: 2000,
        metadata: { order_id: 'ord-demo-vip-001', total_amount: 3500.00, currency: 'USD', item_count: 5, is_premium: true },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'shipment-delayed',
        event_time: new Date(baseTime + 6000).toISOString(),
        source_system: 'logistics-service',
        customer_id: customerId,
        delay_ms: 6000,
        metadata: { order_id: 'ord-demo-vip-001', shipment_id: 'shp-demo-vip-001', delay_hours: 72, reason: 'warehouse_delay', carrier: 'UPS' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'risk-signal-generated',
        event_time: new Date(baseTime + 8000).toISOString(),
        source_system: 'cto-processor',
        customer_id: customerId,
        delay_ms: 8000,
        metadata: { risk_score: 30, contributing_signals: ['shipment delayed for premium order', 'VIP customer - retention priority'] },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'support-ticket-updated',
        event_time: new Date(baseTime + 11000).toISOString(),
        source_system: 'zendesk',
        customer_id: customerId,
        delay_ms: 11000,
        metadata: { ticket_id: 'tkt-demo-vip-001', sentiment: 'negative', sentiment_score: -0.92, category: 'shipping', channel: 'phone' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'risk-signal-generated',
        event_time: new Date(baseTime + 13000).toISOString(),
        source_system: 'cto-processor',
        customer_id: customerId,
        delay_ms: 13000,
        metadata: { risk_score: 65, contributing_signals: ['shipment delayed for premium order', 'VIP customer - retention priority', '1 negative support event(s) in 24h'] },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'ai-recommendation-created',
        event_time: new Date(baseTime + 16000).toISOString(),
        source_system: 'cto-ai',
        customer_id: customerId,
        delay_ms: 16000,
        metadata: {
          risk_score: 65,
          action: 'VIP_RETENTION',
          reason: ['VIP customer with $15,000 lifetime value at risk', 'Premium shipment delayed 72 hours', 'Negative phone support interaction', 'Proactive retention recommended'],
          priority: 'HIGH',
          confidence: 0.91,
        },
      },
    ],
  };
}

function buildFleetDelayScenario(): DemoScenario {
  const vehicleId = 'V-1001';
  const baseTime = Date.now();

  return {
    id: 'fleet-delay-escalation',
    name: 'Fleet Delay Escalation',
    description: 'Vehicle experiencing progressive ETA drift with traffic anomalies, triggering rerouting and customer notification.',
    customer_id: vehicleId,
    duration_seconds: 50,
    events: [
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-telemetry',
        event_time: new Date(baseTime).toISOString(),
        source_system: 'vehicle-telematics',
        customer_id: vehicleId,
        delay_ms: 0,
        metadata: { vehicle_id: vehicleId, speed_kmh: 85, fuel_pct: 75, engine_temp_c: 92, lat: 37.7749, lng: -122.4194 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-route-event',
        event_time: new Date(baseTime + 3000).toISOString(),
        source_system: 'route-optimizer',
        customer_id: vehicleId,
        delay_ms: 3000,
        metadata: { vehicle_id: vehicleId, route_id: 'R-001', eta_minutes: 45, eta_drift_minutes: 0, destination: 'San Francisco Warehouse' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-route-event',
        event_time: new Date(baseTime + 8000).toISOString(),
        source_system: 'route-optimizer',
        customer_id: vehicleId,
        delay_ms: 8000,
        metadata: { vehicle_id: vehicleId, route_id: 'R-001', eta_minutes: 50, eta_drift_minutes: 5, destination: 'San Francisco Warehouse', reason: 'traffic_congestion' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-telemetry',
        event_time: new Date(baseTime + 12000).toISOString(),
        source_system: 'vehicle-telematics',
        customer_id: vehicleId,
        delay_ms: 12000,
        metadata: { vehicle_id: vehicleId, speed_kmh: 35, fuel_pct: 72, engine_temp_c: 95, lat: 37.7849, lng: -122.4094 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-route-event',
        event_time: new Date(baseTime + 16000).toISOString(),
        source_system: 'route-optimizer',
        customer_id: vehicleId,
        delay_ms: 16000,
        metadata: { vehicle_id: vehicleId, route_id: 'R-001', eta_minutes: 60, eta_drift_minutes: 15, destination: 'San Francisco Warehouse', reason: 'severe_traffic' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-agent-decision',
        event_time: new Date(baseTime + 19000).toISOString(),
        source_system: 'delay-agent',
        customer_id: vehicleId,
        delay_ms: 19000,
        metadata: { agent_type: 'delay_agent', vehicle_id: vehicleId, severity: 'high', recommended_action: 'REROUTE_VEHICLE', reason: 'ETA drift exceeded 15 minutes threshold', confidence: 0.88 },
      },
    ],
  };
}

function buildFleetColdchainScenario(): DemoScenario {
  const vehicleId = 'V-2003';
  const baseTime = Date.now();

  return {
    id: 'fleet-coldchain-breach',
    name: 'Cold Chain Breach',
    description: 'Refrigerated vehicle experiencing temperature deviation and door-open events, triggering priority handling protocol.',
    customer_id: vehicleId,
    duration_seconds: 45,
    events: [
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-telemetry',
        event_time: new Date(baseTime).toISOString(),
        source_system: 'vehicle-telematics',
        customer_id: vehicleId,
        delay_ms: 0,
        metadata: { vehicle_id: vehicleId, speed_kmh: 70, fuel_pct: 80, engine_temp_c: 88, vehicle_type: 'reefer' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-coldchain',
        event_time: new Date(baseTime + 3000).toISOString(),
        source_system: 'coldchain-monitor',
        customer_id: vehicleId,
        delay_ms: 3000,
        metadata: { vehicle_id: vehicleId, compartment_temp_c: -18.0, target_temp_c: -18.0, deviation_c: 0.0, door_status: 'closed' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-coldchain',
        event_time: new Date(baseTime + 8000).toISOString(),
        source_system: 'coldchain-monitor',
        customer_id: vehicleId,
        delay_ms: 8000,
        metadata: { vehicle_id: vehicleId, compartment_temp_c: -15.5, target_temp_c: -18.0, deviation_c: 2.5, door_status: 'closed', alert: 'temperature_warning' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-coldchain',
        event_time: new Date(baseTime + 13000).toISOString(),
        source_system: 'coldchain-monitor',
        customer_id: vehicleId,
        delay_ms: 13000,
        metadata: { vehicle_id: vehicleId, compartment_temp_c: -12.0, target_temp_c: -18.0, deviation_c: 6.0, door_status: 'open', alert: 'critical_breach', duration_seconds: 120 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-agent-decision',
        event_time: new Date(baseTime + 16000).toISOString(),
        source_system: 'coldchain-agent',
        customer_id: vehicleId,
        delay_ms: 16000,
        metadata: { agent_type: 'coldchain_agent', vehicle_id: vehicleId, severity: 'critical', recommended_action: 'PRIORITY_HANDLING', reason: 'Cold chain breach: 6°C deviation, door open for 2 minutes', confidence: 0.94 },
      },
    ],
  };
}

function buildFleetSafetyScenario(): DemoScenario {
  const vehicleId = 'V-3005';
  const baseTime = Date.now();

  return {
    id: 'fleet-safety-violation',
    name: 'Safety Violation',
    description: 'Driver exhibiting harsh braking and overspeed events, triggering coaching recommendation.',
    customer_id: vehicleId,
    duration_seconds: 40,
    events: [
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-driver-event',
        event_time: new Date(baseTime).toISOString(),
        source_system: 'driver-monitor',
        customer_id: vehicleId,
        delay_ms: 0,
        metadata: { vehicle_id: vehicleId, driver_id: 'D-305', event_type: 'shift_start', safety_score: 92 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-telemetry',
        event_time: new Date(baseTime + 4000).toISOString(),
        source_system: 'vehicle-telematics',
        customer_id: vehicleId,
        delay_ms: 4000,
        metadata: { vehicle_id: vehicleId, speed_kmh: 120, fuel_pct: 65, engine_temp_c: 98, alert: 'overspeed' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-driver-event',
        event_time: new Date(baseTime + 9000).toISOString(),
        source_system: 'driver-monitor',
        customer_id: vehicleId,
        delay_ms: 9000,
        metadata: { vehicle_id: vehicleId, driver_id: 'D-305', event_type: 'harsh_braking', g_force: 0.65, safety_score: 85 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-driver-event',
        event_time: new Date(baseTime + 14000).toISOString(),
        source_system: 'driver-monitor',
        customer_id: vehicleId,
        delay_ms: 14000,
        metadata: { vehicle_id: vehicleId, driver_id: 'D-305', event_type: 'harsh_braking', g_force: 0.72, safety_score: 78 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-agent-decision',
        event_time: new Date(baseTime + 17000).toISOString(),
        source_system: 'safety-agent',
        customer_id: vehicleId,
        delay_ms: 17000,
        metadata: { agent_type: 'safety_agent', vehicle_id: vehicleId, severity: 'high', recommended_action: 'DRIVER_COACHING', reason: 'Multiple safety violations: overspeed + 2 harsh braking events, safety score dropped to 78', confidence: 0.91 },
      },
    ],
  };
}

function buildFleetMaintenanceScenario(): DemoScenario {
  const vehicleId = 'V-4007';
  const baseTime = Date.now();

  return {
    id: 'fleet-maintenance-alert',
    name: 'Maintenance Alert',
    description: 'Vehicle showing elevated engine temperature and fault codes, triggering service scheduling.',
    customer_id: vehicleId,
    duration_seconds: 35,
    events: [
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-telemetry',
        event_time: new Date(baseTime).toISOString(),
        source_system: 'vehicle-telematics',
        customer_id: vehicleId,
        delay_ms: 0,
        metadata: { vehicle_id: vehicleId, speed_kmh: 75, fuel_pct: 55, engine_temp_c: 102 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-maintenance',
        event_time: new Date(baseTime + 5000).toISOString(),
        source_system: 'maintenance-monitor',
        customer_id: vehicleId,
        delay_ms: 5000,
        metadata: { vehicle_id: vehicleId, fault_code: 'P0128', description: 'Coolant thermostat issue', severity: 'medium', maintenance_risk: 45 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-telemetry',
        event_time: new Date(baseTime + 10000).toISOString(),
        source_system: 'vehicle-telematics',
        customer_id: vehicleId,
        delay_ms: 10000,
        metadata: { vehicle_id: vehicleId, speed_kmh: 70, fuel_pct: 52, engine_temp_c: 108, alert: 'engine_temp_warning' },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-maintenance',
        event_time: new Date(baseTime + 14000).toISOString(),
        source_system: 'maintenance-monitor',
        customer_id: vehicleId,
        delay_ms: 14000,
        metadata: { vehicle_id: vehicleId, fault_code: 'P0217', description: 'Engine overheating', severity: 'high', maintenance_risk: 75 },
      },
      {
        event_id: crypto.randomUUID(),
        event_type: 'fleet-agent-decision',
        event_time: new Date(baseTime + 17000).toISOString(),
        source_system: 'maintenance-agent',
        customer_id: vehicleId,
        delay_ms: 17000,
        metadata: { agent_type: 'maintenance_agent', vehicle_id: vehicleId, severity: 'critical', recommended_action: 'SCHEDULE_SERVICE', reason: 'Engine overheating detected, maintenance risk at 75%, immediate service required', confidence: 0.89 },
      },
    ],
  };
}

const SCENARIOS = new Map<string, () => DemoScenario>([
  ['fraud-escalation', buildFraudScenario],
  ['vip-retention', buildVipRetentionScenario],
  ['fleet-delay-escalation', buildFleetDelayScenario],
  ['fleet-coldchain-breach', buildFleetColdchainScenario],
  ['fleet-safety-violation', buildFleetSafetyScenario],
  ['fleet-maintenance-alert', buildFleetMaintenanceScenario],
]);

const activeReplays = new Map<string, { abort: AbortController }>();

export async function replayRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/replay/scenarios', async () => {
    return Array.from(SCENARIOS.entries()).map(([id, builder]) => {
      const scenario = builder();
      return {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        customer_id: scenario.customer_id,
        duration_seconds: scenario.duration_seconds,
        event_count: scenario.events.length,
      };
    });
  });

  app.get<{ Params: { id: string } }>('/api/replay/scenarios/:id', async (request, reply) => {
    const builder = SCENARIOS.get(request.params.id);
    if (!builder) return reply.status(404).send({ error: 'Scenario not found' });
    return builder();
  });

  app.get<{ Params: { id: string }; Querystring: { speed?: string } }>(
    '/api/replay/stream/:id',
    async (request, reply) => {
      const builder = SCENARIOS.get(request.params.id);
      if (!builder) return reply.status(404).send({ error: 'Scenario not found' });

      const speed = parseFloat(request.query.speed || '1');
      const scenario = builder();
      const replayId = crypto.randomUUID();
      const abortController = new AbortController();
      activeReplays.set(replayId, { abort: abortController });

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Replay-Id': replayId,
      });

      reply.raw.write(`event: replay-start\ndata: ${JSON.stringify({ replayId, scenario: scenario.id, speed, totalEvents: scenario.events.length })}\n\n`);

      const signal = abortController.signal;

      (async () => {
        for (let i = 0; i < scenario.events.length; i++) {
          if (signal.aborted) break;

          const event = scenario.events[i];
          const delay = i === 0 ? 500 : (event.delay_ms - scenario.events[i - 1].delay_ms) / speed;

          await new Promise<void>((resolve) => {
            const timeout = setTimeout(resolve, Math.max(delay, 100));
            signal.addEventListener('abort', () => { clearTimeout(timeout); resolve(); }, { once: true });
          });

          if (signal.aborted) break;

          reply.raw.write(`event: replay-event\ndata: ${JSON.stringify({
            index: i,
            total: scenario.events.length,
            progress: ((i + 1) / scenario.events.length) * 100,
            event,
          })}\n\n`);
        }

        if (!signal.aborted) {
          reply.raw.write(`event: replay-complete\ndata: ${JSON.stringify({ replayId, scenario: scenario.id })}\n\n`);
        }

        reply.raw.end();
        activeReplays.delete(replayId);
      })();

      request.raw.on('close', () => {
        abortController.abort();
        activeReplays.delete(replayId);
      });
    },
  );

  app.post<{ Params: { id: string } }>('/api/replay/stop/:id', async (request, reply) => {
    const replay = activeReplays.get(request.params.id);
    if (!replay) return reply.status(404).send({ error: 'Replay not found' });
    replay.abort.abort();
    activeReplays.delete(request.params.id);
    return { status: 'stopped' };
  });
}
