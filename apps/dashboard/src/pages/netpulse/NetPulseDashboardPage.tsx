import { useState } from 'react';

const ACCENT = '#38bdf8';
const ACCENT_BG = 'rgba(56, 189, 248, 0.10)';

const MOCK_EVENTS = [
  { id: 'e1', topic: 'netpulse.device_telemetry.raw', payload: { device_id: 'RTR-***092', packet_loss_pct: 7.2, latency_ms: 240, utilization_pct: 94 }, timestamp: new Date().toISOString() },
  { id: 'e2', topic: 'netpulse.sla_events.raw', payload: { device_id: 'RTR-***092', sla_id: 'ENT-4421', breach_risk: 'HIGH', remaining_budget_ms: 120 }, timestamp: new Date(Date.now() - 14000).toISOString() },
  { id: 'e3', topic: 'netpulse.capacity_metrics.raw', payload: { device_id: 'RTR-***092', capacity_pct: 94, trend: 'RISING_FAST' }, timestamp: new Date(Date.now() - 28000).toISOString() },
  { id: 'e4', topic: 'netpulse.anomaly.signals', payload: { device_id: 'RTR-***092', score: 82, signals: ['packet_loss', 'sla_breach_risk', 'capacity_saturation'] }, timestamp: new Date(Date.now() - 42000).toISOString() },
];

const MOCK_RECOMMENDATIONS = [
  {
    id: 'r1',
    device_id: 'RTR-***092',
    score: 82,
    action: 'REROUTE_TRAFFIC_FAILOVER',
    reason: ['Packet loss 7.2% exceeds 5% alert threshold', 'Latency 240ms approaching SLA limit for ENT-4421', 'Utilization at 94% with rising trend — saturation imminent'],
    priority: 'HIGH',
    confidence: 0.88,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'r2',
    device_id: 'SW-***441',
    score: 54,
    action: 'MONITOR_AND_ALERT_ONCALL',
    reason: ['Capacity at 81% — approaching warning threshold', 'No SLA customers at risk currently'],
    priority: 'MEDIUM',
    confidence: 0.74,
    timestamp: new Date(Date.now() - 110000).toISOString(),
  },
];

const DEVICES = [
  { id: 'RTR-***092', name: 'Core Router 92', latency: 240, loss: 7.2, util: 94, status: 'critical' },
  { id: 'SW-***441', name: 'Dist Switch 441', latency: 18, loss: 0.2, util: 81, status: 'warning' },
  { id: 'RTR-***017', name: 'Edge Router 17', latency: 12, loss: 0.0, util: 55, status: 'ok' },
  { id: 'FW-***003', name: 'Firewall Cluster', latency: 8, loss: 0.0, util: 42, status: 'ok' },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Critical' },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Warning' },
  ok: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'OK' },
};

export function NetPulseDashboardPage() {
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
          { label: 'Active Incidents', value: '1', delta: 'RTR-092 critical', color: '#f87171' },
          { label: 'SLA At Risk', value: '2', delta: 'Enterprise contracts', color: ACCENT },
          { label: 'Avg Latency', value: '70ms', delta: 'Fleet average', color: '#34d399' },
          { label: 'Capacity Alerts', value: '1', delta: 'Above 90%', color: '#fbbf24' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
            <p className="text-3xl font-bold" style={{ color: m.color, fontFamily: 'var(--font-heading)' }}>{m.value}</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{m.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Device health */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Device Health</h3>
          <div className="space-y-2">
            {DEVICES.map((d) => {
              const s = STATUS_STYLE[d.status];
              return (
                <div key={d.id} className="rounded-lg p-3 flex items-center justify-between"
                  style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-card)' }}>
                  <div>
                    <p className="text-xs font-semibold text-white">{d.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.latency}ms · {d.loss}% loss · {d.util}% util</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
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
        <h3 className="text-sm font-bold text-white mb-4">AI Incident Recommendations</h3>
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
                  {acknowledged.has(rec.id) ? 'Acknowledged' : 'Remediate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
