import { BaseEvent } from '../types';

const TYPE_COLORS: Record<string, string> = {
  'order-created': '#818cf8',
  'payment-failed': '#f87171',
  'support-ticket-updated': '#fbbf24',
  'shipment-delayed': '#c084fc',
  'customer-profile-updated': '#34d399',
};

export function CustomerTimeline({ events }: { events: BaseEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No events yet</p>;
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-px" style={{ background: 'var(--border-card)' }} />
      {events.map((event) => {
        const color = TYPE_COLORS[event.event_type] || '#8888a4';
        return (
          <div key={event.event_id} className="relative mb-3">
            <div className="absolute -left-4 top-2 w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}44` }} />
            <div className="card ml-2 !p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color }}>{event.event_type}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {new Date(event.event_time).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{event.source_system}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
