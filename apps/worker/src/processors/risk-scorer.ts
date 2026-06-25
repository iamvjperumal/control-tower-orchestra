import { Consumer } from 'kafkajs';
import crypto from 'node:crypto';
import {
  createKafkaClient,
  TOPICS,
  CONSUMER_GROUPS,
  RISK_WEIGHTS,
  ESCALATION_THRESHOLD,
  RiskSignalGenerated,
  OrderCreated,
  PaymentFailed,
  SupportTicketUpdated,
  ShipmentDelayed,
  CustomerProfileUpdated,
} from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

interface CustomerRiskState {
  customerId: string;
  tier: string;
  paymentFailures: { timestamp: number; code: string }[];
  shipmentDelays: { timestamp: number; orderId: string }[];
  supportEvents: { timestamp: number; sentiment: string; category: string }[];
  activeOrders: Map<string, { amount: number; isPremium: boolean }>;
}

const customerStates = new Map<string, CustomerRiskState>();

function getOrCreateState(customerId: string): CustomerRiskState {
  let state = customerStates.get(customerId);
  if (!state) {
    state = {
      customerId,
      tier: 'standard',
      paymentFailures: [],
      shipmentDelays: [],
      supportEvents: [],
      activeOrders: new Map(),
    };
    customerStates.set(customerId, state);
  }
  return state;
}

function computeRiskScore(state: CustomerRiskState): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];
  const now = Date.now();
  const tenMinAgo = now - 10 * 60 * 1000;
  const twentyFourHrAgo = now - 24 * 60 * 60 * 1000;

  const recentFailures = state.paymentFailures.filter((f) => f.timestamp > tenMinAgo);
  if (recentFailures.length >= 2) {
    score += RISK_WEIGHTS.PAYMENT_FAILURES_10M;
    signals.push(`${recentFailures.length} payment failures in 10 minutes`);
  }

  for (const delay of state.shipmentDelays) {
    const order = state.activeOrders.get(delay.orderId);
    if (order?.isPremium) {
      score += RISK_WEIGHTS.PREMIUM_SHIPMENT_DELAY;
      signals.push('shipment delayed for premium order');
      break;
    }
  }

  const recentNegative = state.supportEvents.filter(
    (s) => s.timestamp > twentyFourHrAgo && s.sentiment === 'negative',
  );
  if (recentNegative.length > 0) {
    score += RISK_WEIGHTS.NEGATIVE_SUPPORT_24H;
    signals.push(`${recentNegative.length} negative support event(s) in 24h`);
  }

  const hasRefundRequest = state.supportEvents.some(
    (s) => s.timestamp > twentyFourHrAgo && s.category === 'refund',
  );
  if (hasRefundRequest && state.shipmentDelays.length > 0) {
    score += RISK_WEIGHTS.REFUND_AFTER_SHIPMENT;
    signals.push('refund request after shipment issue');
  }

  if (state.tier === 'vip') {
    score += RISK_WEIGHTS.VIP_PRIORITY;
    signals.push('VIP customer - retention priority');
  }

  return { score, signals };
}

async function processEvent(topic: string, data: Record<string, unknown>): Promise<void> {
  const customerId = data.customer_id as string;
  if (!customerId) return;

  const state = getOrCreateState(customerId);

  switch (topic) {
    case TOPICS.RAW_CUSTOMERS: {
      const event = data as unknown as CustomerProfileUpdated;
      state.tier = event.tier;
      break;
    }
    case TOPICS.RAW_ORDERS: {
      const event = data as unknown as OrderCreated;
      state.activeOrders.set(event.order_id, {
        amount: event.total_amount,
        isPremium: event.is_premium,
      });
      break;
    }
    case TOPICS.RAW_PAYMENTS: {
      const event = data as unknown as PaymentFailed;
      state.paymentFailures.push({
        timestamp: new Date(event.event_time).getTime(),
        code: event.failure_code,
      });
      break;
    }
    case TOPICS.RAW_SHIPMENTS: {
      const event = data as unknown as ShipmentDelayed;
      state.shipmentDelays.push({
        timestamp: new Date(event.event_time).getTime(),
        orderId: event.order_id,
      });
      break;
    }
    case TOPICS.RAW_SUPPORT: {
      const event = data as unknown as SupportTicketUpdated;
      state.supportEvents.push({
        timestamp: new Date(event.event_time).getTime(),
        sentiment: event.sentiment,
        category: event.category,
      });
      break;
    }
  }

  const { score, signals } = computeRiskScore(state);
  if (score > 0) {
    const now = new Date();
    const riskSignal: RiskSignalGenerated = {
      event_id: crypto.randomUUID(),
      event_type: 'risk-signal-generated',
      event_time: now.toISOString(),
      source_system: 'cto-processor',
      customer_id: customerId,
      risk_score: score,
      contributing_signals: signals,
      window_start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      window_end: now.toISOString(),
      related_order_ids: Array.from(state.activeOrders.keys()),
    };
    await publishMessage(TOPICS.SIGNALS_RISK, customerId, riskSignal);
    console.log(`Risk signal: ${customerId} score=${score} signals=[${signals.join('; ')}]`);
  }
}

let consumer: Consumer;

export async function startRiskScorer(): Promise<void> {
  const kafka = createKafkaClient();
  consumer = kafka.consumer({ groupId: CONSUMER_GROUPS.WORKER_RISK });

  await consumer.connect();
  await consumer.subscribe({
    topics: [
      TOPICS.RAW_ORDERS,
      TOPICS.RAW_PAYMENTS,
      TOPICS.RAW_SUPPORT,
      TOPICS.RAW_SHIPMENTS,
      TOPICS.RAW_CUSTOMERS,
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;
      const data = JSON.parse(message.value.toString());
      await processEvent(topic, data);
    },
  });

  console.log('Risk scorer started');
}

export async function stopRiskScorer(): Promise<void> {
  if (consumer) await consumer.disconnect();
}
