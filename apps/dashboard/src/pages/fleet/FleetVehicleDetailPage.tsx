import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';

interface Vehicle {
  vehicle_id: string;
  driver_name: string;
  vehicle_type: 'van' | 'truck' | 'reefer';
  status: 'en_route' | 'idle' | 'delayed' | 'maintenance' | 'alert';
  lat: number;
  lng: number;
  speed_kmh: number;
  heading: number;
  fuel_pct: number;
  engine_temp_c: number;
  eta_minutes: number;
  eta_drift_minutes: number;
  route_deviation_score: number;
  safety_score: number;
  current_order_id: string;
  destination: string;
  coldchain_temp_c: number | null;
  coldchain_target_c: number | null;
  maintenance_risk: number;
  last_update: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  en_route: { bg: 'rgba(52, 211, 153, 0.12)', text: '#34d399', label: 'En Route' },
  idle: { bg: 'rgba(100, 100, 130, 0.12)', text: '#8888a4', label: 'Idle' },
  delayed: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24', label: 'Delayed' },
  maintenance: { bg: 'rgba(251, 146, 60, 0.12)', text: '#fb923c', label: 'Maintenance' },
  alert: { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171', label: 'Alert' },
};

function scoreColor(val: number, goodThreshold: number, warnThreshold: number): string {
  if (val >= goodThreshold) return '#34d399';
  if (val >= warnThreshold) return '#fbbf24';
  return '#f87171';
}

function riskColor(val: number): string {
  if (val <= 20) return '#34d399';
  if (val <= 50) return '#fbbf24';
  return '#f87171';
}

export function FleetVehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`${api.baseUrl}/api/fleet/vehicles/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setVehicle)
      .catch(() => setError('Vehicle not found'));

    const interval = setInterval(() => {
      fetch(`${api.baseUrl}/api/fleet/vehicles/${id}`)
        .then(r => r.json())
        .then(setVehicle)
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        <Link to="/fleet" className="text-sm mt-2 inline-block" style={{ color: '#fb923c' }}>Back to fleet</Link>
      </div>
    );
  }

  if (!vehicle) {
    return <p className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</p>;
  }

  const ss = STATUS_STYLES[vehicle.status] || STATUS_STYLES.idle;

  return (
    <div className="space-y-6">
      <Link to="/fleet" className="text-sm" style={{ color: '#fb923c' }}>&larr; Back to fleet</Link>

      {/* Hero card */}
      <div className="card-gradient">
        <div className="relative z-[1] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold font-mono text-white">{vehicle.vehicle_id}</h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ background: ss.bg, color: ss.text }}>
                {ss.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(251,146,60,0.1)', color: '#fb923c' }}>
                {vehicle.vehicle_type.toUpperCase()}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Driver: <span className="text-white font-semibold">{vehicle.driver_name}</span>
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Destination: <span className="text-white">{vehicle.destination}</span>
            </p>
            {vehicle.current_order_id && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Order: {vehicle.current_order_id}</p>
            )}
          </div>
          <div className="text-right">
            {vehicle.eta_minutes > 0 && (
              <div>
                <p className="text-3xl font-bold text-white">{vehicle.eta_minutes}m</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>ETA</p>
                {vehicle.eta_drift_minutes > 0 && (
                  <p className="text-sm font-bold mt-1" style={{ color: vehicle.eta_drift_minutes > 10 ? '#f87171' : '#fbbf24' }}>
                    +{vehicle.eta_drift_minutes}m drift
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Speed" value={`${vehicle.speed_kmh} km/h`} color="white" />
        <MetricCard label="Fuel" value={`${vehicle.fuel_pct}%`} color={vehicle.fuel_pct > 30 ? '#34d399' : '#f87171'} />
        <MetricCard label="Engine Temp" value={`${vehicle.engine_temp_c}°C`} color={vehicle.engine_temp_c < 100 ? '#34d399' : '#f87171'} />
        <MetricCard label="Route Deviation" value={vehicle.route_deviation_score.toString()} color={riskColor(vehicle.route_deviation_score)} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Safety */}
        <div className="card">
          <p className="text-[11px] font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>SAFETY</p>
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#1e1e36" strokeWidth="6" />
                <circle cx="60" cy="60" r="48" fill="none"
                  stroke={scoreColor(vehicle.safety_score, 85, 70)} strokeWidth="6"
                  strokeDasharray={`${(vehicle.safety_score / 100) * 301.59} 301.59`}
                  strokeLinecap="round" transform="rotate(-90 60 60)"
                  style={{ transition: 'all 0.6s ease' }} />
                <text x="60" y="56" textAnchor="middle" fill={scoreColor(vehicle.safety_score, 85, 70)} fontSize="26" fontWeight="800">{vehicle.safety_score}</text>
                <text x="60" y="74" textAnchor="middle" fill="#55556a" fontSize="10">SCORE</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Cold Chain */}
        <div className="card">
          <p className="text-[11px] font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>COLD CHAIN</p>
          {vehicle.coldchain_temp_c !== null ? (
            <div className="text-center py-4">
              <p className="text-3xl font-bold" style={{
                color: vehicle.coldchain_target_c !== null && Math.abs(vehicle.coldchain_temp_c - vehicle.coldchain_target_c) > 2 ? '#f87171' : '#38bdf8'
              }}>
                {vehicle.coldchain_temp_c}°C
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Target: {vehicle.coldchain_target_c}°C</p>
              {vehicle.coldchain_target_c !== null && (
                <p className="text-sm font-semibold mt-2" style={{
                  color: Math.abs(vehicle.coldchain_temp_c - vehicle.coldchain_target_c) > 2 ? '#f87171' : '#34d399'
                }}>
                  {Math.abs(vehicle.coldchain_temp_c - vehicle.coldchain_target_c) > 2
                    ? `BREACH: ${Math.abs(vehicle.coldchain_temp_c - vehicle.coldchain_target_c).toFixed(1)}° deviation`
                    : 'Within tolerance'}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>N/A — non-reefer vehicle</p>
            </div>
          )}
        </div>

        {/* Maintenance */}
        <div className="card">
          <p className="text-[11px] font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>MAINTENANCE RISK</p>
          <div className="text-center py-4">
            <p className="text-3xl font-bold" style={{ color: riskColor(vehicle.maintenance_risk) }}>
              {vehicle.maintenance_risk}%
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {vehicle.maintenance_risk > 50 ? 'Service recommended' : vehicle.maintenance_risk > 25 ? 'Monitor closely' : 'Healthy'}
            </p>
            <div className="mt-4 h-2 rounded-full" style={{ background: '#1e1e36' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{
                width: `${vehicle.maintenance_risk}%`,
                background: `linear-gradient(90deg, ${riskColor(vehicle.maintenance_risk)}80, ${riskColor(vehicle.maintenance_risk)})`,
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Location info */}
      <div className="card">
        <p className="text-[11px] font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>TELEMETRY</p>
        <div className="grid grid-cols-4 gap-4">
          <InfoRow label="Latitude" value={vehicle.lat.toFixed(4)} />
          <InfoRow label="Longitude" value={vehicle.lng.toFixed(4)} />
          <InfoRow label="Heading" value={`${vehicle.heading}°`} />
          <InfoRow label="Last Update" value={new Date(vehicle.last_update).toLocaleTimeString()} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card text-center">
      <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-mono text-white">{value}</p>
    </div>
  );
}
