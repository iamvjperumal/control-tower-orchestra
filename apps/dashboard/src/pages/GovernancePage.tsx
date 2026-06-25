import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { LineageGraph } from '../components/LineageGraph';
import { SchemaViewer } from '../components/SchemaViewer';
import { StreamCatalog } from '../components/StreamCatalog';
import { ComplianceDashboard } from '../components/ComplianceDashboard';
import { FlinkJobsViewer } from '../components/FlinkJobsViewer';
import type { GovernanceDomain } from '../types';

type Tab = 'catalog' | 'lineage' | 'schemas' | 'compliance' | 'flink';

export function GovernancePage({ domain }: { domain?: string } = {}) {
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [domains, setDomains] = useState<GovernanceDomain[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    api.fetchGovernanceDomains().then(setDomains).catch(() => setDomains([]));
    api.fetchGovernanceSchemas().then(setSubjects).catch(() => setSubjects([]));
  }, []);

  async function loadSchema(subject: string) {
    setSelectedSubject(subject);
    try {
      const detail = await api.fetchSchemaDetail(subject);
      const parsed = typeof detail.schema === 'string' ? JSON.parse(detail.schema) : detail.schema;
      setSelectedSchema(parsed);
    } catch {
      setSelectedSchema(null);
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'catalog', label: 'Stream Catalog', icon: <CatalogIcon /> },
    { key: 'lineage', label: 'Data Lineage', icon: <LineageIcon /> },
    { key: 'schemas', label: 'Schema Registry', icon: <SchemaIcon /> },
    { key: 'compliance', label: 'Compliance', icon: <ComplianceIcon /> },
    { key: 'flink', label: 'Flink Jobs', icon: <FlinkIcon /> },
  ];

  return (
    <div className="space-y-6">
      {/* Domain summary cards */}
      {!domain && domains.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(domains.length, 4)}, 1fr)` }}>
          {domains.map((d) => (
            <div key={d.domain} className="card" style={{ borderLeft: `3px solid ${d.accentColor}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: d.accentColor }} />
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  {d.displayName}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MiniStat label="Topics" value={d.topicCount} />
                <MiniStat label="Schemas" value={d.schemaCount} />
                <MiniStat label="PII Fields" value={d.piiFieldCount} />
                <MiniStat label="AI Agents" value={d.agentCount} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)' }}>
        {tabs.map((tab) => (
          <button type="button" key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={activeTab === tab.key
              ? { background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa' }
              : { color: 'var(--text-muted)' }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'catalog' && <StreamCatalog domain={domain} />}

      {activeTab === 'lineage' && <LineageGraph domain={domain} />}

      {activeTab === 'schemas' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Registered Schemas
            </h3>
            <div className="card space-y-1 max-h-[600px] overflow-y-auto">
              {subjects.length === 0 && (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  No schemas registered yet
                </p>
              )}
              {subjects.map((subject) => {
                const subjectDomain = subject.split('.')[0];
                const domainColor = subjectDomain === 'retail' ? '#a78bfa' : subjectDomain === 'fleet' ? '#fb923c' : '#8888a4';
                return (
                  <button type="button" key={subject} onClick={() => loadSchema(subject)}
                    className="w-full text-left text-xs py-2 px-3 rounded-lg transition-all flex items-center gap-2"
                    style={selectedSubject === subject
                      ? { background: `${domainColor}15`, color: domainColor }
                      : { color: 'var(--text-secondary)' }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: domainColor }} />
                    <span className="font-mono truncate">{subject}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="col-span-2">
            {selectedSchema ? (
              <SchemaViewer schema={selectedSchema} />
            ) : (
              <div className="card text-center py-16">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-3" opacity={0.4}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a schema to view fields, PII tags, and data contracts</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'compliance' && <ComplianceDashboard domain={domain} />}

      {activeTab === 'flink' && <FlinkJobsViewer domain={domain} />}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{value}</div>
      <div className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function CatalogIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function LineageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function SchemaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function ComplianceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function FlinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
