import { useState } from 'react';

const ACCENT = '#f97316';
const ACCENT_BG = 'rgba(249, 115, 22, 0.10)';

const MOCK_EVENTS = [
  { id: 'e1', topic: 'factory.oee_telemetry.raw', payload: { machine_id: 'CNC-007', oee_pct: 58, availability: 0.72, performance: 0.81 }, timestamp: new Date().toISOString() },
  { id: 'e2', topic: 'factory.sensor_events.raw', payload: { machine_id: 'CNC-007', vibration_g: 3.1, temp_c: 94, event: 'VIBRATION_ALERT' }, timestamp: new Date(Date.now() - 15000).toISOString() },
  { id: 'e3', topic: 'factory.quality_defects.raw', payload: { machine_id: 'CNC-007', defect_rate_pct: 4.2, parts_inspected: 240 }, timestamp: new Date(Date.now() - 32000).toISOString() },
  { id: 'e4', topic: 'factory.downtime.signals', payload: { machine_id: 'CNC-007', risk_score: 74, signals: ['oee_degradation', 'vibration_alert', 'defect_spike'] }, timestamp: new Date(Date.now() - 50000).toISOString() },
];

const MOCK_RECOMMENDATIONS = [
  {
    id: 'r1',
    machine_id: 'CNC-007',
    score: 74,
    action: 'SCHEDULE_PREVENTIVE_MAINTENANCE',
    reason: ['OEE dropped to 58% — below 60% critical threshold', 'Vibration reading 3.1G exceeds 2.5G alert level', 'Quality defect rate at 4.2% — above 3% target'],
    priority: 'HIGH',
    confidence: 0.87,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'r2',
    machine_id: 'PRESS-002',
    score: 51,
    action: 'INSPECT_AND_MONITOR',
    reason: ['OEE trending down over last 4 hours', 'Temperature elevation noted'],
    priority: 'MEDIUM',
    confidence: 0.71,
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
];

const MACHINES = [
  { id: 'CNC-007', name: 'CNC Mill #7', oee: 58, status: 'alert', temp: 94 },
  { id: 'PRESS-002', name: 'Hydraulic Press #2', oee: 71, status: 'warning', temp: 78 },
  { id: 'LATHE-001', name: 'CNC Lathe #1', oee: 84, status: 'ok', temp: 62 },
  { id: 'WELD-003', name: 'Weld Station #3', oee: 91, status: 'ok', temp: 55 },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  alert: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Alert' },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Warning' },
  ok: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'OK' },
};

export function FactoryDashboardPage() {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  return (
    <div className="p-6 space-y-6">
      {/* Engine badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit text-[11px] font-semibold"
        style={{ background: 'rgba(139, 92, 246, 0.10)', border: '1px solid rgba(139, 92, 246, 0.25)', color: '#a78bfa' }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#a78bfa' }} />
        Powered by Confluent Backbone · IBM watsonx Decision Engine · Stream Governance
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Fleet OEE Avg', value: '76%', delta: '2% below target', color: ACCENT },
          { label: 'Alerts Active', value: '1', delta: 'CNC-007', color: '#f87171' },
          { label: 'Parts/Hour', value: '1,240', delta: 'On target', color: '#34d399' },
          { label: 'Work Orders', value: '3', delta: 'Pending', color: '#38bdf8' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
            <p className="text-3xl font-bold" style={{ color: m.color, fontFamily: 'var(--font-heading)' }}>{m.value}</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{m.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Machine status */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Production Line Status</h3>
          <div className="space-y-2">
            {MACHINES.map((m) => {
              const s = STATUS_STYLE[m.status];
              return (
                <div key={m.id} className="rounded-lg p-3 flex items-center justify-between"
                  style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-card)' }}>
                  <div>
                    <p className="text-xs font-semibold text-white">{m.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.id} · {m.temp}°C</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-right font-bold" style={{ color: m.oee < 65 ? '#f87171' : m.oee < 80 ? '#fbbf24' : '#34d399' }}>{m.oee}%</p>
                      <p className="text-[9px] text-right" style={{ color: 'var(--text-muted)' }}>OEE</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live event feed */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Live Event Stream</h3>
          <div className="space-y-2">
            {MOCK_EVENTS.map((ev) => (
              <div key={ev.id} className="rounded-lg p-3 text-xs" style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-card)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold px-1.5 py-0.5 rounded-md text-[10px]"
                    style={{ background: ACCENT_BG, color: ACCENT }}>{ev.topic}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="font-mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {JSON.stringify(ev.payload).slice(0, 80)}…
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
        <h3 className="text-sm font-bold text-white mb-4">AI Maintenance Recommendations</h3>
        <div className="space-y-3">
          {MOCK_RECOMMENDATIONS.map((rec) => (
            <div key={rec.id} className="rounded-xl p-4" style={{ background: 'var(--bg-sidebar)', border: `1px solid ${ACCENT}30` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: ACCENT_BG, color: ACCENT }}>
                      {rec.priority}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{rec.action}</span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>Score: {rec.score} · {Math.round(rec.confidence * 100)}% confidence</span>
                  </div>
                  <ul className="space-y-1">
                    {rec.reason.map((r, i) => (
                      <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: ACCENT }}>›</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => setAcknowledged(prev => new Set([...prev, rec.id]))}
                  disabled={acknowledged.has(rec.id)}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0 disabled:opacity-40"
                  style={{ background: ACCENT_BG, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                  {acknowledged.has(rec.id) ? 'Acknowledged' : 'Create Work Order'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
