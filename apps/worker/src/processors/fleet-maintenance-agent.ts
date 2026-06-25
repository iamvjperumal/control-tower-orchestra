import { Consumer } from 'kafkajs';
import crypto from 'node:crypto';
import { createKafkaClient, FLEET_TOPICS, FLEET_CONSUMER_GROUPS, FLEET_THRESHOLDS } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

interface MaintenanceState {
  vehicle_id: string;
  maintenance_risk: number;
  engine_temp_c: number;
  fault_codes: { code: string; timestamp: number }[];
  recent_signals: { timestamp: number; risk: number; temp: number }[];
}

const vehicleStates = new Map<string, MaintenanceState>();
let consumer: Consumer;

function getState(vehicleId: string): MaintenanceState {
  let state = vehicleStates.get(vehicleId);
  if (!state) {
    state = { vehicle_id: vehicleId, maintenance_risk: 0, engine_temp_c: 0, fault_codes: [], recent_signals: [] };
    vehicleStates.set(vehicleId, state);
  }
  return state;
}

async function evaluateMaintenance(state: MaintenanceState): Promise<void> {
  if (state.maintenance_risk < FLEET_THRESHOLDS.MAINTENANCE_RISK_WARNING &&
      state.engine_temp_c < FLEET_THRESHOLDS.ENGINE_TEMP_WARNING_C) return;

  const severity = (state.maintenance_risk >= FLEET_THRESHOLDS.MAINTENANCE_RISK_CRITICAL ||
    state.engine_temp_c >= FLEET_THRESHOLDS.ENGINE_TEMP_CRITICAL_C) ? 'critical' : 'high';

  const recentFaults = state.fault_codes.filter(f => f.timestamp > Date.now() - 48 * 3600000);
  const uniqueFaults = new Set(recentFaults.map(f => f.code));

  let action = 'SCHEDULE_ROUTINE_SERVICE';
  let confidence = 0.75;

  if (state.engine_temp_c >= FLEET_THRESHOLDS.ENGINE_TEMP_CRITICAL_C || recentFaults.length >= 3) {
    action = 'SCHEDULE_IMMEDIATE_SERVICE';
    confidence = 0.92;
  } else if (state.maintenance_risk >= FLEET_THRESHOLDS.MAINTENANCE_RISK_CRITICAL) {
    action = 'RECOMMEND_VEHICLE_SWAP';
    confidence = 0.88;
  } else if (state.maintenance_risk >= FLEET_THRESHOLDS.MAINTENANCE_RISK_WARNING) {
    action = 'SCHEDULE_NEXT_AVAILABLE_SERVICE';
    confidence = 0.80;
  }

  const faultStr = uniqueFaults.size > 0 ? ` Fault codes: ${[...uniqueFaults].join(', ')}.` : '';
  const reason = `Maintenance risk at ${state.maintenance_risk}%. Engine temp: ${state.engine_temp_c}°C.` +
    faultStr +
    (recentFaults.length >= 3 ? ` ${recentFaults.length} fault events in 48h — recurring issue pattern.` : '');

  const decision = {
    decision_id: crypto.randomUUID(),
    agent_type: 'maintenance_agent',
    vehicle_id: state.vehicle_id,
    severity,
    reason,
    recommended_action: action,
    confidence,
    generated_at: new Date().toISOString(),
    status: 'pending',
    context: { maintenance_risk: state.maintenance_risk, engine_temp_c: state.engine_temp_c, fault_count: recentFaults.length },
  };

  await publishMessage(FLEET_TOPICS.AGENT_DECISIONS, state.vehicle_id, decision);

  const audit = {
    audit_id: crypto.randomUUID(),
    agent_type: 'maintenance_agent',
    decision_id: decision.decision_id,
    vehicle_id: state.vehicle_id,
    model_id: 'fleet-maintenance-rules-v1',
    prompt_hash: crypto.createHash('sha256').update(reason).digest('hex').slice(0, 16),
    input_context_hash: crypto.createHash('sha256').update(JSON.stringify(decision.context)).digest('hex').slice(0, 16),
    confidence,
    latency_ms: 1,
    timestamp: new Date().toISOString(),
  };
  await publishMessage(FLEET_TOPICS.AUDIT_LOG, state.vehicle_id, audit);

  console.log(`[Maintenance Agent] ${state.vehicle_id}: ${action} (risk=${state.maintenance_risk}%, temp=${state.engine_temp_c}°C)`);
}

export async function startMaintenanceAgent(): Promise<void> {
  const kafka = createKafkaClient();
  consumer = kafka.consumer({ groupId: FLEET_CONSUMER_GROUPS.WORKER_MAINTENANCE });

  await consumer.connect();
  await consumer.subscribe({ topics: [FLEET_TOPICS.MAINTENANCE_RAW, FLEET_TOPICS.TELEMETRY_RAW], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;
      const data = JSON.parse(message.value.toString());
      const vehicleId = data.vehicle_id;
      if (!vehicleId) return;

      const state = getState(vehicleId);

      if (topic === FLEET_TOPICS.MAINTENANCE_RAW) {
        state.maintenance_risk = data.maintenance_risk_score || state.maintenance_risk;
        state.engine_temp_c = data.engine_temp_c || state.engine_temp_c;
        if (data.fault_code) {
          state.fault_codes.push({ code: data.fault_code, timestamp: Date.now() });
          if (state.fault_codes.length > 50) state.fault_codes.shift();
        }
      } else if (topic === FLEET_TOPICS.TELEMETRY_RAW) {
        state.engine_temp_c = data.engine_temp_c || state.engine_temp_c;
      }

      state.recent_signals.push({ timestamp: Date.now(), risk: state.maintenance_risk, temp: state.engine_temp_c });
      if (state.recent_signals.length > 30) state.recent_signals.shift();

      await evaluateMaintenance(state);
    },
  });

  console.log('Fleet Maintenance Agent started');
}

export async function stopMaintenanceAgent(): Promise<void> {
  if (consumer) await consumer.disconnect();
}
