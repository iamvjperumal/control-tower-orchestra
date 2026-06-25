import crypto from 'node:crypto';
import { OrderCreated, TOPICS } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

const CUSTOMER_IDS = [
  'c-1001', 'c-1002', 'c-1003', 'c-1004', 'c-1005',
  'c-1006', 'c-1007', 'c-1008', 'c-1009', 'c-1010',
];

export function generateOrder(overrides?: Partial<OrderCreated>): OrderCreated {
  const customerId = CUSTOMER_IDS[Math.floor(Math.random() * CUSTOMER_IDS.length)];
  const totalAmount = Math.round((Math.random() * 4990 + 10) * 100) / 100;
  return {
    event_id: crypto.randomUUID(),
    event_type: 'order-created',
    event_time: new Date().toISOString(),
    source_system: 'order-service',
    customer_id: customerId,
    order_id: `ord-${crypto.randomUUID().slice(0, 8)}`,
    total_amount: totalAmount,
    currency: 'USD',
    item_count: Math.floor(Math.random() * 10) + 1,
    is_premium: totalAmount > 1000,
    shipping_address_hash: crypto.createHash('sha256').update(`addr-${customerId}`).digest('hex').slice(0, 12),
    ...overrides,
  };
}

export async function publishOrder(overrides?: Partial<OrderCreated>): Promise<OrderCreated> {
  const order = generateOrder(overrides);
  await publishMessage(TOPICS.RAW_ORDERS, order.customer_id, order);
  console.log(`Published order ${order.order_id} for ${order.customer_id} ($${order.total_amount})`);
  return order;
}
