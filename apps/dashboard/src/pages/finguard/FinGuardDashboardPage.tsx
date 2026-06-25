import { useState } from 'react';

const ACCENT = '#f59e0b';
const ACCENT_BG = 'rgba(245, 158, 11, 0.10)';

const MOCK_EVENTS = [
  { id: 'e1', topic: 'finguard.transactions.raw', payload: { account_id: 'acct-***1042', amount: 4850, currency: 'USD', merchant: 'Online Transfer' }, timestamp: new Date().toISOString() },
  { id: 'e2', topic: 'finguard.aml_events.raw', payload: { account_id: 'acct-***1042', flag_type: 'VELOCITY_BREACH', tx_count_10m: 7 }, timestamp: new Date(Date.now() - 12000).toISOString() },
  { id: 'e3', topic: 'finguard.payment_risk.raw', payload: { account_id: 'acct-***1042', risk_score: 82, reason: 'UNUSUAL_GEO' }, timestamp: new Date(Date.now() - 28000).toISOString() },
  { id: 'e4', topic: 'finguard.fraud.signals', payload: { account_id: 'acct-***1042', score: 88, signals: ['velocity', 'aml_flag', 'geo_anomaly'] }, timestamp: new Date(Date.now() - 45000).toISOString() },
];

const MOCK_RECOMMENDATIONS = [
  {
    id: 'r1',
    customer_id: 'acct-***1042',
    score: 88,
    action: 'FREEZE_ACCOUNT_PENDING_REVIEW',
    reason: ['7 transactions in 10 minutes exceeds velocity threshold', 'AML flag triggered by beneficiary pattern', 'Geographic anomaly: login from new region'],
    priority: 'CRITICAL',
    confidence: 0.91,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'r2',
    customer_id: 'acct-***7731',
    score: 65,
    action: 'ESCALATE_COMPLIANCE_REVIEW',
    reason: ['Payment risk score elevated at 65', 'Second suspicious transaction this week'],
    priority: 'HIGH',
    confidence: 0.78,
    timestamp: new Date(Date.now() - 90000).toISOString(),
  },
];

const SIGNAL_WEIGHTS = [
  { label: 'Transaction Velocity', weight: 35, value: 35, color: '#f87171' },
  { label: 'AML Flag', weight: 30, value: 30, color: '#fb923c' },
  { label: 'Payment Risk Score', weight: 25, value: 20, color: '#fbbf24' },
  { label: 'Account Age', weight: 10, value: 3, color: '#34d399' },
];

export function FinGuardDashboardPage() {
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
          { label: 'Active Alerts', value: '2', delta: '+1 in last 10m', color: '#f87171' },
          { label: 'Avg Risk Score', value: '76', delta: 'Elevated', color: ACCENT },
          { label: 'Transactions/min', value: '284', delta: 'Normal volume', color: '#34d399' },
          { label: 'Cases Opened', value: '5', delta: 'Today', color: '#38bdf8' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
            <p className="text-3xl font-bold" style={{ color: m.color, fontFamily: 'var(--font-heading)' }}>{m.value}</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{m.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Signal weights */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Risk Signal Weights</h3>
          <div className="space-y-3">
            {SIGNAL_WEIGHTS.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span className="font-semibold" style={{ color: s.color }}>{s.value}/{s.weight}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-card)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(s.value / s.weight) * 100}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-card)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Combined Risk Score</span>
            <span className="text-2xl font-bold" style={{ color: ACCENT, fontFamily: 'var(--font-heading)' }}>88</span>
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
        <h3 className="text-sm font-bold text-white mb-4">AI Recommendations</h3>
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
                  {acknowledged.has(rec.id) ? 'Acknowledged' : 'Acknowledge'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
