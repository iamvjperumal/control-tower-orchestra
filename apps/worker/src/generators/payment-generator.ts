import crypto from 'node:crypto';
import { PaymentFailed, TOPICS } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

const FAILURE_CODES = ['INSUFFICIENT_FUNDS', 'CARD_DECLINED', 'FRAUD_SUSPECTED', 'EXPIRED_CARD', 'NETWORK_ERROR'];

export function generatePaymentFailure(overrides?: Partial<PaymentFailed>): PaymentFailed {
  return {
    event_id: crypto.randomUUID(),
    event_type: 'payment-failed',
    event_time: new Date().toISOString(),
    source_system: 'payment-gateway',
    customer_id: overrides?.customer_id || 'c-1001',
    order_id: overrides?.order_id || `ord-${crypto.randomUUID().slice(0, 8)}`,
    payment_id: `pay-${crypto.randomUUID().slice(0, 8)}`,
    failure_code: FAILURE_CODES[Math.floor(Math.random() * FAILURE_CODES.length)],
    amount: overrides?.amount || Math.round((Math.random() * 4990 + 10) * 100) / 100,
    currency: 'USD',
    attempt_number: overrides?.attempt_number || 1,
    ...overrides,
  };
}

export async function publishPaymentFailure(overrides?: Partial<PaymentFailed>): Promise<PaymentFailed> {
  const payment = generatePaymentFailure(overrides);
  await publishMessage(TOPICS.RAW_PAYMENTS, payment.customer_id, payment);
  console.log(`Published payment failure ${payment.payment_id} (${payment.failure_code}) for ${payment.customer_id}`);
  return payment;
}
