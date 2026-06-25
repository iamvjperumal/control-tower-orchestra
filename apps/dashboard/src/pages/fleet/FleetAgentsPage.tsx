import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';

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

const AGENT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  delay_agent: {
    label: 'Delay Agent',
    color: '#fbbf24',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  coldchain_agent: {
    label: 'Cold Chain Agent',
    color: '#38bdf8',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 14.76V3.5a2.5 2.5 0 1 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      </svg>
    ),
  },
  safety_agent: {
    label: 'Safety Agent',
    color: '#fb923c',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  maintenance_agent: {
    label: 'Maintenance Agent',
    color: '#c084fc',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
};

const AGENT_TYPES = Object.keys(AGENT_CONFIG);

const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: 'rgba(136, 136, 164, 0.12)', text: '#8888a4' },
  medium: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24' },
  high: { bg: 'rgba(251, 146, 60, 0.12)', text: '#fb923c' },
  critical: { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24' },
  approved: { bg: 'rgba(52, 211, 153, 0.12)', text: '#34d399' },
  executed: { bg: 'rgba(56, 189, 248, 0.12)', text: '#38bdf8' },
  dismissed: { bg: 'rgba(100, 100, 130, 0.12)', text: '#8888a4' },
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function computeAgentStats(decisions: AgentDecision[]) {
  const stats: Record<string, { total: number; pending: number; approved: number; dismissed: number }> = {};
  for (const agentType of AGENT_TYPES) {
    stats[agentType] = { total: 0, pending: 0, approved: 0, dismissed: 0 };
  }
  for (const d of decisions) {
    if (!stats[d.agent_type]) {
      stats[d.agent_type] = { total: 0, pending: 0, approved: 0, dismissed: 0 };
    }
    stats[d.agent_type].total++;
    if (d.status === 'pending') stats[d.agent_type].pending++;
    else if (d.status === 'approved' || d.status === 'executed') stats[d.agent_type].approved++;
    else if (d.status === 'dismissed') stats[d.agent_type].dismissed++;
  }
  return stats;
}

export function FleetAgentsPage() {
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Fetch initial decisions
    fetch(`${api.baseUrl}/api/fleet/agents`)
      .then(r => r.json())
      .then(data => setDecisions(data))
      .catch(() => {});

    // Connect to SSE for real-time updates
    const source = new EventSource(`${api.baseUrl}/api/fleet/events/stream`);
    sseRef.current = source;

    source.addEventListener('fleet-decision', (e: MessageEvent) => {
      const dec = JSON.parse(e.data) as AgentDecision;
      setDecisions(prev => {
        const exists = prev.findIndex(d => d.decision_id === dec.decision_id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = dec;
          return updated;
        }
        return [dec, ...prev];
      });
    });

    return () => source.close();
  }, []);

  const agentStats = computeAgentStats(decisions);

  const filtered = decisions.filter(d => {
    if (filterAgent !== 'all' && d.agent_type !== filterAgent) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  async function handleAction(decisionId: string, status: 'approved' | 'dismissed') {
    try {
      await fetch(`${api.baseUrl}/api/fleet/agents/${decisionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setDecisions(prev =>
        prev.map(d => (d.decision_id === decisionId ? { ...d, status } : d))
      );
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            AI Agents
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Monitor and manage autonomous fleet agent decisions
          </p>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '9999px',
            background: 'rgba(251, 146, 60, 0.12)',
            color: '#fb923c',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#fb923c',
              animation: 'pulse 2s infinite',
            }}
          />
          {decisions.filter(d => d.status === 'pending').length} pending decisions
        </span>
      </div>

      {/* Agent Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {AGENT_TYPES.map(agentType => {
          const config = AGENT_CONFIG[agentType];
          const stats = agentStats[agentType];
          return (
            <div
              key={agentType}
              className="card"
              style={{
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                border: filterAgent === agentType ? `1px solid ${config.color}40` : undefined,
                background: filterAgent === agentType ? `${config.color}08` : undefined,
              }}
              onClick={() => setFilterAgent(filterAgent === agentType ? 'all' : agentType)}
            >
              {/* Accent glow */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '80px',
                  height: '80px',
                  background: `radial-gradient(circle at top right, ${config.color}12, transparent)`,
                  pointerEvents: 'none',
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Icon and label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${config.color}15`,
                      color: config.color,
                    }}
                  >
                    {config.icon}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {config.label}
                  </span>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: config.color, margin: 0 }}>
                      {stats.total}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Decisions</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24', margin: 0 }}>
                      {stats.pending}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Pending</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#34d399', margin: 0 }}>
                      {stats.approved}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Resolved</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Controls */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 16px',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
          Filters
        </span>

        {/* Agent type filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[{ key: 'all', label: 'All Agents', color: '#fb923c' }, ...AGENT_TYPES.map(t => ({ key: t, label: AGENT_CONFIG[t].label, color: AGENT_CONFIG[t].color }))].map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilterAgent(opt.key)}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: filterAgent === opt.key ? `${opt.color}20` : 'rgba(255,255,255,0.03)',
                color: filterAgent === opt.key ? opt.color : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-card)' }} />

        {/* Status filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'all', label: 'All Status' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'dismissed', label: 'Dismissed' },
          ].map(opt => {
            const ss = opt.key === 'all' ? { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c' } : (STATUS_STYLES[opt.key] || STATUS_STYLES.pending);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFilterStatus(opt.key)}
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: filterStatus === opt.key ? ss.bg : 'rgba(255,255,255,0.03)',
                  color: filterStatus === opt.key ? ss.text : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
          {filtered.length} decision{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Decision Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 && (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '48px 16px' }}
          >
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              No agent decisions match the current filters
            </p>
          </div>
        )}

        {filtered.map(dec => {
          const agent = AGENT_CONFIG[dec.agent_type] || { label: dec.agent_type, color: '#8888a4', icon: null };
          const sev = SEVERITY_STYLES[dec.severity] || SEVERITY_STYLES.low;
          const sts = STATUS_STYLES[dec.status] || STATUS_STYLES.pending;

          return (
            <div
              key={dec.decision_id}
              className="card"
              style={{
                borderLeft: `3px solid ${agent.color}`,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Top row: badges and meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {/* Agent badge */}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: `${agent.color}18`,
                    color: agent.color,
                  }}
                >
                  {agent.label}
                </span>

                {/* Severity badge */}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: sev.bg,
                    color: sev.text,
                  }}
                >
                  {dec.severity.toUpperCase()}
                </span>

                {/* Vehicle ID */}
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: '#fb923c',
                  }}
                >
                  {dec.vehicle_id}
                </span>

                {/* Status badge */}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: sts.bg,
                    color: sts.text,
                    marginLeft: 'auto',
                  }}
                >
                  {dec.status.toUpperCase()}
                </span>

                {/* Timestamp */}
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {timeAgo(dec.timestamp)}
                </span>
              </div>

              {/* Reason */}
              <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                {dec.reason}
              </p>

              {/* Bottom row: action pill, confidence, action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Recommended action pill */}
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: 'rgba(251, 146, 60, 0.12)',
                      color: '#fb923c',
                      fontFamily: 'monospace',
                    }}
                  >
                    {dec.recommended_action.replace(/_/g, ' ')}
                  </span>

                  {/* Confidence */}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {Math.round(dec.confidence * 100)}% confidence
                  </span>
                </div>

                {/* Action buttons for pending */}
                {dec.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleAction(dec.decision_id, 'approved')}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'rgba(52, 211, 153, 0.12)',
                        color: '#34d399',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52, 211, 153, 0.25)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52, 211, 153, 0.12)';
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(dec.decision_id, 'dismissed')}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'rgba(100, 100, 130, 0.12)',
                        color: '#8888a4',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(100, 100, 130, 0.25)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(100, 100, 130, 0.12)';
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
