import crypto from 'node:crypto';
import { ShipmentDelayed, TOPICS } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

const CARRIERS = ['FedEx', 'UPS', 'USPS', 'DHL'];
const DELAY_REASONS = ['weather', 'customs', 'carrier_backlog', 'address_issue', 'warehouse_delay'];

export function generateShipmentDelay(overrides?: Partial<ShipmentDelayed>): ShipmentDelayed {
  const delayHours = Math.floor(Math.random() * 70) + 2;
  const now = new Date();
  const originalEta = new Date(now.getTime() - delayHours * 3600000);
  const revisedEta = new Date(now.getTime() + delayHours * 3600000);

  return {
    event_id: crypto.randomUUID(),
    event_type: 'shipment-delayed',
    event_time: now.toISOString(),
    source_system: 'logistics-service',
    customer_id: overrides?.customer_id || 'c-1001',
    order_id: overrides?.order_id || `ord-${crypto.randomUUID().slice(0, 8)}`,
    shipment_id: `shp-${crypto.randomUUID().slice(0, 8)}`,
    carrier: CARRIERS[Math.floor(Math.random() * CARRIERS.length)],
    delay_hours: delayHours,
    reason: DELAY_REASONS[Math.floor(Math.random() * DELAY_REASONS.length)],
    original_eta: originalEta.toISOString(),
    revised_eta: revisedEta.toISOString(),
    ...overrides,
  };
}

export async function publishShipmentDelay(overrides?: Partial<ShipmentDelayed>): Promise<ShipmentDelayed> {
  const shipment = generateShipmentDelay(overrides);
  await publishMessage(TOPICS.RAW_SHIPMENTS, shipment.customer_id, shipment);
  console.log(`Published shipment delay ${shipment.shipment_id} (${shipment.delay_hours}h) for ${shipment.customer_id}`);
  return shipment;
}
