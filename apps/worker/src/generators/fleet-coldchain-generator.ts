import crypto from 'node:crypto';
import { FLEET_TOPICS, ColdChainEvent } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

const REEFER_VEHICLES = [
  { id: 'VH-2041', target: -20.0, compartment: 'COMP-A1' },
  { id: 'VH-4120', target: -20.0, compartment: 'COMP-B1' },
  { id: 'VH-7789', target: 4.0, compartment: 'COMP-C1' },
];

export function generateColdChainEvent(vehicleId?: string, overrides?: Partial<ColdChainEvent>): ColdChainEvent {
  const v = vehicleId
    ? REEFER_VEHICLES.find(x => x.id === vehicleId) || REEFER_VEHICLES[0]
    : REEFER_VEHICLES[Math.floor(Math.random() * REEFER_VEHICLES.length)];

  const normalDeviation = (Math.random() - 0.3) * 1.5;
  const currentTemp = v.target + normalDeviation;
  const deviation = Math.abs(normalDeviation);

  return {
    event_id: crypto.randomUUID(),
    event_type: deviation > 2.0 ? 'coldchain_breach' : 'coldchain_reading',
    event_time: new Date().toISOString(),
    source_system: 'fleet-coldchain-sensors',
    vehicle_id: v.id,
    compartment_id: v.compartment,
    current_temp_c: Math.round(currentTemp * 10) / 10,
    target_temp_c: v.target,
    deviation_c: Math.round(deviation * 10) / 10,
    door_open: Math.random() < 0.05,
    humidity_pct: Math.round(45 + Math.random() * 20),
    ...overrides,
  };
}

export async function publishColdChainEvent(vehicleId?: string, overrides?: Partial<ColdChainEvent>): Promise<ColdChainEvent> {
  const event = generateColdChainEvent(vehicleId, overrides);
  await publishMessage(FLEET_TOPICS.COLDCHAIN_RAW, event.vehicle_id, event);
  console.log(`Published coldchain: ${event.vehicle_id} temp=${event.current_temp_c}°C dev=${event.deviation_c}°C`);
  return event;
}
