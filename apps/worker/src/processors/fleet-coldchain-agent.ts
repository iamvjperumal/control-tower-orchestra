import { Consumer } from 'kafkajs';
import crypto from 'node:crypto';
import { createKafkaClient, FLEET_TOPICS, FLEET_CONSUMER_GROUPS, FLEET_THRESHOLDS } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

interface ColdChainState {
  vehicle_id: string;
  current_temp_c: number;
  target_temp_c: number;
  deviation_c: number;
  breach_count: number;
  door_open_count: number;
  readings: { timestamp: number; temp: number; deviation: number }[];
}

const vehicleStates = new Map<string, ColdChainState>();
let consumer: Consumer;

function getState(vehicleId: string): ColdChainState {
  let state = vehicleStates.get(vehicleId);
  if (!state) {
    state = { vehicle_id: vehicleId, current_temp_c: 0, target_temp_c: 0, deviation_c: 0, breach_count: 0, door_open_count: 0, readings: [] };
    vehicleStates.set(vehicleId, state);
  }
  return state;
}

async function evaluateColdChain(state: ColdChainState): Promise<void> {
  if (state.deviation_c < FLEET_THRESHOLDS.COLDCHAIN_DEVIATION_WARNING_C) return;

  const severity = state.deviation_c >= FLEET_THRESHOLDS.COLDCHAIN_DEVIATION_CRITICAL_C ? 'critical'
    : state.deviation_c >= FLEET_THRESHOLDS.COLDCHAIN_DEVIATION_WARNING_C ? 'high' : 'medium';

  const trendWorsening = state.readings.length >= 3 &&
    state.readings.slice(-3).every((r, i, arr) => i === 0 || r.deviation >= arr[i - 1].deviation);

  let action = 'MONITOR_COLD_CHAIN';
  let confidence = 0.75;

  if (state.deviation_c >= 5.0 || trendWorsening) {
    action = 'PRIORITY_DROP_NEAREST_COLD_STORAGE';
    confidence = 0.94;
  } else if (state.deviation_c >= 3.0) {
    action = 'ALERT_DRIVER_CHECK_UNIT';
    confidence = 0.85;
  } else {
    action = 'LOG_AND_MONITOR';
    confidence = 0.72;
  }

  const reason = `Temperature breach: ${state.current_temp_c}°C vs ${state.target_temp_c}°C target ` +
    `(${state.deviation_c.toFixed(1)}° deviation). ` +
    `${state.breach_count} breach readings. ` +
    (trendWorsening ? 'Temperature trend worsening — spoilage risk rising.' : 'Stable deviation — monitoring.');

  const decision = {
    decision_id: crypto.randomUUID(),
    agent_type: 'coldchain_agent',
    vehicle_id: state.vehicle_id,
    severity,
    reason,
    recommended_action: action,
    confidence,
    generated_at: new Date().toISOString(),
    status: 'pending',
    context: { current_temp_c: state.current_temp_c, target_temp_c: state.target_temp_c, deviation_c: state.deviation_c, breach_count: state.breach_count },
  };

  await publishMessage(FLEET_TOPICS.AGENT_DECISIONS, state.vehicle_id, decision);

  const audit = {
    audit_id: crypto.randomUUID(),
    agent_type: 'coldchain_agent',
    decision_id: decision.decision_id,
    vehicle_id: state.vehicle_id,
    model_id: 'fleet-coldchain-rules-v1',
    prompt_hash: crypto.createHash('sha256').update(reason).digest('hex').slice(0, 16),
    input_context_hash: crypto.createHash('sha256').update(JSON.stringify(decision.context)).digest('hex').slice(0, 16),
    confidence,
    latency_ms: 2,
    timestamp: new Date().toISOString(),
  };
  await publishMessage(FLEET_TOPICS.AUDIT_LOG, state.vehicle_id, audit);

  console.log(`[ColdChain Agent] ${state.vehicle_id}: ${action} (dev=${state.deviation_c.toFixed(1)}°C, conf=${confidence})`);
}

export async function startColdChainAgent(): Promise<void> {
  const kafka = createKafkaClient();
  consumer = kafka.consumer({ groupId: FLEET_CONSUMER_GROUPS.WORKER_COLDCHAIN });

  await consumer.connect();
  await consumer.subscribe({ topics: [FLEET_TOPICS.COLDCHAIN_RAW], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const data = JSON.parse(message.value.toString());
      const vehicleId = data.vehicle_id;
      if (!vehicleId) return;

      const state = getState(vehicleId);
      state.current_temp_c = data.current_temp_c;
      state.target_temp_c = data.target_temp_c;
      state.deviation_c = Math.abs(data.current_temp_c - data.target_temp_c);
      if (state.deviation_c >= FLEET_THRESHOLDS.COLDCHAIN_DEVIATION_WARNING_C) state.breach_count++;
      if (data.door_open) state.door_open_count++;
      state.readings.push({ timestamp: Date.now(), temp: data.current_temp_c, deviation: state.deviation_c });
      if (state.readings.length > 20) state.readings.shift();

      await evaluateColdChain(state);
    },
  });

  console.log('Fleet ColdChain Agent started');
}

export async function stopColdChainAgent(): Promise<void> {
  if (consumer) await consumer.disconnect();
}
