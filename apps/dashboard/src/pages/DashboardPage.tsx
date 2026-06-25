import { EventFeed } from '../components/EventFeed';
import { RecommendationCard } from '../components/RecommendationCard';
import { RiskGauge } from '../components/RiskGauge';
import { useSSE } from '../hooks/useSSE';
import { useRecommendations } from '../hooks/useRecommendations';
import { BaseEvent } from '../types';
import { api } from '../api/client';

export function DashboardPage() {
  const { events } = useSSE<BaseEvent>(api.sseEventsUrl, 'event');
  const { recommendations } = useRecommendations();

  const avgScore = recommendations.length > 0
    ? Math.round(recommendations.reduce((sum, r) => sum + r.risk_score, 0) / recommendations.length)
    : 0;

  const criticalCount = recommendations.filter((r) => r.priority === 'CRITICAL').length;
  const highCount = recommendations.filter((r) => r.priority === 'HIGH').length;
  const orderCount = events.filter((e) => e.event_type === 'order-created').length;

  return (
    <div className="space-y-5">
      {/* Row 1: Overview card + Risk radar + Event chart */}
      <div className="grid grid-cols-12 gap-5">
        {/* Overview card — large */}
        <div className="col-span-5 card-gradient">
          <div className="relative z-[1]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Overview</p>
                <p className="text-4xl font-bold text-white mt-1">{events.length}</p>
                <div className="stat-up mt-2">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="5,0 10,8 0,8" /></svg>
                  Live
                </div>
                <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>Total events processed</p>
              </div>
              <div className="icon-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
              </div>
            </div>

            {/* Event breakdown */}
            <div className="space-y-2.5 mt-4">
              <EventRow label="Orders" count={events.filter(e => e.event_type === 'order-created').length} />
              <EventRow label="Payments" count={events.filter(e => e.event_type === 'payment-failed').length} />
              <EventRow label="Support" count={events.filter(e => e.event_type === 'support-ticket-updated').length} />
              <EventRow label="Shipments" count={events.filter(e => e.event_type === 'shipment-delayed').length} />
              <EventRow label="Profiles" count={events.filter(e => e.event_type === 'customer-profile-updated').length} />
            </div>
          </div>
        </div>

        {/* Risk score radar / gauge */}
        <div className="col-span-4 card">
          <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Risk Distribution</p>
          <div className="flex items-center justify-center py-4">
            <RiskGauge score={avgScore} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <MiniStat label="Critical" value={criticalCount} color="#f87171" />
            <MiniStat label="High" value={highCount} color="#fbbf24" />
            <MiniStat label="Avg Score" value={avgScore} color="#a78bfa" />
            <MiniStat label="Total" value={recommendations.length} color="#34d399" />
          </div>
        </div>

        {/* Event activity chart */}
        <div className="col-span-3 card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>This session</p>
            <span className="stat-up text-[11px]">+{events.length}</span>
          </div>
          <ActivityBars events={events} />
        </div>
      </div>

      {/* Row 2: Stat cards */}
      <div className="grid grid-cols-4 gap-5">
        <StatCard icon={<DollarIcon />} label="Total Events" value={events.length.toString()} change={`+${events.length}`} up={true} sub="This session" />
        <StatCard icon={<TxIcon />} label="Recommendations" value={recommendations.length.toString()} change={criticalCount > 0 ? `${criticalCount} critical` : 'None critical'} up={criticalCount === 0} sub="Active alerts" />
        <StatCard icon={<UserIcon />} label="Customers" value="10" change="+10" up={true} sub="Seeded profiles" />
        <StatCard icon={<RiskIcon />} label="Avg Risk Score" value={avgScore.toString()} change={avgScore > 60 ? 'Elevated' : 'Normal'} up={avgScore <= 60} sub="Current window" />
      </div>

      {/* Row 3: Live feeds */}
      <div className="grid grid-cols-12 gap-5">
        {/* Event feed */}
        <div className="col-span-5 card" style={{ maxHeight: '500px', overflow: 'hidden' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white">Live Events</p>
            <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--purple-light)' }}>
              {events.length} events
            </span>
          </div>
          <EventFeed events={events} />
        </div>

        {/* Recommendations */}
        <div className="col-span-7 space-y-4" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">AI Recommendations</p>
            <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--purple-light)' }}>
              {recommendations.length} active
            </span>
          </div>
          {recommendations.length === 0 && (
            <div className="card text-center py-12">
              <p style={{ color: 'var(--text-muted)' }}>Waiting for risk signals...</p>
            </div>
          )}
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.event_id} rec={rec} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EventRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--purple-light)' }} />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <span className="text-sm font-mono font-semibold text-white">{count}</span>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)' }}>
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function StatCard({ icon, label, value, change, up, sub }: { icon: React.ReactNode; label: string; value: string; change: string; up: boolean; sub: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className="icon-circle">{icon}</div>
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={up ? 'stat-up' : 'stat-down'}>
          {up ? '▲' : '▼'} {change}
        </span>
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  );
}

function ActivityBars({ events }: { events: BaseEvent[] }) {
  const types = ['order-created', 'payment-failed', 'support-ticket-updated', 'shipment-delayed', 'customer-profile-updated'];
  const labels = ['Orders', 'Pay', 'Support', 'Ship', 'Profile'];
  const colors = ['#8b5cf6', '#c084fc', '#a78bfa', '#7c3aed', '#6d28d9'];
  const counts = types.map(t => events.filter(e => e.event_type === t).length);
  const max = Math.max(...counts, 1);

  return (
    <div className="flex items-end justify-between gap-2 h-40 mt-2">
      {counts.map((count, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-white">{count}</span>
          <div className="w-full rounded-t-md" style={{
            height: `${Math.max((count / max) * 120, 4)}px`,
            background: `linear-gradient(180deg, ${colors[i]}, ${colors[i]}44)`,
            transition: 'height 0.5s ease',
          }} />
          <span className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

// --- Stat card icons ---
function DollarIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}
function TxIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
}
function UserIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>;
}
function RiskIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
