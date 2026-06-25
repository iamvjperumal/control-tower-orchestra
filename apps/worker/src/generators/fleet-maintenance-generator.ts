import crypto from 'node:crypto';
import { FLEET_TOPICS, MaintenanceEvent } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

const FAULT_CODES = ['P0217', 'P0128', 'P0301', 'P0420', 'P0562', 'P0700', 'P2263'];

export function generateMaintenanceEvent(vehicleId: string, overrides?: Partial<MaintenanceEvent>): MaintenanceEvent {
  const hasFault = Math.random() < 0.15;

  return {
    event_id: crypto.randomUUID(),
    event_type: hasFault ? 'fault_code' : 'maintenance_signal',
    event_time: new Date().toISOString(),
    source_system: 'fleet-diagnostics',
    vehicle_id: vehicleId,
    fault_code: hasFault ? FAULT_CODES[Math.floor(Math.random() * FAULT_CODES.length)] : null,
    engine_temp_c: Math.round(88 + Math.random() * 12),
    oil_pressure_psi: Math.round(25 + Math.random() * 20),
    brake_wear_pct: Math.round(Math.random() * 60),
    tire_pressure_psi: [32, 32, 34, 34].map(p => Math.round((p + (Math.random() - 0.5) * 4) * 10) / 10),
    maintenance_risk_score: Math.round(Math.random() * 30),
    description: hasFault ? `Diagnostic fault detected` : 'Routine diagnostic check',
    ...overrides,
  };
}

export async function publishMaintenanceEvent(vehicleId: string, overrides?: Partial<MaintenanceEvent>): Promise<MaintenanceEvent> {
  const event = generateMaintenanceEvent(vehicleId, overrides);
  await publishMessage(FLEET_TOPICS.MAINTENANCE_RAW, event.vehicle_id, event);
  console.log(`Published maintenance: ${event.vehicle_id} risk=${event.maintenance_risk_score}% fault=${event.fault_code || 'none'}`);
  return event;
}
