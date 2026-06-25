import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseCase {
  id: string;
  route: string;
  name: string;
  subtitle: string;
  description: string;
  buyers: string;
  why: string;
  icon: string;
  accentColor: string;
  accentBg: string;
  glowColor: string;
  tags: string[];
  ready: boolean;
}

const USE_CASES: UseCase[] = [
  {
    id: 'retail',
    route: '/retail',
    name: 'RetailPulse',
    subtitle: 'Churn, Fraud, Refund & Service Recovery Engine',
    description:
      'Real-time risk scoring across orders, payments, support, and shipments. AI recommendations for fraud hold, VIP retention, refund approval, and human escalation.',
    buyers: 'E-commerce brands, marketplaces',
    why: 'Direct ROI through saved revenue and lower support loss; easy demo with orders, chat, and payments.',
    icon: 'M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z',
    accentColor: '#a78bfa',
    accentBg: 'rgba(139, 92, 246, 0.12)',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    tags: ['Orders', 'Payments', 'Fraud', 'Churn'],
    ready: true,
  },
  {
    id: 'fleet',
    route: '/fleet',
    name: 'FleetOps',
    subtitle: 'Real-Time Fleet Intelligence & AI Agent Command',
    description:
      'Stream vehicle telemetry, GPS, cold-chain readings, and maintenance signals. Four AI agents — Delay, Cold Chain, Safety, Maintenance — act in real time.',
    buyers: 'Logistics, cold-chain, last-mile delivery',
    why: 'Multi-agent AI on streaming data with live dashboards and full auditability.',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    accentColor: '#fb923c',
    accentBg: 'rgba(251, 146, 60, 0.12)',
    glowColor: 'rgba(251, 146, 60, 0.25)',
    tags: ['Telemetry', 'GPS', 'Cold Chain', 'AI Agents'],
    ready: true,
  },
  {
    id: 'finguard',
    route: '/finguard',
    name: 'FinGuard',
    subtitle: 'Financial Fraud & AML Compliance Engine',
    description:
      'Stream transactions, AML events, and payment risk signals. Detect velocity anomalies, flag suspicious patterns, and auto-generate compliance case actions.',
    buyers: 'Banks, fintechs, payment processors',
    why: 'High-stakes domain where real-time detection and governance auditability are regulatory requirements.',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.12)',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    tags: ['Transactions', 'AML', 'Fraud', 'Compliance'],
    ready: true,
  },
  {
    id: 'factory',
    route: '/factory',
    name: 'FactoryGuardian',
    subtitle: 'OEE Monitoring & Predictive Maintenance AI',
    description:
      'Stream OEE telemetry, vibration sensors, quality defects, and maintenance alerts. Detect degradation before failure and auto-create work orders.',
    buyers: 'Manufacturers, industrial OEMs, MES vendors',
    why: 'Predictive maintenance ROI is immediate; governed sensor streams prove AI trustworthiness to plant managers.',
    icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    accentColor: '#f97316',
    accentBg: 'rgba(249, 115, 22, 0.12)',
    glowColor: 'rgba(249, 115, 22, 0.25)',
    tags: ['OEE', 'Sensors', 'Maintenance', 'Quality'],
    ready: true,
  },
  {
    id: 'care',
    route: '/care',
    name: 'CareFlow',
    subtitle: 'Hospital Operations & Patient-Flow Copilot',
    description:
      'Stream admissions, vitals, bed events, and lab results. Optimize patient flow, score readmission risk, and flag clinical escalations before they become crises.',
    buyers: 'Hospitals, clinics, health ops',
    why: 'High-value environment where PII redaction, lineage, and policy enforcement are regulatory mandates.',
    icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
    accentColor: '#34d399',
    accentBg: 'rgba(52, 211, 153, 0.12)',
    glowColor: 'rgba(52, 211, 153, 0.25)',
    tags: ['Admissions', 'Vitals', 'Beds', 'HIPAA'],
    ready: true,
  },
  {
    id: 'netpulse',
    route: '/netpulse',
    name: 'NetPulse',
    subtitle: 'Network Anomaly & SLA Breach Prevention',
    description:
      'Stream device telemetry, SLA events, and capacity metrics. Detect packet loss, latency spikes, and saturation before SLA breaches trigger penalties.',
    buyers: 'Telcos, cloud providers, MSPs',
    why: 'SLA breach costs are concrete; real-time detection with governed audit trail beats reactive NOC processes.',
    icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
    accentColor: '#38bdf8',
    accentBg: 'rgba(56, 189, 248, 0.12)',
    glowColor: 'rgba(56, 189, 248, 0.25)',
    tags: ['Telemetry', 'SLA', 'Anomaly', 'NOC'],
    ready: true,
  },
];

export function CaseSelectorPage() {
  const navigate = useNavigate();
  const [showArch, setShowArch] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Ambient glows */}
      <div className="fixed top-[-300px] left-[50%] translate-x-[-50%] w-[800px] h-[800px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 65%)' }} />
      <div className="fixed bottom-[-200px] right-[-100px] w-[500px] h-[500px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(52, 211, 153, 0.06) 0%, transparent 65%)' }} />

      {/* Header */}
      <div className="text-center mb-8 relative z-[1]">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', boxShadow: '0 8px 32px rgba(124, 58, 237, 0.3)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-3">CTO — Control Tower Orchestra</h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Real-Time AI Decision Platform
        </p>
        <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          Powered by Confluent Connectors, Flink Stream Processing, Schema Registry & Stream Governance
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4 mb-10 relative z-[1]">
        <button type="button" onClick={() => setShowArch(true)}
          className="cto-action-btn group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
          <span>Architecture</span>
        </button>
        <button type="button"
          className="cto-action-btn-outline group"
          onClick={() => window.open('https://docs.google.com/presentation', '_blank')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>Presentation</span>
        </button>
      </div>

      {/* Orbital Engine Visualization */}
      <div className="relative z-[1] mb-10 w-full max-w-[900px]">
        <div className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          {/* Backbone label */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">One Engine. Infinite Verticals.</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Same Confluent backbone · Same governance layer · Same AI decision engine — only signals change
              </p>
            </div>
          </div>

          {/* Four pillars */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Signal Ingest', sub: 'Confluent Connectors', color: '#22d3ee', icon: 'M12 2L2 7l10 5 10-5-10-5z' },
              { label: 'Stream Processing', sub: 'Apache Flink', color: '#fbbf24', icon: 'M18 20V10M12 20V4M6 20v-6' },
              { label: 'Governance', sub: 'Schema Registry', color: '#f472b6', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
              { label: 'AI Decisions', sub: 'watsonx + Claude', color: '#34d399', icon: 'M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z' },
            ].map((pillar) => (
              <div key={pillar.label} className="rounded-xl p-3 text-center"
                style={{ background: `${pillar.color}10`, border: `1px solid ${pillar.color}30` }}>
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center"
                  style={{ background: `${pillar.color}20` }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pillar.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={pillar.icon} />
                  </svg>
                </div>
                <p className="text-xs font-bold" style={{ color: pillar.color }}>{pillar.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{pillar.sub}</p>
              </div>
            ))}
          </div>

          {/* Confluent backbone bar */}
          <div className="rounded-lg px-4 py-2.5 flex items-center justify-between mb-5"
            style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#a78bfa' }} />
              <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>CONFLUENT BACKBONE</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Kafka · Schema Registry · Stream Governance · Flink</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                7 VERTICALS
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(34, 211, 238, 0.12)', color: '#22d3ee' }}>
                ~80 TOPICS
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399' }}>
                12 AI AGENTS
              </span>
            </div>
          </div>

          {/* Vertical plug dots */}
          <div className="grid grid-cols-6 gap-2">
            {[
              { name: 'RetailPulse', color: '#a78bfa' },
              { name: 'FleetOps', color: '#fb923c' },
              { name: 'FinGuard', color: '#f59e0b' },
              { name: 'FactoryGuardian', color: '#f97316' },
              { name: 'CareFlow', color: '#34d399' },
              { name: 'NetPulse', color: '#38bdf8' },
            ].map((v) => (
              <div key={v.name} className="text-center">
                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: v.color }} />
                <p className="text-[9px] font-semibold" style={{ color: v.color }}>{v.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Case cards */}
      <div className="grid grid-cols-3 gap-5 max-w-[1200px] w-full relative z-[1]">
        {USE_CASES.map((uc) => (
          <button
            key={uc.id}
            onClick={() => uc.ready ? navigate(uc.route) : undefined}
            disabled={!uc.ready}
            className="case-card group text-left relative overflow-hidden rounded-2xl p-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid var(--border-card)`,
            }}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top right, ${uc.glowColor} 0%, transparent 70%)` }} />

            {/* Content */}
            <div className="relative z-[1]">
              {/* Icon + status */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: uc.accentBg, border: `1px solid ${uc.accentColor}30` }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={uc.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={uc.icon} />
                  </svg>
                </div>
                {uc.ready ? (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399' }}>
                    LIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(100, 100, 130, 0.12)', color: '#8888a4' }}>
                    COMING SOON
                  </span>
                )}
              </div>

              {/* Name */}
              <h2 className="text-lg font-bold text-white mb-1">{uc.name}</h2>
              <p className="text-xs font-medium mb-3" style={{ color: uc.accentColor }}>{uc.subtitle}</p>

              {/* Description */}
              <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                {uc.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {uc.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md"
                    style={{ background: uc.accentBg, color: uc.accentColor }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Buyers */}
              <div className="pt-3" style={{ borderTop: '1px solid var(--border-card)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Target Buyers
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{uc.buyers}</p>
              </div>

              {/* Why strong */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-card)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Why It Wins
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{uc.why}</p>
              </div>

              {/* CTA */}
              {uc.ready && (
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: uc.accentColor }}>
                  Launch Dashboard
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center relative z-[1]">
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Built for Confluent Hackathon 2026 — Governed Event Intelligence for Real-Time AI
        </p>
      </div>

      {/* Architecture Dialog */}
      {showArch && <ArchitectureDialog onClose={() => setShowArch(false)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Architecture Dialog
   ═══════════════════════════════════════════════ */

const ARCH_LAYERS = [
  {
    id: 'sources',
    label: 'Source Systems',
    subtitle: 'External Data Sources',
    color: '#818cf8',
    items: [
      { name: 'Orders DB', icon: 'M4 7v10c0 2 3 4 8 4s8-2 8-4V7', desc: 'PostgreSQL/MySQL' },
      { name: 'Payments API', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', desc: 'Stripe/Square' },
      { name: 'Support / CRM', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', desc: 'Zendesk/Salesforce' },
      { name: 'Telemetry / GPS', icon: 'M12 2a10 10 0 1 0 10 10h-10V2', desc: 'Vehicle IoT' },
      { name: 'Cold Chain IoT', icon: 'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z', desc: 'Temperature Sensors' },
    ],
  },
  {
    id: 'ingestion',
    label: 'Confluent Connectors',
    subtitle: 'Data Ingestion Layer',
    color: '#22d3ee',
    items: [
      { name: 'JDBC Source', icon: 'M4 7v10c0 2 3 4 8 4s8-2 8-4V7', desc: 'Database CDC' },
      { name: 'HTTP Source', icon: 'M12 2L2 7l10 5 10-5-10-5z', desc: 'REST APIs' },
      { name: 'Debezium CDC', icon: 'M4 4l16 16M4 20L20 4', desc: 'Change Data Capture' },
      { name: 'MQTT Connector', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', desc: 'IoT Devices' },
    ],
  },
  {
    id: 'kafka',
    label: 'Kafka Topics',
    subtitle: 'Event Streaming Backbone',
    color: '#a78bfa',
    items: [
      { name: 'retail.*.raw', icon: 'M22 12H2', desc: '~15 topics' },
      { name: 'fleet.*.raw', icon: 'M22 12H2', desc: '~18 topics' },
      { name: '*.clean / enriched', icon: 'M22 12H2', desc: 'Validated data' },
      { name: '*.signals / alerts', icon: 'M22 12H2', desc: 'Risk scores' },
      { name: '*.decisions', icon: 'M22 12H2', desc: 'AI recommendations' },
      { name: '*.actions / audit', icon: 'M22 12H2', desc: 'Operator actions' },
    ],
  },
  {
    id: 'processing',
    label: 'Flink Stream Processing',
    subtitle: 'Real-Time Transformations',
    color: '#fbbf24',
    items: [
      { name: 'Validate & Standardize', icon: 'M9 11l3 3L22 4', desc: 'Data quality' },
      { name: 'Temporal Joins', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', desc: 'Enrich events' },
      { name: 'Windowed Scoring', icon: 'M18 20V10M12 20V4M6 20v-6', desc: 'Time-based aggregations' },
      { name: 'Customer 360', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', desc: 'Unified profiles' },
    ],
  },
  {
    id: 'ai',
    label: 'AI Decision Layer',
    subtitle: 'watsonx + Claude Sonnet 4',
    color: '#34d399',
    items: [
      { name: 'Risk Scorer', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', desc: 'Real-time scoring' },
      { name: 'Recommendation Engine', icon: 'M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z', desc: 'Action suggestions' },
      { name: 'Fleet AI Agents (4)', icon: 'M12 2L2 7l10 5 10-5-10-5z', desc: 'Autonomous agents' },
      { name: 'CTO Copilot', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', desc: 'Natural language Q&A' },
    ],
  },
  {
    id: 'governance',
    label: 'Stream Governance',
    subtitle: 'Schema Registry + Data Quality',
    color: '#f472b6',
    items: [
      { name: 'Schema Registry', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', desc: '31+ Avro schemas' },
      { name: 'Data Contracts', icon: 'M9 11l3 3L22 4', desc: 'Compatibility rules' },
      { name: 'PII Tagging', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', desc: '25+ tagged fields' },
      { name: 'Data Lineage', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', desc: 'End-to-end tracking' },
    ],
  },
  {
    id: 'experience',
    label: 'Experience Layer',
    subtitle: 'Real-Time Dashboards',
    color: '#fb923c',
    items: [
      { name: 'React Dashboard', icon: 'M3 3h18v18H3zM3 9h18M9 21V9', desc: 'TypeScript + Vite' },
      { name: 'SSE Live Feeds', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', desc: 'Server-Sent Events' },
      { name: 'Event Replay', icon: 'M5 3l14 9-14 9V3z', desc: 'Time-travel debugging' },
      { name: 'Operator Actions', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', desc: 'Human-in-the-loop' },
    ],
  },
];

const ARCH_FLOW = [
  { from: 'sources', to: 'ingestion' },
  { from: 'ingestion', to: 'kafka' },
  { from: 'kafka', to: 'processing' },
  { from: 'processing', to: 'kafka', label: 'enriched' },
  { from: 'kafka', to: 'ai' },
  { from: 'ai', to: 'kafka', label: 'decisions' },
  { from: 'kafka', to: 'experience' },
  { from: 'governance', to: 'kafka', label: 'governs' },
];

function ArchitectureDialog({ onClose }: { onClose: () => void }) {
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  return (
    <div className="arch-overlay" onClick={onClose}>
      <div className="arch-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              CTO Architecture
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              End-to-end event-driven platform with Confluent Stream Governance
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Click on any layer to see details
            </p>
          </div>
          <button type="button" onClick={onClose} className="arch-close-btn" title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Pipeline flow visualization */}
        <div className="arch-pipeline">
          {ARCH_LAYERS.map((layer, layerIdx) => (
            <div key={layer.id} className="arch-layer-col">
              {/* Arrow between layers */}
              {layerIdx > 0 && layerIdx !== 5 && (
                <div className="arch-arrow">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={layer.color} strokeWidth="2" strokeLinecap="round" opacity={0.4}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}

              {/* Layer card */}
              <div
                className={`arch-layer-card ${selectedLayer === layer.id ? 'arch-layer-selected' : ''}`}
                style={{ borderTop: `3px solid ${layer.color}` }}
                onClick={() => setSelectedLayer(selectedLayer === layer.id ? null : layer.id)}
              >
                <div className="arch-layer-header">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="arch-layer-dot" style={{ background: layer.color, boxShadow: `0 0 12px ${layer.color}60` }} />
                    <div>
                      <span className="arch-layer-label" style={{ color: layer.color }}>{layer.label}</span>
                      <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{layer.subtitle}</p>
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={layer.color} strokeWidth="2" strokeLinecap="round"
                    style={{ transform: selectedLayer === layer.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                <div className="arch-layer-items">
                  {layer.items.map((item) => (
                    <div key={item.name} className="arch-item group">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={layer.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.7}>
                        <path d={item.icon} />
                      </svg>
                      <div className="flex-1">
                        <span className="arch-item-name">{item.name}</span>
                        {item.desc && (
                          <span className="arch-item-desc">{item.desc}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom: Key stats */}
        <div className="arch-stats">
          <ArchStat value="~80" label="Kafka Topics" color="#a78bfa" />
          <ArchStat value="31+" label="Avro Schemas" color="#22d3ee" />
          <ArchStat value="12" label="AI Agents" color="#34d399" />
          <ArchStat value="7" label="Use Cases" color="#fb923c" />
          <ArchStat value="25+" label="PII Fields" color="#fbbf24" />
          <ArchStat value="10" label="Flink SQL Jobs" color="#f472b6" />
        </div>

        {/* Data flow description */}
        <div className="arch-flow-desc">
          <div className="arch-flow-row">
            <FlowBadge color="#818cf8" label="1" />
            <span>Source systems emit events (orders, payments, telemetry, sensors)</span>
          </div>
          <div className="arch-flow-row">
            <FlowBadge color="#22d3ee" label="2" />
            <span>Confluent Connectors ingest into domain-prefixed raw topics</span>
          </div>
          <div className="arch-flow-row">
            <FlowBadge color="#fbbf24" label="3" />
            <span>Flink validates, enriches, and computes windowed risk scores</span>
          </div>
          <div className="arch-flow-row">
            <FlowBadge color="#34d399" label="4" />
            <span>AI agents consume scored signals, generate recommendations with Claude</span>
          </div>
          <div className="arch-flow-row">
            <FlowBadge color="#f472b6" label="5" />
            <span>Stream Governance enforces schemas, contracts, PII rules, and lineage</span>
          </div>
          <div className="arch-flow-row">
            <FlowBadge color="#fb923c" label="6" />
            <span>Dashboard displays live feeds, operator actions, and governance views</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="arch-stat-card" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="arch-stat-value" style={{ color }}>{value}</div>
      <div className="arch-stat-label">{label}</div>
    </div>
  );
}

function FlowBadge({ color, label }: { color: string; label: string }) {
  return (
    <div className="arch-flow-badge" style={{ background: `${color}20`, color }}>
      {label}
    </div>
  );
}
