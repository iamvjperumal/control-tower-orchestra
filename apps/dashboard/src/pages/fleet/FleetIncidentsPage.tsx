import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';

interface FleetIncident {
  incident_id: string;
  vehicle_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#8888a4',
  medium: '#fbbf24',
  high: '#fb923c',
  critical: '#f87171',
};

const TYPE_LABELS: Record<string, string> = {
  eta_drift: 'ETA Drift',
  cold_chain_breach: 'Cold Chain Breach',
  safety_alert: 'Safety Alert',
  maintenance_warning: 'Maintenance Warning',
  route_deviation: 'Route Deviation',
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function FleetIncidentsPage() {
  const [incidents, setIncidents] = useState<FleetIncident[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showResolved, setShowResolved] = useState<boolean>(false);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const data = await fetch(`${api.baseUrl}/api/fleet/incidents`).then(r => r.json());
        setIncidents(data);
      } catch { /* ignore */ }
    }
    fetchIncidents();

    const source = new EventSource(`${api.baseUrl}/api/fleet/events/stream`);
    sseRef.current = source;

    source.addEventListener('fleet-incident', (e: MessageEvent) => {
      const inc = JSON.parse(e.data) as FleetIncident;
      setIncidents(prev => [inc, ...prev]);
    });

    return () => source.close();
  }, []);

  const filtered = incidents.filter(inc => {
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && inc.type !== typeFilter) return false;
    if (!showResolved && inc.resolved) return false;
    return true;
  });

  const activeCount = incidents.filter(i => !i.resolved).length;
  const countBySeverity = (sev: string) => incidents.filter(i => i.severity === sev && !i.resolved).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Fleet Incidents
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {activeCount} active incident{activeCount !== 1 ? 's' : ''} across the fleet
          </p>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: '9999px',
            background: activeCount > 0 ? 'rgba(248, 113, 113, 0.12)' : 'rgba(52, 211, 153, 0.12)',
            color: activeCount > 0 ? '#f87171' : '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {activeCount > 0 && (
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', animation: 'pulse 2s infinite' }} />
          )}
          {activeCount} Active
        </span>
      </div>

      {/* Severity Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {(['low', 'medium', 'high', 'critical'] as const).map(sev => {
          const count = countBySeverity(sev);
          const color = SEVERITY_COLORS[sev];
          return (
            <div key={sev} className="card" style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                {sev}
              </p>
              <p style={{ fontSize: '28px', fontWeight: 700, color, margin: '4px 0 0' }}>
                {count}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter Controls */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', flexWrap: 'wrap' }}>
        {/* Severity filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Severity:</span>
          {['all', 'low', 'medium', 'high', 'critical'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => setSeverityFilter(opt)}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: severityFilter === opt
                  ? opt === 'all' ? 'rgba(251, 146, 60, 0.15)' : `${SEVERITY_COLORS[opt]}22`
                  : 'rgba(255, 255, 255, 0.04)',
                color: severityFilter === opt
                  ? opt === 'all' ? '#fb923c' : SEVERITY_COLORS[opt]
                  : 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Type:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-card)',
              background: 'var(--bg-base)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Types</option>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Show resolved toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Show resolved:</span>
          <button
            type="button"
            onClick={() => setShowResolved(prev => !prev)}
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              background: showResolved ? 'rgba(251, 146, 60, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '3px',
                left: showResolved ? '19px' : '3px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: showResolved ? '#fb923c' : '#8888a4',
                transition: 'left 0.2s, background 0.2s',
              }}
            />
          </button>
        </div>
      </div>

      {/* Incident Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No incidents match the current filters
            </p>
          </div>
        )}
        {filtered.map(inc => {
          const sevColor = SEVERITY_COLORS[inc.severity] || SEVERITY_COLORS.low;
          const typeLabel = TYPE_LABELS[inc.type] || inc.type;

          return (
            <div
              key={inc.incident_id}
              className="card"
              style={{
                padding: '14px 18px',
                borderLeft: `3px solid ${sevColor}`,
                opacity: inc.resolved ? 0.55 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Top row: badges + vehicle + timestamp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {/* Severity badge */}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '5px',
                    background: `${sevColor}22`,
                    color: sevColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}
                >
                  {inc.severity}
                </span>

                {/* Type badge */}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '5px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {typeLabel}
                </span>

                {/* Vehicle ID */}
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#fb923c',
                  }}
                >
                  {inc.vehicle_id}
                </span>

                {/* Resolved/Active indicator */}
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    background: inc.resolved ? 'rgba(52, 211, 153, 0.12)' : 'rgba(248, 113, 113, 0.12)',
                    color: inc.resolved ? '#34d399' : '#f87171',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {inc.resolved ? 'Resolved' : 'Active'}
                </span>

                {/* Timestamp */}
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginLeft: 'auto',
                  }}
                >
                  {timeAgo(inc.timestamp)}
                </span>
              </div>

              {/* Message */}
              <p
                style={{
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}
              >
                {inc.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
