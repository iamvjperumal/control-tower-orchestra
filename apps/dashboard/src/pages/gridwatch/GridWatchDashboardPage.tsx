import { useState } from 'react';

const ACCENT = '#facc15';
const ACCENT_BG = 'rgba(250, 204, 21, 0.10)';

const MOCK_EVENTS = [
  { id: 'e1', topic: 'gridwatch.demand_telemetry.raw', payload: { grid_node_id: 'NODE-TX-08', demand_mw: 4820, capacity_mw: 4200, overload_pct: 115 }, timestamp: new Date().toISOString() },
  { id: 'e2', topic: 'gridwatch.grid_events.raw', payload: { grid_node_id: 'NODE-TX-08', event: 'FREQUENCY_DEVIATION', hz: 59.4, delta: -0.6 }, timestamp: new Date(Date.now() - 16000).toISOString() },
  { id: 'e3', topic: 'gridwatch.load_metrics.raw', payload: { grid_node_id: 'NODE-TX-08', load_pct: 115, reserve_mw: 0, status: 'OVERLOADED' }, timestamp: new Date(Date.now() - 30000).toISOString() },
  { id: 'e4', topic: 'gridwatch.demand_spike.signals', payload: { grid_node_id: 'NODE-TX-08', score: 91, signals: ['demand_spike', 'frequency_deviation', 'zero_reserve'] }, timestamp: new Date(Date.now() - 48000).toISOString() },
];

const MOCK_RECOMMENDATIONS = [
  {
    id: 'r1',
    node_id: 'NODE-TX-08',
    score: 91,
    action: 'ACTIVATE_DEMAND_RESPONSE',
    reason: ['Demand 4820 MW exceeds capacity by 15% — immediate relief needed', 'Frequency deviation -0.6Hz signals instability', 'Zero reserve margin — no buffer for additional load'],
    priority: 'CRITICAL',
    confidence: 0.93,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'r2',
    node_id: 'NODE-CA-22',
    score: 62,
    action: 'PREPARE_LOAD_SHEDDING_PLAN',
    reason: ['Peak demand forecast in next 90 minutes', 'Solar generation declining as cloud cover increases'],
    priority: 'HIGH',
    confidence: 0.80,
    timestamp: new Date(Date.now() - 180000).toISOString(),
  },
];

const NODES = [
  { id: 'NODE-TX-08', name: 'Texas Grid Node 08', load: 115, reserve: 0, status: 'critical' },
  { id: 'NODE-CA-22', name: 'California Node 22', load: 88, reserve: 340, status: 'warning' },
  { id: 'NODE-NY-14', name: 'New York Node 14', load: 71, reserve: 820, status: 'ok' },
  { id: 'NODE-FL-05', name: 'Florida Node 05', load: 64, reserve: 1100, status: 'ok' },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Overloaded' },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Warning' },
  ok: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'Stable' },
};

export function GridWatchDashboardPage() {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  return (
    <div className="p-6 space-y-6">
      {/* Engine badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit text-[11px] font-semibold"
        style={{ background: 'rgba(139, 92, 246, 0.10)', border: '1px solid rgba(139, 92, 246, 0.25)', color: '#a78bfa' }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#a78bfa' }} />
        Powered by Confluent Backbone · IBM watsonx Decision Engine · Regulatory Audit Streams
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Grid Alerts', value: '1', delta: 'TX-08 overloaded', color: '#f87171' },
          { label: 'Peak Demand', value: '4,820 MW', delta: 'NODE-TX-08', color: ACCENT },
          { label: 'Grid Frequency', value: '59.4 Hz', delta: '-0.6 Hz deviation', color: '#fb923c' },
          { label: 'Reserve Margin', value: '0 MW', delta: 'Texas node zero', color: '#f87171' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
            <p className="text-2xl font-bold" style={{ color: m.color, fontFamily: 'var(--font-heading)' }}>{m.value}</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{m.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Node status */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Grid Node Status</h3>
          <div className="space-y-3">
            {NODES.map((n) => {
              const s = STATUS_STYLE[n.status];
              return (
                <div key={n.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-xs font-semibold text-white">{n.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Reserve: {n.reserve} MW</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: s.color }}>{n.load}%</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-card)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(n.load, 100)}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live event feed */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Live Grid Events</h3>
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
        <h3 className="text-sm font-bold text-white mb-4">AI Grid Dispatch Recommendations</h3>
        <div className="space-y-3">
          {MOCK_RECOMMENDATIONS.map((rec) => (
            <div key={rec.id} className="rounded-xl p-4" style={{ background: 'var(--bg-sidebar)', border: `1px solid ${rec.priority === 'CRITICAL' ? '#f8717140' : ACCENT + '40'}` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: rec.priority === 'CRITICAL' ? 'rgba(248,113,113,0.12)' : ACCENT_BG, color: rec.priority === 'CRITICAL' ? '#f87171' : ACCENT }}>
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
                  {acknowledged.has(rec.id) ? 'Dispatched' : 'Dispatch'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
