import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const AVRO_DIR = resolve(__dirname, '..', 'avro');

function loadSchema(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(AVRO_DIR, `${name}.avsc`), 'utf-8'));
}

export const schemas = {
  orderCreated: loadSchema('order-created'),
  paymentFailed: loadSchema('payment-failed'),
  supportTicketUpdated: loadSchema('support-ticket-updated'),
  shipmentDelayed: loadSchema('shipment-delayed'),
  customerProfileUpdated: loadSchema('customer-profile-updated'),
  riskSignalGenerated: loadSchema('risk-signal-generated'),
  aiRecommendationCreated: loadSchema('ai-recommendation-created'),
};

export const SCHEMA_NAMES = Object.keys(schemas);
