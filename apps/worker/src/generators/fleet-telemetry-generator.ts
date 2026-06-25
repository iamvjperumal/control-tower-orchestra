import crypto from 'node:crypto';
import { FLEET_TOPICS, TelemetryEvent } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

const VEHICLES = [
  { id: 'VH-2041', lat: 37.7749, lng: -122.4194, heading: 45, speed: 72 },
  { id: 'VH-3087', lat: 34.0522, lng: -118.2437, heading: 180, speed: 88 },
  { id: 'VH-1955', lat: 40.7128, lng: -74.0060, heading: 270, speed: 45 },
  { id: 'VH-4120', lat: 41.8781, lng: -87.6298, heading: 90, speed: 65 },
  { id: 'VH-5502', lat: 29.7604, lng: -95.3698, heading: 0, speed: 0 },
  { id: 'VH-6615', lat: 47.6062, lng: -122.3321, heading: 135, speed: 55 },
  { id: 'VH-7789', lat: 33.4484, lng: -112.0740, heading: 315, speed: 78 },
  { id: 'VH-8234', lat: 36.1627, lng: -86.7816, heading: 60, speed: 95 },
];

export function generateTelemetry(vehicleId?: string, overrides?: Partial<TelemetryEvent>): TelemetryEvent {
  const v = vehicleId
    ? VEHICLES.find(x => x.id === vehicleId) || VEHICLES[0]
    : VEHICLES[Math.floor(Math.random() * VEHICLES.length)];

  const jitter = () => (Math.random() - 0.5) * 0.001;

  return {
    event_id: crypto.randomUUID(),
    event_type: 'telemetry',
    event_time: new Date().toISOString(),
    source_system: 'fleet-telematics',
    vehicle_id: v.id,
    lat: v.lat + jitter(),
    lng: v.lng + jitter(),
    speed_kmh: Math.max(0, v.speed + (Math.random() - 0.5) * 10),
    heading: v.heading,
    fuel_pct: Math.round(40 + Math.random() * 55),
    engine_temp_c: Math.round(85 + Math.random() * 15),
    odometer_km: Math.round(50000 + Math.random() * 150000),
    ...overrides,
  };
}

export async function publishTelemetry(vehicleId?: string, overrides?: Partial<TelemetryEvent>): Promise<TelemetryEvent> {
  const event = generateTelemetry(vehicleId, overrides);
  await publishMessage(FLEET_TOPICS.TELEMETRY_RAW, event.vehicle_id, event);
  console.log(`Published telemetry: ${event.vehicle_id} speed=${event.speed_kmh.toFixed(0)}km/h temp=${event.engine_temp_c}°C`);
  return event;
}
