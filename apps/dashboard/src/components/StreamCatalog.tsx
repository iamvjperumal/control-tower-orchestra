import { useEffect, useState } from 'react';
import type { TopicMetadata } from '../types';
import { api } from '../api/client';

const DOMAIN_COLORS: Record<string, string> = {
  retail: '#a78bfa',
  fleet: '#fb923c',
};

const LAYER_COLORS: Record<string, string> = {
  raw: '#818cf8',
  curated: '#a78bfa',
  enriched: '#22d3ee',
  signals: '#fbbf24',
  decisions: '#34d399',
  actions: '#8b5cf6',
  audit: '#8888a4',
};

export function StreamCatalog({ domain }: { domain?: string }) {
  const [topics, setTopics] = useState<TopicMetadata[]>([]);
  const [filterLayer, setFilterLayer] = useState('all');
  const [filterDomain, setFilterDomain] = useState(domain || 'all');

  useEffect(() => {
    api.fetchGovernanceTopics(domain).then(setTopics).catch(() => setTopics([]));
  }, [domain]);

  const layers = [...new Set(topics.map((t) => t.layer))];
  const domains = [...new Set(topics.map((t) => t.domain))];

  const filtered = topics.filter((t) => {
    if (filterLayer !== 'all' && t.layer !== filterLayer) return false;
    if (filterDomain !== 'all' && t.domain !== filterDomain) return false;
    return true;
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Stream Catalog</h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {topics.length} topics across {domains.length} domain{domains.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!domain && domains.length > 1 && (
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="text-[11px] rounded-md px-2 py-1"
              style={{ background: 'var(--bg-sidebar)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}>
              <option value="all">All Domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
          <select
            value={filterLayer}
            onChange={(e) => setFilterLayer(e.target.value)}
            className="text-[11px] rounded-md px-2 py-1"
            style={{ background: 'var(--bg-sidebar)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}>
            <option value="all">All Layers</option>
            {layers.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-card)' }}>
              <th className="text-left py-2 pr-4 font-semibold">Topic</th>
              <th className="text-left py-2 pr-4 font-semibold">Domain</th>
              <th className="text-left py-2 pr-4 font-semibold">Layer</th>
              <th className="text-left py-2 font-semibold">Entity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.name} style={{ borderBottom: '1px solid rgba(30, 30, 54, 0.5)' }}>
                <td className="py-2 pr-4 font-mono" style={{ color: 'var(--text-primary)' }}>{t.name}</td>
                <td className="py-2 pr-4">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: `${DOMAIN_COLORS[t.domain] || '#888'}15`, color: DOMAIN_COLORS[t.domain] || '#888' }}>
                    {t.domain}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: `${LAYER_COLORS[t.layer] || '#888'}15`, color: LAYER_COLORS[t.layer] || '#888' }}>
                    {t.layer}
                  </span>
                </td>
                <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{t.entity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
