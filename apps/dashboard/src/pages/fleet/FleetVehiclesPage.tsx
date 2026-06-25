import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

interface Vehicle {
  vehicle_id: string;
  driver_name: string;
  vehicle_type: 'van' | 'truck' | 'reefer';
  status: 'en_route' | 'idle' | 'delayed' | 'maintenance' | 'alert';
  speed_kmh: number;
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

const STATUS_COLORS: Record<Vehicle['status'], string> = {
  en_route: '#34d399',
  idle: '#8888a4',
  delayed: '#fbbf24',
  maintenance: '#fb923c',
  alert: '#f87171',
};

const STATUS_LABELS: Record<Vehicle['status'], string> = {
  en_route: 'En Route',
  idle: 'Idle',
  delayed: 'Delayed',
  maintenance: 'Maintenance',
  alert: 'Alert',
};

const ALL_STATUSES: Array<Vehicle['status'] | 'all'> = [
  'all',
  'en_route',
  'idle',
  'delayed',
  'maintenance',
  'alert',
];

function MaintenanceRiskBar({ risk }: { risk: number }) {
  const pct = Math.min(Math.max(risk * 100, 0), 100);
  let color: string;
  if (risk < 0.3) color = '#34d399';
  else if (risk < 0.6) color = '#fbbf24';
  else if (risk < 0.8) color = '#fb923c';
  else color = '#f87171';

  return (
    <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 3,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

export function FleetVehiclesPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Vehicle['status'] | 'all'>('all');
  const [search, setSearch] = useState('');

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch(`${api.baseUrl}/api/fleet/vehicles`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: Vehicle[] = await res.json();
      setVehicles(data);
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 3000);
    return () => clearInterval(interval);
  }, [fetchVehicles]);

  const filtered = vehicles.filter((v) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !v.vehicle_id.toLowerCase().includes(q) &&
        !v.driver_name.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            color: 'var(--text-primary)',
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
          }}
        >
          Fleet Vehicles
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>
          {loading
            ? 'Loading vehicles...'
            : `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} in fleet`}
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_STATUSES.map((s) => {
            const active = statusFilter === s;
            const color = s === 'all' ? '#fb923c' : STATUS_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${active ? color : 'var(--border-card)'}`,
                  background: active ? `${color}22` : 'transparent',
                  color: active ? color : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search vehicle ID or driver..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--border-card)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
            minWidth: 220,
            marginLeft: 'auto',
          }}
        />
      </div>

      {/* Vehicle grid */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 60 }}>
          Loading vehicles...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 60 }}>
          No vehicles match the current filters.
        </div>
      ) : (
        <div
          className="fleet-vehicles-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
        >
          <style>{`
            @media (max-width: 1100px) {
              .fleet-vehicles-grid { grid-template-columns: repeat(2, 1fr) !important; }
            }
            @media (max-width: 700px) {
              .fleet-vehicles-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
          {filtered.map((v) => (
            <div
              key={v.vehicle_id}
              className="card"
              onClick={() => navigate(`/fleet/vehicles/${v.vehicle_id}`)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: 12,
                padding: 20,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#fb923c66';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(251,146,60,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-card)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {/* Top row: Vehicle ID + type badge + status badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: 15,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {v.vehicle_id}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'rgba(251,146,60,0.1)',
                      color: '#fb923c',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {v.vehicle_type}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: `${STATUS_COLORS[v.status]}18`,
                    color: STATUS_COLORS[v.status],
                  }}
                >
                  {STATUS_LABELS[v.status]}
                </span>
              </div>

              {/* Driver */}
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                {v.driver_name}
              </div>

              {/* Destination */}
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {v.destination}
              </div>

              {/* Key metrics row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {[
                  { label: 'ETA', value: `${v.eta_minutes}m` },
                  { label: 'Speed', value: `${v.speed_kmh} km/h` },
                  { label: 'Fuel', value: `${v.fuel_pct}%` },
                  { label: 'Safety', value: `${v.safety_score}` },
                ].map((m) => (
                  <div key={m.label} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 2,
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cold chain temp */}
              {v.coldchain_temp_c !== null && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color:
                      v.coldchain_target_c !== null &&
                      Math.abs(v.coldchain_temp_c - v.coldchain_target_c) > 3
                        ? '#f87171'
                        : '#34d399',
                    marginBottom: 12,
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <span style={{ fontSize: 14 }}>&#x2744;</span>
                  <span style={{ fontWeight: 600 }}>
                    {v.coldchain_temp_c.toFixed(1)}&deg;C
                  </span>
                  {v.coldchain_target_c !== null && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      / target {v.coldchain_target_c.toFixed(1)}&deg;C
                    </span>
                  )}
                </div>
              )}

              {/* Maintenance risk bar */}
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  <span>Maintenance Risk</span>
                  <span>{(v.maintenance_risk * 100).toFixed(0)}%</span>
                </div>
                <MaintenanceRiskBar risk={v.maintenance_risk} />
              </div>

              {/* ETA drift indicator */}
              {v.eta_drift_minutes > 0 && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: v.eta_drift_minutes > 10 ? '#f87171' : '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>&#x25B2;</span>
                  +{v.eta_drift_minutes}m ETA drift
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
