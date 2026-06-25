import { Consumer } from 'kafkajs';
import crypto from 'node:crypto';
import { createKafkaClient, FLEET_TOPICS, FLEET_CONSUMER_GROUPS, FLEET_THRESHOLDS } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

interface VehicleETAState {
  vehicle_id: string;
  eta_drift_minutes: number;
  deviation_score: number;
  recent_drifts: { timestamp: number; drift: number }[];
}

const vehicleStates = new Map<string, VehicleETAState>();
let consumer: Consumer;

function getState(vehicleId: string): VehicleETAState {
  let state = vehicleStates.get(vehicleId);
  if (!state) {
    state = { vehicle_id: vehicleId, eta_drift_minutes: 0, deviation_score: 0, recent_drifts: [] };
    vehicleStates.set(vehicleId, state);
  }
  return state;
}

async function evaluateDelay(state: VehicleETAState): Promise<void> {
  if (state.eta_drift_minutes < FLEET_THRESHOLDS.ETA_DRIFT_WARNING_MINUTES) return;

  const severity = state.eta_drift_minutes >= FLEET_THRESHOLDS.ETA_DRIFT_CRITICAL_MINUTES ? 'critical'
    : state.eta_drift_minutes >= FLEET_THRESHOLDS.ETA_DRIFT_WARNING_MINUTES ? 'high' : 'medium';

  const worsening = state.recent_drifts.length >= 2 &&
    state.recent_drifts[state.recent_drifts.length - 1].drift > state.recent_drifts[state.recent_drifts.length - 2].drift;

  let action = 'MONITOR_ETA';
  let confidence = 0.7;

  if (state.eta_drift_minutes >= 15 && worsening) {
    action = 'REROUTE_VEHICLE';
    confidence = 0.91;
  } else if (state.eta_drift_minutes >= 10) {
    action = 'NOTIFY_CUSTOMER_DELAY';
    confidence = 0.85;
  }

  const reason = `ETA drift of ${state.eta_drift_minutes} minutes detected. ` +
    `Route deviation score: ${state.deviation_score}. ` +
    (worsening ? 'Drift is worsening — reroute recommended.' : 'Monitoring for further degradation.');

  const decision = {
    decision_id: crypto.randomUUID(),
    agent_type: 'delay_agent',
    vehicle_id: state.vehicle_id,
    severity,
    reason,
    recommended_action: action,
    confidence,
    generated_at: new Date().toISOString(),
    status: 'pending',
    context: { eta_drift_minutes: state.eta_drift_minutes, deviation_score: state.deviation_score },
  };

  await publishMessage(FLEET_TOPICS.AGENT_DECISIONS, state.vehicle_id, decision);

  const audit = {
    audit_id: crypto.randomUUID(),
    agent_type: 'delay_agent',
    decision_id: decision.decision_id,
    vehicle_id: state.vehicle_id,
    model_id: 'fleet-delay-rules-v1',
    prompt_hash: crypto.createHash('sha256').update(reason).digest('hex').slice(0, 16),
    input_context_hash: crypto.createHash('sha256').update(JSON.stringify(decision.context)).digest('hex').slice(0, 16),
    confidence,
    latency_ms: 2,
    timestamp: new Date().toISOString(),
  };
  await publishMessage(FLEET_TOPICS.AUDIT_LOG, state.vehicle_id, audit);

  console.log(`[Delay Agent] ${state.vehicle_id}: ${action} (drift=${state.eta_drift_minutes}m, conf=${confidence})`);
}

export async function startDelayAgent(): Promise<void> {
  const kafka = createKafkaClient();
  consumer = kafka.consumer({ groupId: FLEET_CONSUMER_GROUPS.WORKER_DELAY });

  await consumer.connect();
  await consumer.subscribe({ topics: [FLEET_TOPICS.ROUTE_EVENTS_RAW, FLEET_TOPICS.TELEMETRY_RAW], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;
      const data = JSON.parse(message.value.toString());
      const vehicleId = data.vehicle_id;
      if (!vehicleId) return;

      const state = getState(vehicleId);

      if (topic === FLEET_TOPICS.ROUTE_EVENTS_RAW) {
        state.eta_drift_minutes = data.eta_drift_minutes || 0;
        state.deviation_score = data.deviation_score || 0;
        state.recent_drifts.push({ timestamp: Date.now(), drift: state.eta_drift_minutes });
        if (state.recent_drifts.length > 10) state.recent_drifts.shift();
        await evaluateDelay(state);
      }
    },
  });

  console.log('Fleet Delay Agent started');
}

export async function stopDelayAgent(): Promise<void> {
  if (consumer) await consumer.disconnect();
}
