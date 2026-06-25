/**
 * StreamLineagePage
 * =================
 * Full-canvas, live Stream Lineage view modelled after Confluent Cloud's
 * Stream Lineage feature.
 *
 * Layout mirrors how Confluent Cloud presents lineage:
 *
 *  [Producers / Source Connectors]  →  [Topics]  →  [Processors]  →  [Topics]  →  [Consumers / Sink Connectors]
 *
 * Live behaviour:
 *  • Subscribes to GET /governance/lineage/stream (SSE) for per-edge pulse
 *    events ("lineage-msg") and full throughput snapshots ("lineage-stats").
 *  • Active edges (those that had a message in the last 3 s) are animated.
 *  • Each node shows a live msg/s badge when non-zero.
 *
 * Domain filter: all | retail | fleet (and any future registered domain).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api/client';
import type { LineageData, LineageStatsResponse, TopicStats } from '../types';

/* ── Colours ── */
const DOMAIN_COLORS: Record<string, string> = {
  retail: '#a78bfa',
  fleet: '#fb923c',
  finguard: '#34d399',
  factory: '#60a5fa',
  care: '#f472b6',
  netpulse: '#22d3ee',
  gridwatch: '#facc15',
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

const NODE_TYPE_COLORS: Record<string, string> = {
  producer: '#60a5fa',
  source_connector: '#34d399',
  topic: '#a78bfa',
  ksql_stream: '#22d3ee',
  ksql_table: '#22d3ee',
  flink_job: '#fb923c',
  consumer: '#f472b6',
  sink_connector: '#facc15',
  ai_agent: '#f59e0b',
};

const LAYER_ORDER = ['raw', 'curated', 'enriched', 'signals', 'decisions', 'actions', 'audit'];

/* ── Types ── */
interface EnrichedNode {
  id: string;
  layer: string;
  domain: string;
  nodeType: string;
  label: string;
}
interface EnrichedEdge {
  from: string;
  to: string;
  processor?: string;
}
interface NodePos { x: number; y: number }

/* ── Helpers ── */
function shortLabel(id: string): string {
  const parts = id.split('.');
  if (parts.length >= 3) return `${parts[1]}.${parts[2]}`;
  if (parts.length === 2) return parts[1];
  return id.length > 22 ? id.slice(0, 20) + '…' : id;
}

function domainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || '#8888a4';
}

function nodeColor(node: EnrichedNode): string {
  if (node.nodeType && NODE_TYPE_COLORS[node.nodeType]) return NODE_TYPE_COLORS[node.nodeType];
  return LAYER_COLORS[node.layer] || domainColor(node.domain);
}

/* ── NodeTypeIcon (inline SVG paths for each type) ── */
function NodeTypeIcon({ type, size = 10, color }: { type: string; size?: number; color: string }) {
  const s = size;
  switch (type) {
    case 'producer':
      return <polygon points={`${s/2},0 ${s},${s} 0,${s}`} fill={color} opacity={0.9} />;
    case 'source_connector':
      return <rect x={0} y={0} width={s} height={s} rx={2} fill={color} opacity={0.9} />;
    case 'topic':
      return <ellipse cx={s/2} cy={s/2} rx={s/2} ry={s/3} fill={color} opacity={0.9} />;
    case 'ksql_stream':
    case 'ksql_table':
      return <path d={`M0,${s} Q${s/2},0 ${s},${s}`} fill="none" stroke={color} strokeWidth={1.5} opacity={0.9} />;
    case 'flink_job':
      return <polygon points={`${s/2},0 ${s},${s/2} ${s/2},${s} 0,${s/2}`} fill={color} opacity={0.9} />;
    case 'ai_agent':
      return <circle cx={s/2} cy={s/2} r={s/2} fill={color} opacity={0.9} />;
    case 'consumer':
      return <polygon points={`0,0 ${s},${s/2} 0,${s}`} fill={color} opacity={0.9} />;
    case 'sink_connector':
      return <rect x={0} y={0} width={s} height={s} rx={s/2} fill={color} opacity={0.9} />;
    default:
      return <circle cx={s/2} cy={s/2} r={s/2} fill={color} opacity={0.8} />;
  }
}

/* ── Main component ── */
export function StreamLineagePage({ domain }: { domain?: string }) {
  const [lineage, setLineage] = useState<LineageData | null>(null);
  const [stats, setStats] = useState<LineageStatsResponse | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>(domain || 'all');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [liveConnected, setLiveConnected] = useState(false);
  const activeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const esRef = useRef<EventSource | null>(null);

  /* ── Fetch static lineage graph ── */
  useEffect(() => {
    const d = domain || undefined;
    api.fetchGovernanceLineage(d).then(setLineage).catch(console.error);
    api.fetchLineageStats().then(setStats).catch(console.error);
  }, [domain]);

  /* ── SSE live subscription ── */
  useEffect(() => {
    const es = new EventSource(api.lineageStreamUrl);
    esRef.current = es;

    es.addEventListener('lineage-msg', (e: MessageEvent) => {
      const { topic } = JSON.parse(e.data) as { topic: string; ts: number };
      // Mark the edges that touch this topic as active for 3 seconds
      setLineage((prev) => {
        if (!prev) return prev;
        const edgeKeys = prev.edges
          .filter((edge) => edge.from === topic || edge.to === topic)
          .map((edge) => `${edge.from}→${edge.to}`);
        setActiveEdges((current) => {
          const next = new Set(current);
          for (const k of edgeKeys) {
            next.add(k);
            // Clear after 3 s
            const existing = activeTimers.current.get(k);
            if (existing) clearTimeout(existing);
            const t = setTimeout(() => {
              setActiveEdges((c) => { const s2 = new Set(c); s2.delete(k); return s2; });
              activeTimers.current.delete(k);
            }, 3000);
            activeTimers.current.set(k, t);
          }
          return next;
        });
        return prev;
      });
    });

    es.addEventListener('lineage-stats', (e: MessageEvent) => {
      setStats(JSON.parse(e.data) as LineageStatsResponse);
    });

    es.onopen = () => setLiveConnected(true);
    es.onerror = () => setLiveConnected(false);

    return () => {
      es.close();
      for (const t of activeTimers.current.values()) clearTimeout(t);
      activeTimers.current.clear();
    };
  }, []);

  if (!lineage) {
    return (
      <div className="card flex items-center justify-center py-20">
        <span className="text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading Stream Lineage…</span>
      </div>
    );
  }

  /* ── Filtered graph ── */
  const filteredNodes: EnrichedNode[] = (
    filterDomain === 'all'
      ? lineage.nodes
      : lineage.nodes.filter((n) => n.domain === filterDomain)
  ).map((n) => ({
    ...n,
    nodeType: n.nodeType ?? 'topic',
    label: n.label ?? shortLabel(n.id),
  }));

  const filteredIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges: EnrichedEdge[] = lineage.edges.filter(
    (e) => filteredIds.has(e.from) && filteredIds.has(e.to),
  );

  const domains = [...new Set(lineage.nodes.map((n) => n.domain))];

  /* ── Layout: column per LAYER_ORDER, rows per node in layer ── */
  const COL_W = 160;
  const ROW_H = 52;
  const PAD_X = 60;
  const PAD_Y = 50;
  const NODE_W = 130;
  const NODE_H = 30;

  const nodesByLayer: Record<string, EnrichedNode[]> = {};
  for (const n of filteredNodes) (nodesByLayer[n.layer] ??= []).push(n);

  const layerX: Record<string, number> = {};
  LAYER_ORDER.forEach((layer, i) => (layerX[layer] = PAD_X + i * COL_W));

  const positions: Record<string, NodePos> = {};
  for (const layer of LAYER_ORDER) {
    const nodes = nodesByLayer[layer] || [];
    nodes.forEach((n, i) => {
      positions[n.id] = { x: layerX[layer], y: PAD_Y + i * ROW_H };
    });
  }

  const svgW = PAD_X + LAYER_ORDER.length * COL_W + 80;
  const maxRows = Math.max(...LAYER_ORDER.map((l) => (nodesByLayer[l] || []).length), 1);
  const svgH = PAD_Y + maxRows * ROW_H + 40;

  /* ── Hover connectivity ── */
  const connectedToHovered = new Set<string>();
  if (hoveredNode || selectedNode) {
    const pivot = hoveredNode || selectedNode!;
    for (const e of filteredEdges) {
      if (e.from === pivot) connectedToHovered.add(e.to);
      if (e.to === pivot) connectedToHovered.add(e.from);
    }
    connectedToHovered.add(pivot);
  }

  const statsMap = new Map<string, TopicStats>(
    stats?.topics.map((t) => [t.topic, t]) ?? [],
  );

  /* ── Selected node detail ── */
  const selectedMeta = selectedNode
    ? filteredNodes.find((n) => n.id === selectedNode)
    : null;
  const selectedStats = selectedNode ? statsMap.get(selectedNode) : undefined;
  const selectedInEdges = selectedNode
    ? filteredEdges.filter((e) => e.to === selectedNode)
    : [];
  const selectedOutEdges = selectedNode
    ? filteredEdges.filter((e) => e.from === selectedNode)
    : [];

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            Stream Lineage
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Visual trace from producers and source connectors → topics → Flink / ksqlDB → consumers and sink connectors
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={liveConnected
              ? { background: 'rgba(52,211,153,0.12)', color: '#34d399' }
              : { background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: liveConnected ? '#34d399' : '#fb923c' }}
            />
            {liveConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* ── Domain filter ── */}
      {!domain && domains.length > 1 && (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setFilterDomain('all')}
            className="text-[10px] font-semibold px-3 py-1 rounded-full transition-all"
            style={filterDomain === 'all'
              ? { background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }
              : { color: 'var(--text-muted)', border: '1px solid var(--border-card)' }}>
            All Domains
          </button>
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => setFilterDomain(d)}
              className="text-[10px] font-semibold px-3 py-1 rounded-full transition-all"
              style={filterDomain === d
                ? { background: `${domainColor(d)}20`, color: domainColor(d), border: `1px solid ${domainColor(d)}50` }
                : { color: 'var(--text-muted)', border: '1px solid var(--border-card)' }}>
              {d}
            </button>
          ))}
        </div>
      )}

      {/* ── Main canvas + detail panel ── */}
      <div className="flex gap-4 items-start">
        {/* SVG Canvas */}
        <div className="card overflow-x-auto flex-1 min-w-0">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: '100%', minWidth: `${Math.min(svgW, 900)}px` }}
          >
            <defs>
              {/* Arrowhead markers per domain */}
              {domains.map((d) => (
                <marker key={d} id={`arrow-${d}`} viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={domainColor(d)} opacity={0.7} />
                </marker>
              ))}
              <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" />
              </marker>
              <marker id="arrow-default" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" opacity={0.5} />
              </marker>
            </defs>

            {/* Layer column headers */}
            {LAYER_ORDER.map((layer) => {
              if (!nodesByLayer[layer]?.length) return null;
              const x = layerX[layer] + NODE_W / 2;
              return (
                <g key={layer}>
                  <rect x={layerX[layer] - 8} y={6} width={NODE_W + 16} height={20} rx={4}
                    fill={LAYER_COLORS[layer] || '#888'} opacity={0.08} />
                  <text x={x} y={20} textAnchor="middle" fontSize="8" fontWeight="700"
                    fill={LAYER_COLORS[layer] || '#888'} fontFamily="var(--font-heading)"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {layer}
                  </text>
                </g>
              );
            })}

            {/* Edges */}
            {filteredEdges.map((edge) => {
              const from = positions[edge.from];
              const to = positions[edge.to];
              if (!from || !to) return null;
              const key = `${edge.from}→${edge.to}`;
              const isActive = activeEdges.has(key);
              const fromNode = filteredNodes.find((n) => n.id === edge.from);
              const dColor = domainColor(fromNode?.domain || '');
              const pivotActive = hoveredNode || selectedNode;
              const dimmed = pivotActive
                && !connectedToHovered.has(edge.from)
                && !connectedToHovered.has(edge.to);

              const x1 = from.x + NODE_W;
              const y1 = from.y + NODE_H / 2;
              const x2 = to.x;
              const y2 = to.y + NODE_H / 2;
              const cx = (x1 + x2) / 2;

              return (
                <g key={key} opacity={dimmed ? 0.08 : 1}>
                  <path
                    d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                    fill="none"
                    stroke={isActive ? '#34d399' : dColor}
                    strokeWidth={isActive ? 2 : 1.5}
                    strokeOpacity={isActive ? 1 : 0.35}
                    strokeDasharray={isActive ? '0' : '4 3'}
                    markerEnd={`url(#${isActive ? 'arrow-active' : fromNode?.domain ? `arrow-${fromNode.domain}` : 'arrow-default'})`}
                  />
                  {/* Processor label on hover of an edge-connected node */}
                  {edge.processor && pivotActive && connectedToHovered.has(edge.from) && connectedToHovered.has(edge.to) && (
                    <text x={cx} y={(y1 + y2) / 2 - 4} textAnchor="middle"
                      fontSize="7" fill="#94a3b8" fontFamily="var(--font-mono)">
                      {edge.processor.length > 28 ? edge.processor.slice(0, 26) + '…' : edge.processor}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const pos = positions[node.id];
              if (!pos) return null;
              const color = nodeColor(node);
              const pivotActive = hoveredNode || selectedNode;
              const dimmed = pivotActive && !connectedToHovered.has(node.id);
              const isSelected = selectedNode === node.id;
              const topicStats = statsMap.get(node.id);
              const mps = topicStats?.msgPerSec ?? 0;

              return (
                <g
                  key={node.id}
                  style={{ cursor: 'pointer', opacity: dimmed ? 0.15 : 1, transition: 'opacity 0.2s' }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(isSelected ? null : node.id)}
                >
                  {/* Node background */}
                  <rect
                    x={pos.x} y={pos.y}
                    width={NODE_W} height={NODE_H} rx={6}
                    fill={color} fillOpacity={isSelected ? 0.22 : 0.1}
                    stroke={color}
                    strokeWidth={isSelected ? 1.5 : 1}
                    strokeOpacity={isSelected ? 1 : 0.45}
                  />

                  {/* Node type icon */}
                  <g transform={`translate(${pos.x + 7}, ${pos.y + (NODE_H - 10) / 2})`}>
                    <NodeTypeIcon type={node.nodeType} size={10} color={color} />
                  </g>

                  {/* Label */}
                  <text
                    x={pos.x + 22} y={pos.y + NODE_H / 2 + 3}
                    fontSize="8.5" fill={color}
                    fontFamily="var(--font-mono)"
                    style={{ pointerEvents: 'none' }}>
                    {node.label.length > 18 ? node.label.slice(0, 17) + '…' : node.label}
                  </text>

                  {/* Live msg/s badge */}
                  {mps > 0 && (
                    <g transform={`translate(${pos.x + NODE_W - 28}, ${pos.y + 2})`}>
                      <rect x={0} y={0} width={26} height={12} rx={3}
                        fill="#34d399" opacity={0.18} />
                      <text x={13} y={9} textAnchor="middle" fontSize="6.5"
                        fill="#34d399" fontFamily="var(--font-mono)" fontWeight="700">
                        {mps}/s
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── Detail panel ── */}
        {selectedMeta && (
          <div className="card flex-shrink-0 w-72 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: nodeColor(selectedMeta) }}>
                  {selectedMeta.nodeType.replace('_', ' ')}
                </div>
                <div className="text-xs font-bold font-mono break-all"
                  style={{ color: 'var(--text-primary)' }}>
                  {selectedMeta.id}
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-xs px-2 py-0.5 rounded"
                style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}>
                ✕
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: domainColor(selectedMeta.domain) }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{selectedMeta.domain} / {selectedMeta.layer}</span>
            </div>

            {/* Live stats */}
            {selectedStats && (
              <div className="grid grid-cols-2 gap-2 pt-2" style={{ borderTop: '1px solid var(--border-card)' }}>
                <StatCell label="Messages In" value={selectedStats.messagesIn.toLocaleString()} />
                <StatCell label="Msg / sec" value={`${selectedStats.msgPerSec}`} highlight={selectedStats.msgPerSec > 0} />
                {selectedStats.consumerGroups.length > 0 && (
                  <div className="col-span-2">
                    <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: 'var(--text-muted)' }}>Consumer Group Lag</div>
                    <div className="space-y-1">
                      {selectedStats.consumerGroups.map((cg) => (
                        <div key={cg.groupId} className="flex justify-between items-center">
                          <span className="text-[9px] font-mono truncate" style={{ color: 'var(--text-secondary)', maxWidth: '70%' }}>
                            {cg.groupId}
                          </span>
                          <span className="text-[9px] font-bold font-mono"
                            style={{ color: cg.lag > 100 ? '#f87171' : cg.lag > 0 ? '#fbbf24' : '#34d399' }}>
                            {cg.lag.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upstream */}
            {selectedInEdges.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: 8 }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-muted)' }}>Upstream ({selectedInEdges.length})</div>
                <div className="space-y-1">
                  {selectedInEdges.map((e) => (
                    <div key={e.from} className="text-[9px] font-mono px-2 py-1 rounded"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                      ← {shortLabel(e.from)}
                      {e.processor && <span className="ml-1 opacity-60">({e.processor})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Downstream */}
            {selectedOutEdges.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: 8 }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-muted)' }}>Downstream ({selectedOutEdges.length})</div>
                <div className="space-y-1">
                  {selectedOutEdges.map((e) => (
                    <div key={e.to} className="text-[9px] font-mono px-2 py-1 rounded"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                      → {shortLabel(e.to)}
                      {e.processor && <span className="ml-1 opacity-60">({e.processor})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Throughput table ── */}
      {stats && stats.topics.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            Live Topic Throughput
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                {['Topic', 'Domain', 'Layer', 'Msg In', 'Msg/sec', 'Groups', 'Max Lag'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.topics
                .filter((t) => filterDomain === 'all' || t.domain === filterDomain)
                .sort((a, b) => b.msgPerSec - a.msgPerSec || b.messagesIn - a.messagesIn)
                .map((t) => {
                  const maxLag = t.consumerGroups.reduce((max, cg) => Math.max(max, cg.lag), 0);
                  return (
                    <tr key={t.topic}
                      onClick={() => setSelectedNode(selectedNode === t.topic ? null : t.topic)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: selectedNode === t.topic ? 'rgba(139,92,246,0.08)' : 'transparent',
                      }}>
                      <td style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {t.topic.length > 36 ? t.topic.slice(0, 34) + '…' : t.topic}
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ color: domainColor(t.domain), fontWeight: 600 }}>{t.domain}</span>
                      </td>
                      <td style={{ padding: '5px 8px', color: LAYER_COLORS[t.layer] || 'var(--text-muted)' }}>{t.layer}</td>
                      <td style={{ padding: '5px 8px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {t.messagesIn.toLocaleString()}
                      </td>
                      <td style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)', color: t.msgPerSec > 0 ? '#34d399' : 'var(--text-muted)', fontWeight: t.msgPerSec > 0 ? 700 : 400 }}>
                        {t.msgPerSec > 0 ? `${t.msgPerSec}` : '—'}
                      </td>
                      <td style={{ padding: '5px 8px', color: 'var(--text-muted)' }}>{t.consumerGroups.length}</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                        color: maxLag > 100 ? '#f87171' : maxLag > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
                        {maxLag > 0 ? maxLag.toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
        {[
          { type: 'producer', label: 'Producer' },
          { type: 'source_connector', label: 'Source Connector' },
          { type: 'topic', label: 'Topic' },
          { type: 'flink_job', label: 'Flink / ksqlDB' },
          { type: 'ai_agent', label: 'AI Agent' },
          { type: 'consumer', label: 'Consumer' },
          { type: 'sink_connector', label: 'Sink Connector' },
        ].map(({ type, label }) => (
          <div key={type} className="flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <NodeTypeIcon type={type} size={10} color={NODE_TYPE_COLORS[type] ?? '#888'} />
            </svg>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <svg width="24" height="8" viewBox="0 0 24 8">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#34d399" strokeWidth="2" />
            <polygon points="20,0 24,4 20,8" fill="#34d399" />
          </svg>
          <span className="text-[9px]" style={{ color: '#34d399' }}>Live flow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="24" height="8" viewBox="0 0 24 8">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 3" />
            <polygon points="20,0 24,4 20,8" fill="#8b5cf6" opacity={0.5} />
          </svg>
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Defined lineage</span>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div className="text-[9px] font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xs font-bold font-mono" style={{ color: highlight ? '#34d399' : 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
