import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { PIIFieldMapping, DataContract, GovernanceMetrics } from '../types';

const CLASSIFICATION_COLORS: Record<string, { bg: string; text: string }> = {
  DIRECT: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444' },
  QUASI: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24' },
  SENSITIVE: { bg: 'rgba(251, 146, 60, 0.12)', text: '#fb923c' },
};

const HANDLING_COLORS: Record<string, { bg: string; text: string }> = {
  HASH: { bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa' },
  REDACT: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444' },
  MASK: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24' },
  ENCRYPT: { bg: 'rgba(34, 211, 238, 0.12)', text: '#22d3ee' },
};

const COMPAT_COLORS: Record<string, { bg: string; text: string }> = {
  BACKWARD: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
  FORWARD: { bg: 'rgba(34, 211, 238, 0.12)', text: '#22d3ee' },
  FULL: { bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa' },
  NONE: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444' },
};

const DOMAIN_COLORS: Record<string, string> = {
  retail: '#a78bfa',
  fleet: '#fb923c',
};

export function ComplianceDashboard({ domain }: { domain?: string }) {
  const [piiFields, setPiiFields] = useState<PIIFieldMapping[]>([]);
  const [contracts, setContracts] = useState<DataContract[]>([]);
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'pii' | 'contracts'>('overview');

  useEffect(() => {
    api.fetchGovernancePII(domain).then(setPiiFields).catch(() => setPiiFields([]));
    api.fetchGovernanceContracts().then(setContracts).catch(() => setContracts([]));
    api.fetchGovernanceMetrics().then(setMetrics).catch(() => {});
  }, [domain]);

  const filteredContracts = domain ? contracts.filter((c) => c.domain === domain) : contracts;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Compliance & Data Contracts</h3>
        <div className="flex gap-1">
          {(['overview', 'pii', 'contracts'] as const).map((tab) => (
            <button type="button" key={tab}
              onClick={() => setActiveTab(tab)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all"
              style={activeTab === tab
                ? { background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }
                : { color: 'var(--text-muted)' }}>
              {tab === 'overview' ? 'Overview' : tab === 'pii' ? 'PII Fields' : 'Data Contracts'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && metrics && (
        <div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <MetricCard label="Domains" value={metrics.totalDomains} color="#22d3ee" />
            <MetricCard label="Topics" value={metrics.totalTopics} color="#34d399" />
            <MetricCard label="Schemas" value={metrics.totalSchemas} color="#a78bfa" />
            <MetricCard label="PII Fields" value={metrics.totalPIIFields} color="#fbbf24" />
          </div>

          <div className="space-y-2">
            {metrics.domainBreakdown.map((d) => (
              <div key={d.domain} className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: DOMAIN_COLORS[d.domain] || '#888' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{d.displayName}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>{d.topicCount} topics</span>
                  <span>{d.schemaCount} schemas</span>
                  <span>{d.piiFieldCount} PII fields</span>
                  <span>{d.agentCount} agents</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pii' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-card)' }}>
                <th className="text-left py-2 pr-4 font-semibold">Schema</th>
                <th className="text-left py-2 pr-4 font-semibold">Field</th>
                <th className="text-left py-2 pr-4 font-semibold">Classification</th>
                <th className="text-left py-2 font-semibold">Handling</th>
              </tr>
            </thead>
            <tbody>
              {piiFields.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(30, 30, 54, 0.5)' }}>
                  <td className="py-2 pr-4 font-mono" style={{ color: 'var(--text-primary)' }}>{f.schema}</td>
                  <td className="py-2 pr-4 font-mono" style={{ color: 'var(--text-secondary)' }}>{f.field}</td>
                  <td className="py-2 pr-4">
                    <Badge label={f.classification} colors={CLASSIFICATION_COLORS[f.classification]} />
                  </td>
                  <td className="py-2">
                    <Badge label={f.handling} colors={HANDLING_COLORS[f.handling]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {piiFields.length === 0 && (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>No PII fields registered</p>
          )}
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-card)' }}>
                <th className="text-left py-2 pr-4 font-semibold">Subject</th>
                <th className="text-left py-2 pr-4 font-semibold">Domain</th>
                <th className="text-left py-2 pr-4 font-semibold">Topic</th>
                <th className="text-left py-2 font-semibold">Compatibility</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(30, 30, 54, 0.5)' }}>
                  <td className="py-2 pr-4 font-mono" style={{ color: 'var(--text-primary)' }}>{c.subject}</td>
                  <td className="py-2 pr-4">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: `${DOMAIN_COLORS[c.domain] || '#888'}15`, color: DOMAIN_COLORS[c.domain] || '#888' }}>
                      {c.domain}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono" style={{ color: 'var(--text-secondary)' }}>{c.topic}</td>
                  <td className="py-2">
                    <Badge label={c.compatibilityLevel} colors={COMPAT_COLORS[c.compatibilityLevel]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredContracts.length === 0 && (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>No data contracts registered</p>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center py-3 px-2 rounded-lg" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <div className="text-xl font-bold" style={{ color, fontFamily: 'var(--font-heading)' }}>{value}</div>
      <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function Badge({ label, colors }: { label: string; colors?: { bg: string; text: string } }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
      style={{ background: colors?.bg || 'rgba(136,136,164,0.12)', color: colors?.text || '#8888a4' }}>
      {label}
    </span>
  );
}
