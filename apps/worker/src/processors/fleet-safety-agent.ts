import { Consumer } from 'kafkajs';
import crypto from 'node:crypto';
import { createKafkaClient, FLEET_TOPICS, FLEET_CONSUMER_GROUPS, FLEET_THRESHOLDS } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

interface SafetyState {
  vehicle_id: string;
  safety_score: number;
  harsh_braking_events: number;
  overspeed_events: number;
  fatigue_alerts: number;
  recent_events: { timestamp: number; type: string; value: number }[];
}

const vehicleStates = new Map<string, SafetyState>();
let consumer: Consumer;

function getState(vehicleId: string): SafetyState {
  let state = vehicleStates.get(vehicleId);
  if (!state) {
    state = { vehicle_id: vehicleId, safety_score: 100, harsh_braking_events: 0, overspeed_events: 0, fatigue_alerts: 0, recent_events: [] };
    vehicleStates.set(vehicleId, state);
  }
  return state;
}

function computeSafetyScore(state: SafetyState): number {
  const hourAgo = Date.now() - 3600000;
  const recent = state.recent_events.filter(e => e.timestamp > hourAgo);
  let score = 100;
  for (const evt of recent) {
    switch (evt.type) {
      case 'harsh_braking': score -= 5; break;
      case 'harsh_acceleration': score -= 3; break;
      case 'overspeed': score -= 8; break;
      case 'fatigue_alert': score -= 15; break;
    }
  }
  return Math.max(0, score);
}

async function evaluateSafety(state: SafetyState): Promise<void> {
  state.safety_score = computeSafetyScore(state);
  if (state.safety_score >= FLEET_THRESHOLDS.SAFETY_SCORE_WARNING) return;

  const severity = state.safety_score < FLEET_THRESHOLDS.SAFETY_SCORE_CRITICAL ? 'critical' : 'high';

  let action = 'LOG_AND_MONITOR';
  let confidence = 0.78;

  if (state.safety_score < 50) {
    action = 'ESCALATE_TO_DISPATCHER';
    confidence = 0.92;
  } else if (state.safety_score < 65) {
    action = 'RECOMMEND_DRIVER_COACHING';
    confidence = 0.85;
  } else {
    action = 'LOG_AND_MONITOR';
    confidence = 0.72;
  }

  const reason = `Safety score dropped to ${state.safety_score}. ` +
    `Harsh braking: ${state.harsh_braking_events}, overspeed: ${state.overspeed_events}, fatigue alerts: ${state.fatigue_alerts}. ` +
    (state.safety_score < 50 ? 'Immediate dispatcher review recommended.' : 'Driver coaching session recommended.');

  const decision = {
    decision_id: crypto.randomUUID(),
    agent_type: 'safety_agent',
    vehicle_id: state.vehicle_id,
    severity,
    reason,
    recommended_action: action,
    confidence,
    generated_at: new Date().toISOString(),
    status: 'pending',
    context: { safety_score: state.safety_score, harsh_braking_events: state.harsh_braking_events, overspeed_events: state.overspeed_events },
  };

  await publishMessage(FLEET_TOPICS.AGENT_DECISIONS, state.vehicle_id, decision);

  const audit = {
    audit_id: crypto.randomUUID(),
    agent_type: 'safety_agent',
    decision_id: decision.decision_id,
    vehicle_id: state.vehicle_id,
    model_id: 'fleet-safety-rules-v1',
    prompt_hash: crypto.createHash('sha256').update(reason).digest('hex').slice(0, 16),
    input_context_hash: crypto.createHash('sha256').update(JSON.stringify(decision.context)).digest('hex').slice(0, 16),
    confidence,
    latency_ms: 1,
    timestamp: new Date().toISOString(),
  };
  await publishMessage(FLEET_TOPICS.AUDIT_LOG, state.vehicle_id, audit);

  console.log(`[Safety Agent] ${state.vehicle_id}: ${action} (score=${state.safety_score}, conf=${confidence})`);
}

export async function startSafetyAgent(): Promise<void> {
  const kafka = createKafkaClient();
  consumer = kafka.consumer({ groupId: FLEET_CONSUMER_GROUPS.WORKER_SAFETY });

  await consumer.connect();
  await consumer.subscribe({ topics: [FLEET_TOPICS.DRIVER_EVENTS_RAW], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const data = JSON.parse(message.value.toString());
      const vehicleId = data.vehicle_id;
      if (!vehicleId) return;

      const state = getState(vehicleId);
      const eventType = data.event_type;
      state.recent_events.push({ timestamp: Date.now(), type: eventType, value: data.deceleration_g || data.speed_kmh || 0 });
      if (state.recent_events.length > 50) state.recent_events.shift();

      if (eventType === 'harsh_braking') state.harsh_braking_events++;
      if (eventType === 'overspeed') state.overspeed_events++;
      if (eventType === 'fatigue_alert') state.fatigue_alerts++;

      await evaluateSafety(state);
    },
  });

  console.log('Fleet Safety Agent started');
}

export async function stopSafetyAgent(): Promise<void> {
  if (consumer) await consumer.disconnect();
}
