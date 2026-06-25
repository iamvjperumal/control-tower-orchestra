import { BaseEvent } from '../types';

const EVENT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'order-created': { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8', label: 'Order' },
  'payment-failed': { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171', label: 'Payment' },
  'support-ticket-updated': { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24', label: 'Support' },
  'shipment-delayed': { bg: 'rgba(192, 132, 252, 0.12)', text: '#c084fc', label: 'Shipment' },
  'customer-profile-updated': { bg: 'rgba(52, 211, 153, 0.12)', text: '#34d399', label: 'Profile' },
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function eventDetail(event: BaseEvent): string {
  const e = event as any;
  switch (event.event_type) {
    case 'order-created': return `$${e.total_amount}${e.is_premium ? ' premium' : ''}`;
    case 'payment-failed': return e.failure_code?.replace(/_/g, ' ').toLowerCase();
    case 'support-ticket-updated': return `${e.sentiment} - ${e.category}`;
    case 'shipment-delayed': return `${e.delay_hours}h delay`;
    case 'customer-profile-updated': return e.tier;
    default: return '';
  }
}

export function EventFeed({ events }: { events: BaseEvent[] }) {
  return (
    <div className="space-y-2 overflow-y-auto max-h-96 pr-1">
      {events.length === 0 && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Waiting for events...</p>
      )}
      {events.map((event) => {
        const style = EVENT_STYLES[event.event_type] || { bg: 'rgba(100,100,130,0.12)', text: '#8888a4', label: event.event_type };
        return (
          <div key={event.event_id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.02)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: style.text }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: style.bg, color: style.text }}>
                  {style.label}
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{event.customer_id}</span>
              </div>
              <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{eventDetail(event)}</p>
            </div>
            <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{timeAgo(event.event_time)}</span>
          </div>
        );
      })}
    </div>
  );
}
