import { useState } from 'react';

type JobStatus = 'running' | 'ready';

interface FlinkJob {
  id: string;
  name: string;
  domain: 'retail' | 'fleet';
  script: string;
  type: 'source' | 'transform' | 'sink' | 'view';
  description: string;
  inputTables: string[];
  outputTables: string[];
  sql: string;
  windowSize?: string;
  status: JobStatus;
}

const FLINK_JOBS: FlinkJob[] = [
  {
    id: 'r01',
    name: '01-create-source-tables',
    domain: 'retail',
    script: '01-create-source-tables.sql',
    type: 'source',
    description: 'Creates source table definitions for all retail raw Kafka topics with Avro-Confluent format and watermarks',
    inputTables: ['retail.orders.raw', 'retail.payments.raw', 'retail.support.raw', 'retail.shipments.raw', 'retail.customers.raw'],
    outputTables: ['raw_orders', 'raw_payments', 'raw_support', 'raw_shipments', 'raw_customers'],
    sql: `CREATE TABLE raw_orders (\n  event_id STRING,\n  event_time TIMESTAMP(3),\n  customer_id STRING,\n  order_id STRING,\n  total_amount DOUBLE,\n  is_premium BOOLEAN,\n  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND\n) WITH ('connector'='kafka', 'topic'='retail.orders.raw', 'format'='avro-confluent');`,
    status: 'running',
  },
  {
    id: 'r02',
    name: '02-clean-orders',
    domain: 'retail',
    script: '02-clean-orders.sql',
    type: 'transform',
    description: 'Validates and standardizes order events — filters null order_ids and negative amounts, normalizes currency',
    inputTables: ['raw_orders'],
    outputTables: ['clean_orders'],
    sql: `CREATE TABLE clean_orders WITH ('topic'='retail.orders.clean') AS\nSELECT event_id, event_time, customer_id, order_id,\n  total_amount, UPPER(currency) AS currency, item_count, is_premium\nFROM raw_orders\nWHERE order_id IS NOT NULL AND total_amount > 0;`,
    status: 'running',
  },
  {
    id: 'r03',
    name: '03-clean-payments',
    domain: 'retail',
    script: '03-clean-payments.sql',
    type: 'transform',
    description: 'Validates payment events — filters null payment_ids, normalizes currency to uppercase',
    inputTables: ['raw_payments'],
    outputTables: ['clean_payments'],
    sql: `CREATE TABLE clean_payments WITH ('topic'='retail.payments.clean') AS\nSELECT event_id, event_time, customer_id, order_id,\n  payment_id, failure_code, amount, UPPER(currency) AS currency\nFROM raw_payments\nWHERE payment_id IS NOT NULL;`,
    status: 'running',
  },
  {
    id: 'r04',
    name: '04-customer-360',
    domain: 'retail',
    script: '04-customer-360.sql',
    type: 'transform',
    description: 'Enriched customer view using temporal joins — joins customer profile with latest order amount and recent payment failure count (10-min window)',
    inputTables: ['raw_customers', 'clean_orders', 'clean_payments'],
    outputTables: ['enriched_customer_360'],
    sql: `CREATE TABLE enriched_customer_360 AS\nSELECT c.customer_id, c.tier, c.lifetime_value,\n  o.latest_order_amount, p.recent_failure_count\nFROM raw_customers c\nLEFT JOIN (\n  SELECT customer_id, LAST_VALUE(total_amount) AS latest_order_amount\n  FROM clean_orders GROUP BY customer_id\n) o ON c.customer_id = o.customer_id\nLEFT JOIN (\n  SELECT customer_id, COUNT(*) AS recent_failure_count\n  FROM clean_payments\n  WHERE event_time > CURRENT_TIMESTAMP - INTERVAL '10' MINUTE\n  GROUP BY customer_id\n) p ON c.customer_id = p.customer_id;`,
    windowSize: '10 min',
    status: 'running',
  },
  {
    id: 'r05',
    name: '05-risk-signals',
    domain: 'retail',
    script: '05-risk-signals.sql',
    type: 'transform',
    description: 'Windowed risk scoring — computes composite score from payment failures (10m), premium shipment delays, negative support (24h), and VIP status',
    inputTables: ['raw_customers', 'clean_payments', 'raw_shipments', 'raw_support'],
    outputTables: ['signals_risk'],
    sql: `CREATE TABLE signals_risk AS\nSELECT customer_id,\n  (CASE WHEN payment_failures_10m >= 2 THEN 30 ELSE 0 END +\n   CASE WHEN has_premium_delay THEN 20 ELSE 0 END +\n   CASE WHEN negative_support_24h > 0 THEN 25 ELSE 0 END +\n   CASE WHEN is_vip THEN 10 ELSE 0 END) AS risk_score\nFROM (\n  SELECT c.customer_id, ...\n  LEFT JOIN payment_failures, shipment_delays, support_events\n);`,
    windowSize: '10 min / 24 hr',
    status: 'running',
  },
  {
    id: 'r06',
    name: '06-decisions',
    domain: 'retail',
    script: '06-decisions.sql',
    type: 'view',
    description: 'Decision routing view — classifies risk scores into ESCALATE (>60), MONITOR (>30), or NO_ACTION. Actual AI generation runs in the worker service via Claude API',
    inputTables: ['signals_risk'],
    outputTables: ['risk_summary'],
    sql: `CREATE VIEW risk_summary AS\nSELECT customer_id, risk_score, event_time,\n  CASE\n    WHEN risk_score > 60 THEN 'ESCALATE'\n    WHEN risk_score > 30 THEN 'MONITOR'\n    ELSE 'NO_ACTION'\n  END AS suggested_action\nFROM signals_risk;`,
    status: 'ready',
  },
  {
    id: 'f10',
    name: '10-fleet-source-tables',
    domain: 'fleet',
    script: '10-fleet-source-tables.sql',
    type: 'source',
    description: 'Creates source table definitions for fleet telemetry, route events, cold chain readings, driver events, and maintenance signals',
    inputTables: ['fleet.telemetry.raw', 'fleet.route_events.raw', 'fleet.coldchain.raw', 'fleet.driver_events.raw', 'fleet.maintenance.raw'],
    outputTables: ['fleet_telemetry_raw', 'fleet_route_events_raw', 'fleet_coldchain_raw', 'fleet_driver_events_raw', 'fleet_maintenance_raw'],
    sql: `CREATE TABLE fleet_telemetry_raw (\n  vehicle_id STRING, lat DOUBLE, lng DOUBLE,\n  speed_kmh DOUBLE, engine_temp_c DOUBLE,\n  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND\n) WITH ('connector'='kafka', 'topic'='fleet.telemetry.raw');`,
    status: 'running',
  },
  {
    id: 'f11',
    name: '11-fleet-metrics',
    domain: 'fleet',
    script: '11-fleet-metrics.sql',
    type: 'transform',
    description: 'Computes live fleet metrics — ETA drift over 10-minute tumbling windows, cold chain breach detection over 5-minute windows with door-open tracking',
    inputTables: ['fleet_route_events_raw', 'fleet_coldchain_raw'],
    outputTables: ['fleet_eta_drift', 'fleet_coldchain_breaches'],
    sql: `CREATE TABLE fleet_eta_drift AS\nSELECT vehicle_id,\n  TUMBLE_START(event_time, INTERVAL '10' MINUTE) AS window_start,\n  MAX(eta_drift_minutes) AS max_eta_drift,\n  AVG(eta_drift_minutes) AS avg_eta_drift\nFROM fleet_route_events_raw\nGROUP BY vehicle_id, TUMBLE(event_time, INTERVAL '10' MINUTE);\n\nCREATE TABLE fleet_coldchain_breaches AS\nSELECT vehicle_id, compartment_id,\n  MAX(deviation_c) AS max_deviation,\n  COUNT(CASE WHEN deviation_c > 2.0 THEN 1 END) AS breach_count\nFROM fleet_coldchain_raw\nGROUP BY vehicle_id, compartment_id, TUMBLE(event_time, INTERVAL '5' MINUTE);`,
    windowSize: '10 min / 5 min',
    status: 'running',
  },
  {
    id: 'f12',
    name: '12-fleet-risk-alerts',
    domain: 'fleet',
    script: '12-fleet-risk-alerts.sql',
    type: 'transform',
    description: 'Generates risk alerts from ETA drift (>10 min), cold chain breaches (>2°C deviation), and driver safety events (harsh braking, overspeed)',
    inputTables: ['fleet_eta_drift', 'fleet_coldchain_breaches', 'fleet_driver_events_raw'],
    outputTables: ['fleet_risk_alerts'],
    sql: `INSERT INTO fleet_risk_alerts\nSELECT UUID() AS event_id, vehicle_id,\n  'eta_drift' AS alert_type,\n  CASE WHEN max_eta_drift > 20 THEN 'critical'\n       WHEN max_eta_drift > 10 THEN 'high' END AS severity,\n  max_eta_drift * 3 AS risk_score\nFROM fleet_eta_drift WHERE max_eta_drift > 10;\n\n-- + cold chain breach alerts\n-- + driver safety alerts`,
    status: 'running',
  },
  {
    id: 'f13',
    name: '13-fleet-agent-decisions',
    domain: 'fleet',
    script: '13-fleet-agent-decisions.sql',
    type: 'sink',
    description: 'Sink tables for AI agent decisions and operator action responses — consumed by the dashboard and audit systems',
    inputTables: ['fleet_risk_alerts'],
    outputTables: ['fleet_agent_decisions', 'fleet_agent_actions', 'fleet_audit_log'],
    sql: `CREATE TABLE fleet_agent_decisions (\n  decision_id STRING, agent_type STRING,\n  vehicle_id STRING, severity STRING,\n  recommended_action STRING, confidence DOUBLE\n) WITH ('connector'='kafka', 'topic'='fleet.agent.decisions');\n\nCREATE TABLE fleet_agent_actions (...)\nCREATE TABLE fleet_audit_log (...)`,
    status: 'ready',
  },
];

const DOMAIN_COLORS: Record<string, string> = { retail: '#a78bfa', fleet: '#fb923c' };
const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  source: { bg: 'rgba(34, 211, 238, 0.12)', text: '#22d3ee', label: 'SOURCE' },
  transform: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24', label: 'TRANSFORM' },
  sink: { bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa', label: 'SINK' },
  view: { bg: 'rgba(52, 211, 153, 0.12)', text: '#34d399', label: 'VIEW' },
};

export function FlinkJobsViewer({ domain }: { domain?: string }) {
  const [selectedJob, setSelectedJob] = useState<FlinkJob | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>(domain || 'all');

  const filtered = FLINK_JOBS.filter((j) => filterDomain === 'all' || j.domain === filterDomain);

  const retailJobs = filtered.filter((j) => j.domain === 'retail');
  const fleetJobs = filtered.filter((j) => j.domain === 'fleet');

  return (
    <div className="space-y-6">
      {/* Pipeline visualization */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Flink SQL Pipeline</h3>
          <div className="flex items-center gap-2">
            {!domain && (
              <>
                <FilterBtn label="All" active={filterDomain === 'all'} onClick={() => setFilterDomain('all')} />
                <FilterBtn label="Retail" active={filterDomain === 'retail'} onClick={() => setFilterDomain('retail')} color="#a78bfa" />
                <FilterBtn label="Fleet" active={filterDomain === 'fleet'} onClick={() => setFilterDomain('fleet')} color="#fb923c" />
              </>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' }}>
              {filtered.length} jobs
            </span>
          </div>
        </div>

        {/* DAG visualization */}
        <FlinkDAG jobs={filtered} onSelect={setSelectedJob} selectedId={selectedJob?.id} />
      </div>

      {/* Job list + detail */}
      <div className="grid gap-6" style={{ gridTemplateColumns: selectedJob ? '1fr 1.2fr' : '1fr' }}>
        <div className="space-y-3">
          {retailJobs.length > 0 && (filterDomain === 'all' || filterDomain === 'retail') && (
            <JobGroup label="RetailOps Pipeline" color="#a78bfa" jobs={retailJobs} selectedId={selectedJob?.id} onSelect={setSelectedJob} />
          )}
          {fleetJobs.length > 0 && (filterDomain === 'all' || filterDomain === 'fleet') && (
            <JobGroup label="FleetOps Pipeline" color="#fb923c" jobs={fleetJobs} selectedId={selectedJob?.id} onSelect={setSelectedJob} />
          )}
        </div>

        {selectedJob && <JobDetail job={selectedJob} onClose={() => setSelectedJob(null)} />}
      </div>
    </div>
  );
}

function FilterBtn({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button type="button" onClick={onClick}
      className="text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all"
      style={active
        ? { background: color ? `${color}20` : 'rgba(255,255,255,0.1)', color: color || 'var(--text-primary)' }
        : { color: 'var(--text-muted)' }}>
      {label}
    </button>
  );
}

function JobGroup({ label, color, jobs, selectedId, onSelect }: {
  label: string; color: string; jobs: FlinkJob[]; selectedId?: string;
  onSelect: (j: FlinkJob) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
      </div>
      <div className="space-y-1.5">
        {jobs.map((job) => {
          const typeStyle = TYPE_STYLES[job.type];
          const isSelected = job.id === selectedId;
          return (
            <button type="button" key={job.id} onClick={() => onSelect(job)}
              className="w-full text-left rounded-xl p-3 transition-all"
              style={{
                background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: isSelected ? `1px solid ${DOMAIN_COLORS[job.domain]}40` : '1px solid var(--border-card)',
              }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {job.script}
                </span>
                <div className="flex items-center gap-2">
                  {job.windowSize && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(251, 191, 36, 0.08)', color: '#fbbf24' }}>
                      {job.windowSize}
                    </span>
                  )}
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: typeStyle.bg, color: typeStyle.text }}>
                    {typeStyle.label}
                  </span>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {job.description.length > 100 ? job.description.slice(0, 100) + '...' : job.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function JobDetail({ job, onClose }: { job: FlinkJob; onClose: () => void }) {
  const typeStyle = TYPE_STYLES[job.type];
  const domainColor = DOMAIN_COLORS[job.domain];

  return (
    <div className="card" style={{ borderLeft: `3px solid ${domainColor}` }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-white">{job.script}</h3>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded"
              style={{ background: typeStyle.bg, color: typeStyle.text }}>
              {typeStyle.label}
            </span>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded"
              style={{ background: `${domainColor}15`, color: domainColor }}>
              {job.domain}
            </span>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{job.name}</p>
        </div>
        <button type="button" onClick={onClose} title="Close"
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
          style={{ border: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        {job.description}
      </p>

      {/* I/O tables */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#22d3ee' }}>
            Input ({job.inputTables.length})
          </p>
          {job.inputTables.map((t) => (
            <div key={t} className="text-[10px] font-mono py-0.5" style={{ color: 'var(--text-secondary)' }}>{t}</div>
          ))}
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#34d399' }}>
            Output ({job.outputTables.length})
          </p>
          {job.outputTables.map((t) => (
            <div key={t} className="text-[10px] font-mono py-0.5" style={{ color: 'var(--text-secondary)' }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Window info */}
      {job.windowSize && (
        <div className="flex items-center gap-2 mb-4 py-2 px-3 rounded-lg"
          style={{ background: 'rgba(251, 191, 36, 0.06)', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <span className="text-[10px] font-semibold" style={{ color: '#fbbf24' }}>
            Window: {job.windowSize}
          </span>
        </div>
      )}

      {/* SQL preview */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          SQL Preview
        </p>
        <pre className="text-[10px] leading-relaxed p-4 rounded-lg overflow-x-auto font-mono"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border-card)', color: '#22d3ee' }}>
          {job.sql}
        </pre>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-card)' }}>
        <div className="w-2 h-2 rounded-full" style={{ background: job.status === 'running' ? '#34d399' : '#fbbf24', animation: job.status === 'running' ? 'pulse 2s ease-in-out infinite' : 'none' }} />
        <span className="text-[10px] font-semibold uppercase" style={{ color: job.status === 'running' ? '#34d399' : '#fbbf24' }}>
          {job.status === 'running' ? 'Running' : 'Ready to Deploy'}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SVG DAG Visualization
   ═══════════════════════════════════════════════ */

interface DAGNode {
  id: string;
  label: string;
  domain: 'retail' | 'fleet';
  type: string;
  col: number;
  row: number;
}

interface DAGEdge {
  from: string;
  to: string;
}

function FlinkDAG({ jobs, onSelect, selectedId }: { jobs: FlinkJob[]; onSelect: (j: FlinkJob) => void; selectedId?: string }) {
  const retailJobs = jobs.filter((j) => j.domain === 'retail');
  const fleetJobs = jobs.filter((j) => j.domain === 'fleet');

  const nodes: DAGNode[] = [];
  const edges: DAGEdge[] = [];
  const jobById = new Map(jobs.map((j) => [j.id, j]));

  const typeOrder: Record<string, number> = { source: 0, transform: 1, view: 2, sink: 2 };

  let retailRow = 0;
  for (const job of retailJobs) {
    nodes.push({ id: job.id, label: job.script.replace('.sql', ''), domain: 'retail', type: job.type, col: typeOrder[job.type] || 1, row: retailRow++ });
  }

  let fleetRow = 0;
  for (const job of fleetJobs) {
    nodes.push({ id: job.id, label: job.script.replace('.sql', ''), domain: 'fleet', type: job.type, col: typeOrder[job.type] || 1, row: fleetRow++ });
  }

  // Build edges from output->input table matching
  const outputToJob = new Map<string, string>();
  for (const job of jobs) {
    for (const t of job.outputTables) {
      outputToJob.set(t, job.id);
    }
  }
  for (const job of jobs) {
    for (const t of job.inputTables) {
      const sourceJobId = outputToJob.get(t);
      if (sourceJobId && sourceJobId !== job.id) {
        edges.push({ from: sourceJobId, to: job.id });
      }
    }
  }

  const colWidth = 260;
  const rowHeight = 52;
  const startX = 30;
  const retailStartY = 40;
  const fleetStartY = retailStartY + retailJobs.length * rowHeight + 40;

  const getPos = (node: DAGNode) => {
    const baseY = node.domain === 'retail' ? retailStartY : fleetStartY;
    return {
      x: startX + node.col * colWidth,
      y: baseY + node.row * rowHeight,
    };
  };

  const svgWidth = startX + 3 * colWidth + 120;
  const svgHeight = fleetStartY + fleetJobs.length * rowHeight + 30;

  const colLabels = [
    { col: 0, label: 'SOURCE TABLES', color: '#22d3ee' },
    { col: 1, label: 'TRANSFORMATIONS', color: '#fbbf24' },
    { col: 2, label: 'OUTPUTS', color: '#34d399' },
  ];

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ minHeight: '300px' }}>
      {/* Column headers */}
      {colLabels.map((cl) => (
        <text key={cl.col} x={startX + cl.col * colWidth + 90} y={18}
          textAnchor="middle" fontSize="9" fontFamily="var(--font-heading)" fontWeight="700"
          fill={cl.color} opacity={0.5} style={{ textTransform: 'uppercase' } as React.CSSProperties}>
          {cl.label}
        </text>
      ))}

      {/* Domain labels */}
      {retailJobs.length > 0 && (
        <text x={10} y={retailStartY + (retailJobs.length * rowHeight) / 2 - 10}
          fontSize="9" fontFamily="var(--font-heading)" fontWeight="700"
          fill="#a78bfa" opacity={0.4} transform={`rotate(-90, 10, ${retailStartY + (retailJobs.length * rowHeight) / 2 - 10})`}>
          RETAIL
        </text>
      )}
      {fleetJobs.length > 0 && (
        <text x={10} y={fleetStartY + (fleetJobs.length * rowHeight) / 2 - 10}
          fontSize="9" fontFamily="var(--font-heading)" fontWeight="700"
          fill="#fb923c" opacity={0.4} transform={`rotate(-90, 10, ${fleetStartY + (fleetJobs.length * rowHeight) / 2 - 10})`}>
          FLEET
        </text>
      )}

      {/* Separator */}
      {retailJobs.length > 0 && fleetJobs.length > 0 && (
        <line x1={startX} y1={fleetStartY - 20} x2={svgWidth - 30} y2={fleetStartY - 20}
          stroke="var(--border-card)" strokeWidth="1" strokeDasharray="4 4" />
      )}

      {/* Edges */}
      {edges.map((edge, i) => {
        const fromNode = nodes.find((n) => n.id === edge.from);
        const toNode = nodes.find((n) => n.id === edge.to);
        if (!fromNode || !toNode) return null;
        const from = getPos(fromNode);
        const to = getPos(toNode);
        const color = DOMAIN_COLORS[fromNode.domain];
        return (
          <path key={i}
            d={`M${from.x + 180} ${from.y + 17} C${from.x + 220} ${from.y + 17}, ${to.x - 30} ${to.y + 17}, ${to.x} ${to.y + 17}`}
            fill="none" stroke={color} strokeWidth="1.5" strokeOpacity={0.3}
            markerEnd={`url(#dag-arrow-${fromNode.domain})`} />
        );
      })}

      {/* Arrow markers */}
      <defs>
        <marker id="dag-arrow-retail" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a78bfa" opacity={0.5} />
        </marker>
        <marker id="dag-arrow-fleet" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fb923c" opacity={0.5} />
        </marker>
      </defs>

      {/* Nodes */}
      {nodes.map((node) => {
        const pos = getPos(node);
        const job = jobById.get(node.id);
        const color = DOMAIN_COLORS[node.domain];
        const typeStyle = TYPE_STYLES[node.type];
        const isSelected = node.id === selectedId;
        return (
          <g key={node.id} onClick={() => job && onSelect(job)} style={{ cursor: 'pointer' }}>
            <rect x={pos.x} y={pos.y} width={180} height={34} rx={8}
              fill={isSelected ? `${color}18` : 'var(--bg-card)'}
              stroke={isSelected ? color : 'var(--border-card)'}
              strokeWidth={isSelected ? 1.5 : 1} />
            <circle cx={pos.x + 14} cy={pos.y + 17} r={3.5}
              fill={typeStyle.text} opacity={0.7} />
            <text x={pos.x + 24} y={pos.y + 21} fontSize="9.5" fontFamily="var(--font-mono)"
              fill={isSelected ? color : 'var(--text-secondary)'}>
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
