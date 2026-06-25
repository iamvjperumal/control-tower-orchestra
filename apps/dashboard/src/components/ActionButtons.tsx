import { useState } from 'react';
import { api } from '../api/client';

const ACTIONS = [
  { key: 'APPROVED', label: 'Approve', bg: 'rgba(52, 211, 153, 0.15)', hoverBg: 'rgba(52, 211, 153, 0.25)', text: '#34d399' },
  { key: 'REJECTED', label: 'Reject', bg: 'rgba(248, 113, 113, 0.15)', hoverBg: 'rgba(248, 113, 113, 0.25)', text: '#f87171' },
  { key: 'ESCALATED', label: 'Escalate', bg: 'rgba(251, 191, 36, 0.15)', hoverBg: 'rgba(251, 191, 36, 0.25)', text: '#fbbf24' },
  { key: 'DISMISSED', label: 'Dismiss', bg: 'rgba(100, 100, 130, 0.12)', hoverBg: 'rgba(100, 100, 130, 0.2)', text: '#8888a4' },
] as const;

export function ActionButtons({ recommendationId }: { recommendationId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [selected, setSelected] = useState('');

  async function handleAction(action: string) {
    setStatus('loading');
    setSelected(action);
    try {
      await api.submitAction({
        recommendation_id: recommendationId,
        action_taken: action,
        operator_id: 'demo-operator',
      });
      setStatus('done');
    } catch {
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: '#34d399' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Action: {selected}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {ACTIONS.map(({ key, label, bg, text }) => (
        <button key={key} onClick={() => handleAction(key)} disabled={status === 'loading'}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-40"
          style={{ background: bg, color: text, border: 'none' }}>
          {status === 'loading' && selected === key ? '...' : label}
        </button>
      ))}
    </div>
  );
}
