import { useState, useEffect, useRef, useCallback } from 'react';
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

interface FleetMetrics {
  total_vehicles: number;
  active_vehicles: number;
  delayed_vehicles: number;
  avg_safety_score: number;
  avg_eta_drift_minutes: number;
  coldchain_breaches: number;
  active_incidents: number;
  pending_decisions: number;
  on_time_rate: number;
  fleet_health: number;
}

interface FleetIncident {
  incident_id: string;
  vehicle_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface AgentDecision {
  decision_id: string;
  agent_type: string;
  vehicle_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  recommended_action: string;
  confidence: number;
  timestamp: string;
  status: string;
}

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  vehicle_id: string;
  agents: string[];
  steps: number;
  duration_seconds: number;
  icon: string;
  color: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  en_route: { bg: 'rgba(52, 211, 153, 0.12)', text: '#34d399', label: 'En Route' },
  idle: { bg: 'rgba(100, 100, 130, 0.12)', text: '#8888a4', label: 'Idle' },
  delayed: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24', label: 'Delayed' },
  maintenance: { bg: 'rgba(251, 146, 60, 0.12)', text: '#fb923c', label: 'Maintenance' },
  alert: { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171', label: 'Alert' },
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: 'rgba(100, 100, 130, 0.12)', text: '#8888a4' },
  medium: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24' },
  high: { bg: 'rgba(251, 146, 60, 0.12)', text: '#fb923c' },
  critical: { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171' },
};

const AGENT_LABELS: Record<string, { label: string; color: string }> = {
  delay_agent: { label: 'Delay', color: '#fbbf24' },
  coldchain_agent: { label: 'Cold Chain', color: '#38bdf8' },
  safety_agent: { label: 'Safety', color: '#fb923c' },
  maintenance_agent: { label: 'Maintenance', color: '#c084fc' },
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

const SCENARIO_ICONS: Record<string, React.ReactNode> = {
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
  thermometer: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 1 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  wrench: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
  layers: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
};

export function FleetDashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  const [incidents, setIncidents] = useState<FleetIncident[]>([]);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [runningScenario, setRunningScenario] = useState<string | false>(false);
  const [completedScenarios, setCompletedScenarios] = useState<Set<string>>(new Set());
  const [liveSteps, setLiveSteps] = useState<string[]>([]);
  const sseRef = useRef<EventSource | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const m = await fetch(`${api.baseUrl}/api/fleet/metrics`).then(r => r.json());
      setMetrics(m);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAll();
    fetchScenarios();
    const source = new EventSource(`${api.baseUrl}/api/fleet/events/stream`);
    sseRef.current = source;

    source.addEventListener('fleet-init', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setVehicles(data.vehicles);
      setIncidents(data.incidents);
      setDecisions(data.decisions);
    });
    source.addEventListener('fleet-vehicle-update', (e: MessageEvent) => {
      const v = JSON.parse(e.data) as Vehicle;
      setVehicles(prev => prev.map(p => p.vehicle_id === v.vehicle_id ? v : p));
      fetchMetrics();
    });
    source.addEventListener('fleet-incident', (e: MessageEvent) => {
      const inc = JSON.parse(e.data) as FleetIncident;
      setIncidents(prev => [inc, ...prev].slice(0, 50));
      fetchMetrics();
    });
    source.addEventListener('fleet-decision', (e: MessageEvent) => {
      const dec = JSON.parse(e.data) as AgentDecision;
      setDecisions(prev => [dec, ...prev].slice(0, 50));
      fetchMetrics();
    });
    source.addEventListener('fleet-demo-step', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setLiveSteps(prev => [...prev, data.step]);
    });
    source.addEventListener('fleet-demo-status', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.status === 'completed') {
        setRunningScenario(false);
        setCompletedScenarios(prev => new Set(prev).add(data.scenario_id));
      }
    });

    return () => source.close();
  }, [fetchMetrics]);

  async function fetchAll() {
    try {
      const [v, m, i, d] = await Promise.all([
        fetch(`${api.baseUrl}/api/fleet/vehicles`).then(r => r.json()),
        fetch(`${api.baseUrl}/api/fleet/metrics`).then(r => r.json()),
        fetch(`${api.baseUrl}/api/fleet/incidents`).then(r => r.json()),
        fetch(`${api.baseUrl}/api/fleet/agents`).then(r => r.json()),
      ]);
      setVehicles(v); setMetrics(m); setIncidents(i); setDecisions(d);
    } catch {}
  }

  async function fetchScenarios() {
    try {
      const data = await fetch(`${api.baseUrl}/api/fleet/demo/scenarios`).then(r => r.json());
      setScenarios(data.scenarios);
      if (data.running) setRunningScenario(data.running);
    } catch {}
  }

  async function launchScenario(id: string) {
    if (runningScenario) return;
    setRunningScenario(id);
    setLiveSteps([]);
    await fetch(`${api.baseUrl}/api/fleet/demo/start/${id}`, { method: 'POST' });
  }

  return (
    <div className="space-y-5">
      {/* Scenario Selector */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Demo Scenarios</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Select a scenario to simulate real-time fleet events and AI agent responses
            </p>
          </div>
          {runningScenario && (
            <span className="text-[10px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-2"
              style={{ background: 'rgba(251, 146, 60, 0.12)', color: '#fb923c' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Running
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-3">
          {scenarios.map(sc => {
            const isRunning = runningScenario === sc.id;
            const isCompleted = completedScenarios.has(sc.id);
            const isDisabled = !!runningScenario && !isRunning;

            return (
              <button
                key={sc.id}
                type="button"
                disabled={isDisabled}
                onClick={() => !isRunning && launchScenario(sc.id)}
                className="text-left rounded-xl p-3.5 transition-all duration-200 group relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: isRunning
                    ? `${sc.color}12`
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isRunning ? sc.color + '40' : 'var(--border-card)'}`,
                }}
              >
                {/* Running animation bar */}
                {isRunning && (
                  <div className="absolute bottom-0 left-0 h-[3px] w-full overflow-hidden">
                    <div className="h-full rounded-full animate-pulse" style={{ background: `linear-gradient(90deg, transparent, ${sc.color}, transparent)` }} />
                  </div>
                )}

                {/* Hover glow */}
                {!isDisabled && !isRunning && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at top, ${sc.color}10 0%, transparent 70%)` }} />
                )}

                <div className="relative z-[1]">
                  {/* Icon + status */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${sc.color}15`, color: sc.color }}>
                      {SCENARIO_ICONS[sc.icon] || SCENARIO_ICONS.layers}
                    </div>
                    {isCompleted && !isRunning && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>

                  <p className="text-[12px] font-semibold text-white mb-1 leading-tight">{sc.name}</p>
                  <p className="text-[10px] leading-relaxed mb-2.5" style={{ color: 'var(--text-muted)' }}>{sc.description}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${sc.color}12`, color: sc.color }}>
                      {sc.vehicle_id}
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                      ~{sc.duration_seconds}s
                    </span>
                  </div>

                  {/* Agent badges */}
                  <div className="flex gap-1 mt-2">
                    {sc.agents.map(a => {
                      const al = AGENT_LABELS[a];
                      return al ? (
                        <span key={a} className="text-[8px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: `${al.color}15`, color: al.color }}>
                          {al.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live step log */}
        {liveSteps.length > 0 && (
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-card)' }}>
            <p className="text-[10px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>LIVE EVENT LOG</p>
            <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
              {liveSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: i === liveSteps.length - 1 ? '#fb923c' : '#55556a' }} />
                  <span style={{ color: i === liveSteps.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Active Vehicles" value={metrics.active_vehicles.toString()} sub={`of ${metrics.total_vehicles} total`} color="#34d399" />
          <KpiCard label="On-Time Rate" value={`${metrics.on_time_rate}%`} sub={`${metrics.delayed_vehicles} delayed`} color={metrics.on_time_rate >= 90 ? '#34d399' : '#fbbf24'} />
          <KpiCard label="Avg ETA Drift" value={`${metrics.avg_eta_drift_minutes}m`} sub="across active fleet" color={metrics.avg_eta_drift_minutes > 10 ? '#f87171' : '#34d399'} />
          <KpiCard label="Safety Score" value={metrics.avg_safety_score.toString()} sub="fleet average" color={metrics.avg_safety_score >= 85 ? '#34d399' : '#fbbf24'} />
          <KpiCard label="Cold Chain" value={metrics.coldchain_breaches.toString()} sub="active breaches" color={metrics.coldchain_breaches > 0 ? '#f87171' : '#34d399'} />
          <KpiCard label="Fleet Health" value={`${metrics.fleet_health}%`} sub="maintenance index" color={metrics.fleet_health >= 80 ? '#34d399' : '#fb923c'} />
          <KpiCard label="Incidents" value={metrics.active_incidents.toString()} sub="unresolved" color={metrics.active_incidents > 0 ? '#fb923c' : '#34d399'} />
          <KpiCard label="AI Decisions" value={metrics.pending_decisions.toString()} sub="pending review" color={metrics.pending_decisions > 0 ? '#fbbf24' : '#34d399'} />
        </div>
      )}

      {/* Vehicle Fleet Table */}
      <div className="card" style={{ maxHeight: '400px', overflow: 'hidden' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">Fleet Status</p>
          <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: 'rgba(251, 146, 60, 0.12)', color: '#fb923c' }}>
            {vehicles.length} vehicles
          </span>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[320px]">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-card)' }}>
                <th className="text-left py-2 pr-3 font-semibold">Vehicle</th>
                <th className="text-left py-2 pr-3 font-semibold">Driver</th>
                <th className="text-left py-2 pr-3 font-semibold">Status</th>
                <th className="text-left py-2 pr-3 font-semibold">Destination</th>
                <th className="text-right py-2 pr-3 font-semibold">ETA</th>
                <th className="text-right py-2 pr-3 font-semibold">Drift</th>
                <th className="text-right py-2 pr-3 font-semibold">Safety</th>
                <th className="text-right py-2 font-semibold">Maint.</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => {
                const ss = STATUS_STYLES[v.status] || STATUS_STYLES.idle;
                return (
                  <tr key={v.vehicle_id} className="transition-colors" style={{ borderBottom: '1px solid rgba(30, 30, 54, 0.5)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{v.vehicle_id}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(251,146,60,0.1)', color: '#fb923c' }}>{v.vehicle_type}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3" style={{ color: 'var(--text-secondary)' }}>{v.driver_name}</td>
                    <td className="py-2.5 pr-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: ss.bg, color: ss.text }}>{ss.label}</span>
                    </td>
                    <td className="py-2.5 pr-3 max-w-[150px] truncate" style={{ color: 'var(--text-secondary)' }}>{v.destination}</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-white">{v.eta_minutes > 0 ? `${v.eta_minutes}m` : '—'}</td>
                    <td className="py-2.5 pr-3 text-right font-mono" style={{ color: v.eta_drift_minutes > 10 ? '#f87171' : v.eta_drift_minutes > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
                      {v.eta_drift_minutes > 0 ? `+${v.eta_drift_minutes}m` : '—'}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono" style={{ color: v.safety_score >= 85 ? '#34d399' : v.safety_score >= 70 ? '#fbbf24' : '#f87171' }}>
                      {v.safety_score}
                    </td>
                    <td className="py-2.5 text-right font-mono" style={{ color: v.maintenance_risk > 40 ? '#f87171' : v.maintenance_risk > 20 ? '#fbbf24' : 'var(--text-muted)' }}>
                      {v.maintenance_risk}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row: Incidents + AI Decisions */}
      <div className="grid grid-cols-12 gap-5">
        {/* Incidents */}
        <div className="col-span-5 card" style={{ maxHeight: '420px', overflow: 'hidden' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white">Active Incidents</p>
            <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: 'rgba(248, 113, 113, 0.12)', color: '#f87171' }}>
              {incidents.filter(i => !i.resolved).length} active
            </span>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1">
            {incidents.length === 0 && (
              <p className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>No incidents — fleet operating normally</p>
            )}
            {incidents.map(inc => {
              const sev = SEVERITY_STYLES[inc.severity] || SEVERITY_STYLES.low;
              return (
                <div key={inc.incident_id} className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: sev.bg, color: sev.text }}>
                      {inc.severity.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: '#fb923c' }}>{inc.vehicle_id}</span>
                    <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>{timeAgo(inc.timestamp)}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{inc.message}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Agent Decisions */}
        <div className="col-span-7 card" style={{ maxHeight: '420px', overflow: 'hidden' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white">AI Agent Decisions</p>
            <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: 'rgba(251, 146, 60, 0.12)', color: '#fb923c' }}>
              {decisions.filter(d => d.status === 'pending').length} pending
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
            {decisions.length === 0 && (
              <p className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>No agent decisions yet — start the demo scenario</p>
            )}
            {decisions.map(dec => {
              const agent = AGENT_LABELS[dec.agent_type] || { label: dec.agent_type, color: '#8888a4' };
              const sev = SEVERITY_STYLES[dec.severity] || SEVERITY_STYLES.low;
              return (
                <div key={dec.decision_id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${agent.color}18`, color: agent.color }}>
                      {agent.label} Agent
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: sev.bg, color: sev.text }}>
                      {dec.severity.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: '#fb923c' }}>{dec.vehicle_id}</span>
                    <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>{timeAgo(dec.timestamp)}</span>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>{dec.reason}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>
                        {dec.recommended_action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {Math.round(dec.confidence * 100)}% confidence
                      </span>
                    </div>
                    {dec.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button type="button" className="text-[10px] px-2.5 py-1 rounded-lg font-semibold"
                          style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399' }}
                          onClick={() => fetch(`${api.baseUrl}/api/fleet/agents/${dec.decision_id}/action`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'approved' })
                          })}>
                          Approve
                        </button>
                        <button type="button" className="text-[10px] px-2.5 py-1 rounded-lg font-semibold"
                          style={{ background: 'rgba(100, 100, 130, 0.12)', color: '#8888a4' }}
                          onClick={() => fetch(`${api.baseUrl}/api/fleet/agents/${dec.decision_id}/action`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'dismissed' })
                          })}>
                          Dismiss
                        </button>
                      </div>
                    )}
                    {dec.status !== 'pending' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: dec.status === 'approved' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(100, 100, 130, 0.12)',
                          color: dec.status === 'approved' ? '#34d399' : '#8888a4' }}>
                        {dec.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card">
      <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  );
}
