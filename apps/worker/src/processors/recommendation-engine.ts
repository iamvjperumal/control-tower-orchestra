import { Consumer } from 'kafkajs';
import crypto from 'node:crypto';
import {
  createKafkaClient,
  TOPICS,
  CONSUMER_GROUPS,
  ESCALATION_THRESHOLD,
  RiskSignalGenerated,
  AIRecommendationCreated,
  RecommendedAction,
  Priority,
} from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';
import { generateExplanation } from '../services/watsonx-client.js';
import { config } from '../config.js';

function determineAction(signal: RiskSignalGenerated): RecommendedAction {
  const signals = signal.contributing_signals.join(' ').toLowerCase();
  if (signals.includes('fraud') || signals.includes('payment failure')) {
    return 'ESCALATE_FRAUD_REVIEW';
  }
  if (signals.includes('vip') && signals.includes('negative')) {
    return 'VIP_RETENTION';
  }
  if (signals.includes('refund')) {
    return 'REFUND_APPROVE';
  }
  if (signal.risk_score > ESCALATION_THRESHOLD) {
    return 'ESCALATE_FRAUD_REVIEW';
  }
  return 'MONITOR';
}

function determinePriority(score: number): Priority {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

async function processRiskSignal(signal: RiskSignalGenerated): Promise<void> {
  const action = determineAction(signal);
  const priority = determinePriority(signal.risk_score);

  const explanation = await generateExplanation({
    customerId: signal.customer_id,
    riskScore: signal.risk_score,
    contributingSignals: signal.contributing_signals,
    customerTier: 'unknown',
    determinedAction: action,
  });

  const recommendation: AIRecommendationCreated = {
    event_id: crypto.randomUUID(),
    event_type: 'ai-recommendation-created',
    event_time: new Date().toISOString(),
    source_system: 'cto-ai',
    customer_id: signal.customer_id,
    risk_score: signal.risk_score,
    action,
    reason: explanation.reason,
    priority,
    confidence: explanation.confidence,
    model_id: config.watsonxModelId,
    prompt_hash: explanation.promptHash,
    latency_ms: explanation.latencyMs,
  };

  await publishMessage(TOPICS.DECISIONS_RECOMMENDATIONS, signal.customer_id, recommendation);

  await publishMessage(TOPICS.AUDIT_INFERENCE, signal.customer_id, {
    event_id: crypto.randomUUID(),
    event_time: new Date().toISOString(),
    recommendation_id: recommendation.event_id,
    model_id: recommendation.model_id,
    prompt_hash: recommendation.prompt_hash,
    latency_ms: recommendation.latency_ms,
    risk_score: signal.risk_score,
    action: recommendation.action,
  });

  console.log(`Recommendation: ${signal.customer_id} -> ${action} (${priority}, confidence=${explanation.confidence})`);
}

let consumer: Consumer;

export async function startRecommendationEngine(): Promise<void> {
  const kafka = createKafkaClient();
  consumer = kafka.consumer({ groupId: CONSUMER_GROUPS.WORKER_RECOMMEND });

  await consumer.connect();
  await consumer.subscribe({ topics: [TOPICS.SIGNALS_RISK], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const signal = JSON.parse(message.value.toString()) as RiskSignalGenerated;
      if (signal.risk_score >= ESCALATION_THRESHOLD) {
        await processRiskSignal(signal);
      }
    },
  });

  console.log('Recommendation engine started');
}

export async function stopRecommendationEngine(): Promise<void> {
  if (consumer) await consumer.disconnect();
}
