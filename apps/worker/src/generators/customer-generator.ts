import crypto from 'node:crypto';
import { CustomerProfileUpdated, TOPICS } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

const SEED_CUSTOMERS: Partial<CustomerProfileUpdated>[] = [
  { customer_id: 'c-1001', tier: 'vip', lifetime_value: 15000, account_age_days: 730, region: 'US-WEST' },
  { customer_id: 'c-1002', tier: 'premium', lifetime_value: 8500, account_age_days: 365, region: 'US-EAST' },
  { customer_id: 'c-1003', tier: 'standard', lifetime_value: 450, account_age_days: 30, region: 'EU-WEST' },
  { customer_id: 'c-1004', tier: 'vip', lifetime_value: 22000, account_age_days: 1095, region: 'US-WEST' },
  { customer_id: 'c-1005', tier: 'premium', lifetime_value: 5200, account_age_days: 180, region: 'APAC' },
  { customer_id: 'c-1006', tier: 'standard', lifetime_value: 120, account_age_days: 14, region: 'US-EAST' },
  { customer_id: 'c-1007', tier: 'premium', lifetime_value: 9800, account_age_days: 540, region: 'EU-WEST' },
  { customer_id: 'c-1008', tier: 'standard', lifetime_value: 780, account_age_days: 90, region: 'US-WEST' },
  { customer_id: 'c-1009', tier: 'vip', lifetime_value: 31000, account_age_days: 1460, region: 'APAC' },
  { customer_id: 'c-1010', tier: 'standard', lifetime_value: 250, account_age_days: 45, region: 'EU-WEST' },
];

export function generateCustomerProfile(overrides?: Partial<CustomerProfileUpdated>): CustomerProfileUpdated {
  const customerId = overrides?.customer_id || 'c-1001';
  return {
    event_id: crypto.randomUUID(),
    event_type: 'customer-profile-updated',
    event_time: new Date().toISOString(),
    source_system: 'crm',
    customer_id: customerId,
    tier: 'standard',
    lifetime_value: 0,
    account_age_days: 0,
    region: 'US-WEST',
    email_hash: crypto.createHash('sha256').update(`email-${customerId}`).digest('hex').slice(0, 12),
    ...overrides,
  };
}

export async function seedCustomers(): Promise<void> {
  for (const customer of SEED_CUSTOMERS) {
    const profile = generateCustomerProfile(customer);
    await publishMessage(TOPICS.RAW_CUSTOMERS, profile.customer_id, profile);
  }
  console.log(`Seeded ${SEED_CUSTOMERS.length} customer profiles`);
}
