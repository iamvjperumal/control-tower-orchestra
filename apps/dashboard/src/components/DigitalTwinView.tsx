import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useSSE } from '../hooks/useSSE';
import { BaseEvent, AIRecommendationCreated, Customer360 } from '../types';

interface SignalCard {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

function scoreColor(score: number): string {
  if (score >= 60) return '#f87171';
  if (score >= 30) return '#fbbf24';
  return '#34d399';
}

function healthScore(riskScore: number): number {
  return Math.max(0, 100 - riskScore);
}

function healthLabel(score: number): string {
  if (score >= 80) return 'Healthy';
  if (score >= 50) return 'At Risk';
  if (score >= 20) return 'Critical';
  return 'Emergency';
}

function healthColor(score: number): string {
  if (score >= 80) return '#34d399';
  if (score >= 50) return '#fbbf24';
  if (score >= 20) return '#fb923c';
  return '#f87171';
}

export function DigitalTwinView() {
  const [customers, setCustomers] = useState<Customer360[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [customer, setCustomer] = useState<Customer360 | null>(null);
  const [timeline, setTimeline] = useState<BaseEvent[]>([]);
  const { events: liveEvents } = useSSE<BaseEvent>(api.sseEventsUrl, 'event');
  const { events: liveRecs } = useSSE<AIRecommendationCreated>(api.sseRecommendationsUrl, 'recommendation');

  useEffect(() => {
    api.fetchCustomers().then(data => {
      setCustomers(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].customer_id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api.fetchCustomer(selectedId).then(setCustomer).catch(() => {});
    api.fetchCustomerTimeline(selectedId).then(setTimeline).catch(() => {});
  }, [selectedId]);

  // Update on live events
  useEffect(() => {
    if (!selectedId) return;
    const relevant = liveEvents.filter(e => e.customer_id === selectedId);
    if (relevant.length > 0) {
      api.fetchCustomer(selectedId).then(setCustomer).catch(() => {});
      api.fetchCustomerTimeline(selectedId).then(setTimeline).catch(() => {});
    }
  }, [liveEvents, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const relevant = liveRecs.filter(r => r.customer_id === selectedId);
    if (relevant.length > 0) {
      api.fetchCustomer(selectedId).then(setCustomer).catch(() => {});
    }
  }, [liveRecs, selectedId]);

  const riskScore = customer?.current_risk_score || 0;
  const health = healthScore(riskScore);
  const latestRec = customer?.active_recommendations[0];

  const signals: SignalCard[] = [
    { label: 'Payment Risk', value: Math.min(100, riskScore > 30 ? 70 : riskScore), maxValue: 100, color: '#f87171', trend: riskScore > 30 ? 'up' : 'stable', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    { label: 'Shipment Risk', value: Math.min(100, timeline.filter(e => e.event_type === 'shipment-delayed').length * 30), maxValue: 100, color: '#c084fc', trend: timeline.some(e => e.event_type === 'shipment-delayed') ? 'up' : 'stable', icon: 'M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1' },
    { label: 'Support Risk', value: Math.min(100, timeline.filter(e => e.event_type === 'support-ticket-updated').length * 25), maxValue: 100, color: '#fbbf24', trend: timeline.some(e => (e as any).sentiment === 'negative') ? 'up' : 'stable', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
    { label: 'Fraud Risk', value: Math.min(100, timeline.filter(e => e.event_type === 'payment-failed').length * 35), maxValue: 100, color: '#fb923c', trend: riskScore >= 60 ? 'up' : 'stable', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { label: 'Churn Risk', value: Math.min(100, riskScore > 50 ? 60 : riskScore > 20 ? 30 : 10), maxValue: 100, color: '#38bdf8', trend: riskScore > 50 ? 'up' : 'stable', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1' },
  ];

  return (
    <div className="space-y-5">
      {/* Customer selector */}
      <div className="card-gradient">
        <div className="relative z-[1]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Digital Twin</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Live customer state visualization with real-time signal tracking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Real-time</span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {customers.map(c => (
              <button key={c.customer_id} onClick={() => setSelectedId(c.customer_id)}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl text-left transition-all"
                style={selectedId === c.customer_id
                  ? { background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)' }
                }>
                <p className="text-xs font-mono font-bold text-white">{c.customer_id}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                    background: c.tier === 'vip' ? 'rgba(251,191,36,0.12)' : c.tier === 'premium' ? 'rgba(139,92,246,0.12)' : 'rgba(100,100,130,0.12)',
                    color: c.tier === 'vip' ? '#fbbf24' : c.tier === 'premium' ? '#a78bfa' : '#8888a4',
                  }}>{c.tier.toUpperCase()}</span>
                  {c.current_risk_score > 0 && (
                    <span className="text-[9px] font-bold" style={{ color: scoreColor(c.current_risk_score) }}>
                      {c.current_risk_score}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {customer && (
        <>
          {/* Hero twin state */}
          <div className="grid grid-cols-12 gap-5">
            {/* Health orb */}
            <div className="col-span-4 card flex flex-col items-center justify-center py-8">
              <div className="relative">
                <svg viewBox="0 0 120 120" className="w-36 h-36">
                  <defs>
                    <radialGradient id="twin-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={healthColor(health)} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={healthColor(health)} stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="60" cy="60" r="55" fill="url(#twin-glow)" />
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#1e1e36" strokeWidth="4" />
                  <circle cx="60" cy="60" r="48" fill="none" stroke={healthColor(health)} strokeWidth="4"
                    strokeDasharray={`${(health / 100) * 301.59} 301.59`}
                    strokeLinecap="round" transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.8s ease' }} />
                  <text x="60" y="56" textAnchor="middle" fill={healthColor(health)} fontSize="28" fontWeight="800">{health}</text>
                  <text x="60" y="72" textAnchor="middle" fill="#55556a" fontSize="10">{healthLabel(health)}</text>
                </svg>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-3 py-1 rounded-full"
                  style={{ background: `${healthColor(health)}15`, color: healthColor(health), border: `1px solid ${healthColor(health)}30` }}>
                  Health Score
                </div>
              </div>
            </div>

            {/* Customer info */}
            <div className="col-span-4 card">
              <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Twin State</p>
              <div className="space-y-3">
                <InfoRow label="Customer ID" value={customer.customer_id} mono />
                <InfoRow label="Tier" value={customer.tier.toUpperCase()} color={customer.tier === 'vip' ? '#fbbf24' : customer.tier === 'premium' ? '#a78bfa' : '#8888a4'} />
                <InfoRow label="Risk Score" value={riskScore.toString()} color={scoreColor(riskScore)} />
                <InfoRow label="Lifetime Value" value={`$${customer.lifetime_value.toLocaleString()}`} />
                <InfoRow label="Region" value={customer.region} />
                <InfoRow label="Account Age" value={`${customer.account_age_days} days`} />
                <InfoRow label="Status" value={riskScore >= 60 ? 'ALERT' : riskScore >= 30 ? 'WATCH' : 'NORMAL'} color={scoreColor(riskScore)} />
              </div>
            </div>

            {/* Current recommendation */}
            <div className="col-span-4 card">
              <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Active Decision</p>
              {latestRec ? (
                <div className="space-y-3">
                  <div className="text-center py-3 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <p className="text-xs font-bold" style={{ color: '#a78bfa' }}>{latestRec.action.replace(/_/g, ' ')}</p>
                    <p className="text-2xl font-bold text-white mt-1">{Math.round(latestRec.confidence * 100)}%</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>confidence</p>
                  </div>
                  <div className="space-y-1.5">
                    {latestRec.reason.map((r, i) => (
                      <p key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--purple-light)' }}>›</span> {r}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active recommendation</p>
                </div>
              )}
            </div>
          </div>

          {/* Signal cards */}
          <div className="grid grid-cols-5 gap-4">
            {signals.map(signal => (
              <div key={signal.label} className="card relative overflow-hidden">
                {signal.value > 50 && (
                  <div className="absolute inset-0 animate-pulse" style={{ background: `${signal.color}08` }} />
                )}
                <div className="relative z-[1]">
                  <div className="flex items-center justify-between mb-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={signal.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={signal.icon} />
                    </svg>
                    <span className="text-[10px]" style={{ color: signal.trend === 'up' ? '#f87171' : signal.trend === 'down' ? '#34d399' : 'var(--text-muted)' }}>
                      {signal.trend === 'up' ? '▲' : signal.trend === 'down' ? '▼' : '—'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{signal.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: signal.value > 50 ? signal.color : 'white' }}>{signal.value}%</p>
                  <div className="mt-2 h-1.5 rounded-full" style={{ background: '#1e1e36' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${signal.value}%`,
                      background: `linear-gradient(90deg, ${signal.color}80, ${signal.color})`,
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Predictions + Timeline */}
          <div className="grid grid-cols-12 gap-5">
            {/* Predictions */}
            <div className="col-span-4 card">
              <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Predictions</p>
              <div className="space-y-4">
                <PredictionRow label="Churn Probability" value={Math.min(95, riskScore > 50 ? riskScore + 15 : riskScore)} color="#38bdf8" />
                <PredictionRow label="Fraud Probability" value={Math.min(95, timeline.filter(e => e.event_type === 'payment-failed').length * 25)} color="#f87171" />
                <PredictionRow label="Escalation Likelihood" value={riskScore >= 60 ? 85 : riskScore >= 30 ? 45 : 10} color="#fbbf24" />
              </div>
              <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--purple-light)' }}>Next Best Action</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {riskScore >= 60 ? 'Immediate human intervention recommended' : riskScore >= 30 ? 'Proactive outreach suggested' : 'Continue monitoring'}
                </p>
              </div>
            </div>

            {/* Event timeline */}
            <div className="col-span-8 card" style={{ maxHeight: '400px', overflow: 'hidden' }}>
              <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Event History</p>
              <div className="relative pl-6 space-y-3 overflow-y-auto max-h-[340px] pr-2">
                <div className="absolute left-2 top-0 bottom-0 w-px" style={{ background: 'var(--border-card)' }} />
                {timeline.length === 0 && (
                  <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No events recorded</p>
                )}
                {timeline.map(event => {
                  const typeColors: Record<string, string> = {
                    'order-created': '#818cf8',
                    'payment-failed': '#f87171',
                    'support-ticket-updated': '#fbbf24',
                    'shipment-delayed': '#c084fc',
                    'customer-profile-updated': '#34d399',
                  };
                  const color = typeColors[event.event_type] || '#8888a4';
                  return (
                    <div key={event.event_id} className="relative">
                      <div className="absolute -left-4 top-2 w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}44` }} />
                      <div className="ml-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold" style={{ color }}>{event.event_type}</span>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            {new Date(event.event_time).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`} style={{ color: color || 'white' }}>{value}</span>
    </div>
  );
}

function PredictionRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: '#1e1e36' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${color}60, ${color})`,
        }} />
      </div>
    </div>
  );
}
