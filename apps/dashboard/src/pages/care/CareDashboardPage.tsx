import { useState } from 'react';

const ACCENT = '#34d399';
const ACCENT_BG = 'rgba(52, 211, 153, 0.10)';

const MOCK_EVENTS = [
  { id: 'e1', topic: 'care.vitals.raw', payload: { patient_id: 'pt-***4421', hr_bpm: 118, bp_sys: 148, spo2_pct: 93, flag: 'DETERIORATING' }, timestamp: new Date().toISOString() },
  { id: 'e2', topic: 'care.bed_events.raw', payload: { ward: 'ICU-B', beds_available: 1, beds_total: 12, capacity_pct: 92 }, timestamp: new Date(Date.now() - 18000).toISOString() },
  { id: 'e3', topic: 'care.lab_results.raw', payload: { patient_id: 'pt-***4421', test: 'TROPONIN', value: 0.08, flag: 'HIGH' }, timestamp: new Date(Date.now() - 35000).toISOString() },
  { id: 'e4', topic: 'care.risk.signals', payload: { patient_id: 'pt-***4421', score: 71, signals: ['vital_deterioration', 'lab_critical', 'icu_capacity'] }, timestamp: new Date(Date.now() - 52000).toISOString() },
];

const MOCK_RECOMMENDATIONS = [
  {
    id: 'r1',
    patient_id: 'pt-***4421',
    score: 71,
    action: 'ESCALATE_TO_RAPID_RESPONSE',
    reason: ['Heart rate 118 BPM and SpO2 93% indicate deterioration', 'Troponin elevated — cardiac event risk', 'ICU-B at 92% capacity — act before beds unavailable'],
    priority: 'CRITICAL',
    confidence: 0.89,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'r2',
    patient_id: 'pt-***8812',
    score: 58,
    action: 'REVIEW_DISCHARGE_READINESS',
    reason: ['Readmission risk model: 58 — borderline high', 'Last two vitals within normal range'],
    priority: 'MEDIUM',
    confidence: 0.73,
    timestamp: new Date(Date.now() - 150000).toISOString(),
  },
];

const WARDS = [
  { name: 'ICU-B', beds: 12, available: 1, pct: 92, color: '#f87171' },
  { name: 'Cardiology', beds: 24, available: 5, pct: 79, color: '#fbbf24' },
  { name: 'General Medicine', beds: 40, available: 12, pct: 70, color: ACCENT },
  { name: 'Surgical Recovery', beds: 18, available: 7, pct: 61, color: ACCENT },
];

export function CareDashboardPage() {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  return (
    <div className="p-6 space-y-6">
      {/* Engine badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit text-[11px] font-semibold"
        style={{ background: 'rgba(139, 92, 246, 0.10)', border: '1px solid rgba(139, 92, 246, 0.25)', color: '#a78bfa' }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#a78bfa' }} />
        Powered by Confluent Backbone · IBM watsonx Decision Engine · HIPAA-Governed Streams
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'High-Risk Patients', value: '2', delta: 'Escalation pending', color: '#f87171' },
          { label: 'ICU Capacity', value: '92%', delta: '1 bed remaining', color: ACCENT },
          { label: 'Avg Readmission Risk', value: '34', delta: 'Moderate', color: '#fbbf24' },
          { label: 'Discharges Today', value: '7', delta: 'Processed', color: '#38bdf8' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
            <p className="text-3xl font-bold" style={{ color: m.color, fontFamily: 'var(--font-heading)' }}>{m.value}</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{m.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Ward capacity */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Ward Capacity</h3>
          <div className="space-y-3">
            {WARDS.map((w) => (
              <div key={w.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{w.name}</span>
                  <span className="font-semibold" style={{ color: w.color }}>{w.available} beds free · {w.pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-card)' }}>
                  <div className="h-full rounded-full" style={{ width: `${w.pct}%`, background: w.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live event feed */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Live Clinical Events</h3>
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
        <h3 className="text-sm font-bold text-white mb-4">Clinical AI Recommendations</h3>
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
                  {acknowledged.has(rec.id) ? 'Acknowledged' : 'Escalate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
