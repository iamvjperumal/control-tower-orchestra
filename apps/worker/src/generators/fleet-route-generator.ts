import crypto from 'node:crypto';
import { FLEET_TOPICS, RouteEvent } from '@signaltwin/shared';
import { publishMessage } from '../services/kafka-producer.js';

const ROUTES = [
  { vehicle: 'VH-2041', route: 'RT-4401', origin: 'Oakland Hub', destination: 'Bay Area Distribution Center', distance: 85 },
  { vehicle: 'VH-3087', route: 'RT-4402', origin: 'Long Beach Port', destination: 'LA Warehouse Hub', distance: 210 },
  { vehicle: 'VH-1955', route: 'RT-4403', origin: 'NJ Depot', destination: 'Manhattan Drop Point', distance: 32 },
  { vehicle: 'VH-4120', route: 'RT-4404', origin: 'Milwaukee Center', destination: 'Chicago Cold Storage', distance: 145 },
  { vehicle: 'VH-6615', route: 'RT-4405', origin: 'Tacoma Yard', destination: 'Seattle Metro Hub', distance: 55 },
  { vehicle: 'VH-7789', route: 'RT-4406', origin: 'Tucson Facility', destination: 'Phoenix Pharma Depot', distance: 178 },
  { vehicle: 'VH-8234', route: 'RT-4407', origin: 'Memphis Hub', destination: 'Nashville Sorting Center', distance: 120 },
];

export function generateRouteEvent(vehicleId?: string, overrides?: Partial<RouteEvent>): RouteEvent {
  const r = vehicleId
    ? ROUTES.find(x => x.vehicle === vehicleId) || ROUTES[0]
    : ROUTES[Math.floor(Math.random() * ROUTES.length)];

  const eta = new Date(Date.now() + (30 + Math.random() * 120) * 60000);
  const drift = Math.floor(Math.random() * 5);

  return {
    event_id: crypto.randomUUID(),
    event_type: 'route_update',
    event_time: new Date().toISOString(),
    source_system: 'fleet-routing',
    vehicle_id: r.vehicle,
    route_id: r.route,
    origin: r.origin,
    destination: r.destination,
    planned_eta: eta.toISOString(),
    current_eta: new Date(eta.getTime() + drift * 60000).toISOString(),
    eta_drift_minutes: drift,
    deviation_score: Math.round(Math.random() * 10),
    distance_remaining_km: Math.round(r.distance * (0.2 + Math.random() * 0.8)),
    ...overrides,
  };
}

export async function publishRouteEvent(vehicleId?: string, overrides?: Partial<RouteEvent>): Promise<RouteEvent> {
  const event = generateRouteEvent(vehicleId, overrides);
  await publishMessage(FLEET_TOPICS.ROUTE_EVENTS_RAW, event.vehicle_id, event);
  console.log(`Published route: ${event.vehicle_id} drift=${event.eta_drift_minutes}m dev=${event.deviation_score}`);
  return event;
}
