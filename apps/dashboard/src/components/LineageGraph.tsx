import { useEffect, useState } from 'react';
import type { LineageData } from '../types';
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

const LAYER_ORDER = ['raw', 'curated', 'enriched', 'signals', 'decisions', 'actions', 'audit'];

interface LineageGraphProps {
  domain?: string;
  compact?: boolean;
}

export function LineageGraph({ domain, compact }: LineageGraphProps) {
  const [data, setData] = useState<LineageData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>(domain || 'all');

  useEffect(() => {
    api.fetchGovernanceLineage(domain).then(setData).catch(console.error);
  }, [domain]);

  if (!data) return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading lineage...</p>;

  const filteredNodes = filterDomain === 'all'
    ? data.nodes
    : data.nodes.filter((n) => n.domain === filterDomain);
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = data.edges.filter((e) => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to));

  const domains = [...new Set(data.nodes.map((n) => n.domain))];

  const nodesByLayer: Record<string, typeof filteredNodes> = {};
  for (const node of filteredNodes) {
    (nodesByLayer[node.layer] ??= []).push(node);
  }

  const nodePositions: Record<string, { x: number; y: number }> = {};
  const colSpacing = compact ? 130 : 150;
  const rowSpacing = compact ? 44 : 52;
  const layerX: Record<string, number> = {};
  LAYER_ORDER.forEach((layer, i) => (layerX[layer] = 80 + i * colSpacing));

  for (const layer of LAYER_ORDER) {
    const nodes = nodesByLayer[layer] || [];
    nodes.forEach((node, i) => {
      nodePositions[node.id] = { x: layerX[layer], y: 50 + i * rowSpacing };
    });
  }

  const svgWidth = 80 + LAYER_ORDER.length * colSpacing + 60;
  const maxNodes = Math.max(...Object.values(nodesByLayer).map((n) => n.length), 1);
  const svgHeight = 50 + maxNodes * rowSpacing + 30;

  const connectedToHovered = new Set<string>();
  if (hoveredNode) {
    for (const e of filteredEdges) {
      if (e.from === hoveredNode) connectedToHovered.add(e.to);
      if (e.to === hoveredNode) connectedToHovered.add(e.from);
    }
    connectedToHovered.add(hoveredNode);
  }

  const shortName = (id: string) => {
    const parts = id.split('.');
    return parts.length >= 2 ? `${parts[1]}.${parts[2] || parts[1]}` : id;
  };

  return (
    <div className="card overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Data Lineage</h3>
        {!domain && domains.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterDomain('all')}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all"
              style={filterDomain === 'all'
                ? { background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }
                : { color: 'var(--text-muted)' }}>
              All
            </button>
            {domains.map((d) => (
              <button
                key={d}
                onClick={() => setFilterDomain(d)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all"
                style={filterDomain === d
                  ? { background: `${DOMAIN_COLORS[d] || '#888'}20`, color: DOMAIN_COLORS[d] || '#888' }
                  : { color: 'var(--text-muted)' }}>
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[800px]">
        <defs>
          {Object.entries(DOMAIN_COLORS).map(([d, color]) => (
            <marker key={d} id={`arrow-${d}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d={`M 0 0 L 10 5 L 0 10 z`} fill={color} opacity={0.6} />
            </marker>
          ))}
          <marker id="arrow-default" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" opacity={0.6} />
          </marker>
        </defs>

        {/* Layer labels */}
        {LAYER_ORDER.map((layer) => {
          if (!nodesByLayer[layer]?.length) return null;
          return (
            <text key={layer} x={layerX[layer] + 50} y={20} textAnchor="middle"
              fontSize="9" fill={LAYER_COLORS[layer] || '#888'} fontFamily="var(--font-heading)" fontWeight="600"
              opacity={0.6} style={{ textTransform: 'uppercase' }}>
              {layer}
            </text>
          );
        })}

        {/* Edges */}
        {filteredEdges.map((edge, i) => {
          const from = nodePositions[edge.from];
          const to = nodePositions[edge.to];
          if (!from || !to) return null;
          const fromNode = filteredNodes.find((n) => n.id === edge.from);
          const domainColor = DOMAIN_COLORS[fromNode?.domain || ''] || '#8b5cf6';
          const dimmed = hoveredNode && !connectedToHovered.has(edge.from) && !connectedToHovered.has(edge.to);
          const markerId = fromNode?.domain ? `arrow-${fromNode.domain}` : 'arrow-default';
          return (
            <line key={i} x1={from.x + 55} y1={from.y + 14} x2={to.x - 15} y2={to.y + 14}
              stroke={domainColor} strokeWidth="1.5" strokeOpacity={dimmed ? 0.1 : 0.4}
              markerEnd={`url(#${markerId})`} />
          );
        })}

        {/* Nodes */}
        {filteredNodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          const domainColor = DOMAIN_COLORS[node.domain] || LAYER_COLORS[node.layer] || '#8888a4';
          const dimmed = hoveredNode && !connectedToHovered.has(node.id);
          return (
            <g key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer', opacity: dimmed ? 0.2 : 1, transition: 'opacity 0.2s' }}>
              <rect x={pos.x - 15} y={pos.y} width={130} height={28} rx={6}
                fill={domainColor} opacity={0.12} stroke={domainColor} strokeWidth={1} />
              <circle cx={pos.x - 5} cy={pos.y + 14} r={3} fill={domainColor} opacity={0.7} />
              <text x={pos.x + 50} y={pos.y + 18} textAnchor="middle"
                fontSize="8.5" fill={domainColor} fontFamily="var(--font-mono)">
                {shortName(node.id)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {!domain && domains.length > 1 && (
        <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-card)' }}>
          {domains.map((d) => (
            <div key={d} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: DOMAIN_COLORS[d] || '#888' }} />
              <span className="text-[10px] font-semibold" style={{ color: DOMAIN_COLORS[d] || '#888' }}>{d}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
