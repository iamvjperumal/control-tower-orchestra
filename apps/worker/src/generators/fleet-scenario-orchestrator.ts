import { publishTelemetry } from './fleet-telemetry-generator.js';
import { publishRouteEvent } from './fleet-route-generator.js';
import { publishColdChainEvent } from './fleet-coldchain-generator.js';
import { publishMaintenanceEvent } from './fleet-maintenance-generator.js';
import { publishDriverEvent } from './fleet-driver-generator.js';

function wait(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export async function runFleetDelayScenario(vehicleId: string = 'VH-2041'): Promise<void> {
  console.log(`[Fleet Scenario] Starting delay scenario for ${vehicleId}`);

  await publishTelemetry(vehicleId, { speed_kmh: 72, engine_temp_c: 92 });
  await wait(2000);

  await publishRouteEvent(vehicleId, { eta_drift_minutes: 8, deviation_score: 15, event_type: 'route_update' });
  await wait(3000);

  await publishRouteEvent(vehicleId, { eta_drift_minutes: 18, deviation_score: 35, event_type: 'route_deviation' });
  await wait(2000);

  await publishTelemetry(vehicleId, { speed_kmh: 25, engine_temp_c: 94 });
  await wait(3000);

  await publishRouteEvent(vehicleId, { eta_drift_minutes: 6, deviation_score: 12, event_type: 'route_update' });
  console.log(`[Fleet Scenario] Delay scenario complete for ${vehicleId}`);
}

export async function runFleetColdChainScenario(vehicleId: string = 'VH-2041'): Promise<void> {
  console.log(`[Fleet Scenario] Starting cold chain scenario for ${vehicleId}`);

  await publishColdChainEvent(vehicleId, { current_temp_c: -19.5, target_temp_c: -20.0, deviation_c: 0.5 });
  await wait(2000);

  await publishColdChainEvent(vehicleId, { current_temp_c: -17.8, target_temp_c: -20.0, deviation_c: 2.2 });
  await wait(2000);

  await publishColdChainEvent(vehicleId, { current_temp_c: -15.8, target_temp_c: -20.0, deviation_c: 4.2, event_type: 'coldchain_breach' });
  await wait(3000);

  await publishColdChainEvent(vehicleId, { current_temp_c: -14.2, target_temp_c: -20.0, deviation_c: 5.8, door_open: true, event_type: 'coldchain_breach' });
  await wait(2000);

  await publishColdChainEvent(vehicleId, { current_temp_c: -18.5, target_temp_c: -20.0, deviation_c: 1.5, event_type: 'coldchain_recovery' });
  console.log(`[Fleet Scenario] Cold chain scenario complete for ${vehicleId}`);
}

export async function runFleetSafetyScenario(vehicleId: string = 'VH-8234'): Promise<void> {
  console.log(`[Fleet Scenario] Starting safety scenario for ${vehicleId}`);

  await publishDriverEvent(vehicleId, 'harsh_braking', { deceleration_g: 0.55 });
  await wait(2000);

  await publishDriverEvent(vehicleId, 'overspeed', { speed_kmh: 125, speed_limit_kmh: 100 });
  await wait(2000);

  await publishDriverEvent(vehicleId, 'harsh_braking', { deceleration_g: 0.72 });
  await wait(2000);

  await publishDriverEvent(vehicleId, 'harsh_acceleration', { acceleration_g: 0.48 });
  await wait(3000);

  await publishDriverEvent(vehicleId, 'fatigue_alert', { fatigue_score: 0.78 });
  console.log(`[Fleet Scenario] Safety scenario complete for ${vehicleId}`);
}

export async function runFleetMaintenanceScenario(vehicleId: string = 'VH-7789'): Promise<void> {
  console.log(`[Fleet Scenario] Starting maintenance scenario for ${vehicleId}`);

  await publishMaintenanceEvent(vehicleId, { engine_temp_c: 98, maintenance_risk_score: 35, fault_code: null });
  await wait(2000);

  await publishMaintenanceEvent(vehicleId, { engine_temp_c: 102, maintenance_risk_score: 48, fault_code: 'P0217' });
  await wait(2000);

  await publishMaintenanceEvent(vehicleId, { engine_temp_c: 106, maintenance_risk_score: 62, fault_code: 'P0217' });
  await wait(2000);

  await publishMaintenanceEvent(vehicleId, { engine_temp_c: 108, maintenance_risk_score: 75, fault_code: 'P2263' });
  await wait(3000);

  await publishTelemetry(vehicleId, { engine_temp_c: 112, speed_kmh: 60 });
  console.log(`[Fleet Scenario] Maintenance scenario complete for ${vehicleId}`);
}

export async function runFleetRandomBackground(): Promise<void> {
  const vehicles = ['VH-2041', 'VH-3087', 'VH-1955', 'VH-4120', 'VH-6615', 'VH-7789', 'VH-8234'];
  const v = vehicles[Math.floor(Math.random() * vehicles.length)];

  await publishTelemetry(v);

  if (Math.random() < 0.3) await publishRouteEvent(v);
  if (['VH-2041', 'VH-4120', 'VH-7789'].includes(v) && Math.random() < 0.25) {
    await publishColdChainEvent(v);
  }
  if (Math.random() < 0.1) await publishMaintenanceEvent(v);
  if (Math.random() < 0.08) await publishDriverEvent(v);
}

export async function runFullFleetDemo(): Promise<void> {
  console.log('[Fleet Scenario] Starting full fleet demo...');

  await runFleetDelayScenario('VH-2041');
  await wait(3000);
  await runFleetColdChainScenario('VH-2041');
  await wait(3000);
  await runFleetSafetyScenario('VH-8234');
  await wait(3000);
  await runFleetMaintenanceScenario('VH-7789');

  console.log('[Fleet Scenario] Full fleet demo complete');
}
