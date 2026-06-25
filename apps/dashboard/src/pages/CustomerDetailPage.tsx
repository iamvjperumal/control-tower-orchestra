import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Customer360, BaseEvent } from '../types';
import { api } from '../api/client';
import { RiskGauge } from '../components/RiskGauge';
import { CustomerTimeline } from '../components/CustomerTimeline';
import { RecommendationCard } from '../components/RecommendationCard';

const TIER_STYLES: Record<string, { bg: string; text: string }> = {
  vip: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24' },
  premium: { bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa' },
  standard: { bg: 'rgba(100, 100, 130, 0.12)', text: '#8888a4' },
};

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer360 | null>(null);
  const [timeline, setTimeline] = useState<BaseEvent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.fetchCustomer(id).then(setCustomer).catch(() => setError('Customer not found'));
    api.fetchCustomerTimeline(id).then(setTimeline).catch(() => {});
  }, [id]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        <Link to="/retail" className="text-sm mt-2 inline-block" style={{ color: 'var(--purple-light)' }}>Back to dashboard</Link>
      </div>
    );
  }

  if (!customer) {
    return <p className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</p>;
  }

  const tierStyle = TIER_STYLES[customer.tier] || TIER_STYLES.standard;

  return (
    <div className="space-y-6">
      <Link to="/retail" className="text-sm" style={{ color: 'var(--purple-light)' }}>&larr; Back to dashboard</Link>

      <div className="card-gradient">
        <div className="relative z-[1] flex items-center gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold font-mono text-white">{customer.customer_id}</h2>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: tierStyle.bg, color: tierStyle.text }}>
                {customer.tier.toUpperCase()}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{customer.region}</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>LTV: ${customer.lifetime_value.toLocaleString()}</span>
            </div>
          </div>
          <RiskGauge score={customer.current_risk_score} size="lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Event Timeline</h3>
          <CustomerTimeline events={timeline} />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Active Recommendations</h3>
          <div className="space-y-4">
            {customer.active_recommendations.length === 0 && (
              <div className="card text-center py-8">
                <p style={{ color: 'var(--text-muted)' }}>No active recommendations</p>
              </div>
            )}
            {customer.active_recommendations.map((rec) => (
              <RecommendationCard key={rec.event_id} rec={rec} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
