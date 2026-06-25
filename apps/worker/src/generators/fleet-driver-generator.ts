import crypto from 'node:crypto';
import { FLEET_TOPICS, DriverEvent } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

type DriverEventType = 'harsh_braking' | 'harsh_acceleration' | 'overspeed' | 'fatigue_alert' | 'break_started' | 'break_ended';

export function generateDriverEvent(vehicleId: string, eventType?: DriverEventType, overrides?: Partial<DriverEvent>): DriverEvent {
  const type = eventType || (['harsh_braking', 'harsh_acceleration', 'overspeed'] as DriverEventType[])[Math.floor(Math.random() * 3)];

  const base: DriverEvent = {
    event_id: crypto.randomUUID(),
    event_type: type,
    event_time: new Date().toISOString(),
    source_system: 'fleet-driver-monitor',
    vehicle_id: vehicleId,
  };

  switch (type) {
    case 'harsh_braking':
      base.deceleration_g = Math.round((0.4 + Math.random() * 0.4) * 100) / 100;
      break;
    case 'harsh_acceleration':
      base.acceleration_g = Math.round((0.3 + Math.random() * 0.3) * 100) / 100;
      break;
    case 'overspeed':
      base.speed_kmh = Math.round(110 + Math.random() * 30);
      base.speed_limit_kmh = 100;
      break;
    case 'fatigue_alert':
      base.fatigue_score = Math.round((0.6 + Math.random() * 0.4) * 100) / 100;
      break;
  }

  return { ...base, ...overrides };
}

export async function publishDriverEvent(vehicleId: string, eventType?: DriverEventType, overrides?: Partial<DriverEvent>): Promise<DriverEvent> {
  const event = generateDriverEvent(vehicleId, eventType, overrides);
  await publishMessage(FLEET_TOPICS.DRIVER_EVENTS_RAW, event.vehicle_id, event);
  console.log(`Published driver event: ${event.vehicle_id} type=${event.event_type}`);
  return event;
}
