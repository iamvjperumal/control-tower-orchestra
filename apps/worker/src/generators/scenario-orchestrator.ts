import { publishOrder } from './order-generator.js';
import { publishPaymentFailure } from './payment-generator.js';
import { publishShipmentDelay } from './shipment-generator.js';
import { publishSupportTicket } from './support-generator.js';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runFraudScenario(customerId = 'c-1003'): Promise<void> {
  console.log(`--- SCENARIO: Fraud Risk Escalation for ${customerId} ---`);
  const order = await publishOrder({
    customer_id: customerId,
    total_amount: 2499.99,
    is_premium: true,
  });

  await delay(2000);
  await publishPaymentFailure({
    customer_id: customerId,
    order_id: order.order_id,
    failure_code: 'CARD_DECLINED',
    amount: 2499.99,
    attempt_number: 1,
  });

  await delay(3000);
  await publishPaymentFailure({
    customer_id: customerId,
    order_id: order.order_id,
    failure_code: 'FRAUD_SUSPECTED',
    amount: 2499.99,
    attempt_number: 2,
  });

  await delay(2000);
  await publishShipmentDelay({
    customer_id: customerId,
    order_id: order.order_id,
    delay_hours: 48,
  });

  await delay(1500);
  await publishSupportTicket({
    customer_id: customerId,
    sentiment: 'negative',
    sentiment_score: -0.85,
    category: 'billing',
  });

  console.log(`--- Fraud scenario complete for ${customerId} ---`);
}

export async function runVipRetentionScenario(customerId = 'c-1001'): Promise<void> {
  console.log(`--- SCENARIO: VIP Retention for ${customerId} ---`);
  const order = await publishOrder({
    customer_id: customerId,
    total_amount: 3500.00,
    is_premium: true,
  });

  await delay(2000);
  await publishShipmentDelay({
    customer_id: customerId,
    order_id: order.order_id,
    delay_hours: 72,
    reason: 'warehouse_delay',
  });

  await delay(2000);
  await publishSupportTicket({
    customer_id: customerId,
    sentiment: 'negative',
    sentiment_score: -0.92,
    category: 'shipping',
    channel: 'phone',
  });

  console.log(`--- VIP retention scenario complete for ${customerId} ---`);
}

export async function runRefundScenario(customerId = 'c-1002'): Promise<void> {
  console.log(`--- SCENARIO: Refund Approval for ${customerId} ---`);
  const order = await publishOrder({
    customer_id: customerId,
    total_amount: 899.99,
    is_premium: false,
  });

  await delay(2000);
  await publishShipmentDelay({
    customer_id: customerId,
    order_id: order.order_id,
    delay_hours: 24,
    reason: 'carrier_backlog',
  });

  await delay(2000);
  await publishSupportTicket({
    customer_id: customerId,
    sentiment: 'negative',
    sentiment_score: -0.7,
    category: 'refund',
  });

  console.log(`--- Refund scenario complete for ${customerId} ---`);
}

export async function runRandomBackground(): Promise<void> {
  await publishOrder();
  if (Math.random() < 0.2) await publishPaymentFailure();
  if (Math.random() < 0.15) await publishSupportTicket();
  if (Math.random() < 0.1) await publishShipmentDelay();
}
