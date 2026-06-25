import { AIRecommendationCreated } from '../types';
import { ActionButtons } from './ActionButtons';

const ACTION_STYLES: Record<string, { bg: string; text: string }> = {
  ESCALATE_FRAUD_REVIEW: { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171' },
  VIP_RETENTION: { bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa' },
  REFUND_APPROVE: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24' },
  MONITOR: { bg: 'rgba(56, 189, 248, 0.12)', text: '#38bdf8' },
  NO_ACTION: { bg: 'rgba(100, 100, 130, 0.12)', text: '#8888a4' },
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  CRITICAL: { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171' },
  HIGH: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' },
  MEDIUM: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8' },
  LOW: { bg: 'rgba(100, 100, 130, 0.15)', text: '#8888a4' },
};

function scoreColor(score: number): string {
  if (score >= 60) return '#f87171';
  if (score >= 30) return '#fbbf24';
  return '#34d399';
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function RecommendationCard({ rec }: { rec: AIRecommendationCreated }) {
  const actionStyle = ACTION_STYLES[rec.action] || ACTION_STYLES.NO_ACTION;
  const priorityStyle = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.LOW;
  const riskColor = scoreColor(rec.risk_score);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-mono font-bold text-white">{rec.customer_id}</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: priorityStyle.bg, color: priorityStyle.text }}>
              {rec.priority}
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: actionStyle.bg, color: actionStyle.text }}>
            {rec.action.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: riskColor }}>{rec.risk_score}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>risk score</div>
        </div>
      </div>

      <div className="space-y-1.5 my-3">
        {rec.reason.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--purple-light)' }}>›</span>
            <span>{r}</span>
          </div>
        ))}
      </div>

      <div className="progress-bar mb-3">
        <div className="progress-bar-fill" style={{ width: `${rec.confidence * 100}%` }} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span>Confidence: <span className="text-white font-semibold">{Math.round(rec.confidence * 100)}%</span></span>
          <span>Latency: <span className="text-white font-semibold">{rec.latency_ms}ms</span></span>
        </div>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{timeAgo(rec.event_time)}</span>
      </div>

      <ActionButtons recommendationId={rec.event_id} />
    </div>
  );
}
