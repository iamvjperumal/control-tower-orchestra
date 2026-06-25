import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { CaseSelectorPage } from './pages/CaseSelectorPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { GovernancePage } from './pages/GovernancePage';
import { ReplayPage } from './pages/ReplayPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { CopilotPanel } from './components/CopilotPanel';
import { FleetDashboardPage } from './pages/fleet/FleetDashboardPage';
import { FleetVehicleDetailPage } from './pages/fleet/FleetVehicleDetailPage';
import { FleetVehiclesPage } from './pages/fleet/FleetVehiclesPage';
import { FleetIncidentsPage } from './pages/fleet/FleetIncidentsPage';
import { FleetAgentsPage } from './pages/fleet/FleetAgentsPage';
import { FinGuardDashboardPage } from './pages/finguard/FinGuardDashboardPage';
import { FactoryDashboardPage } from './pages/factory/FactoryDashboardPage';
import { CareDashboardPage } from './pages/care/CareDashboardPage';
import { NetPulseDashboardPage } from './pages/netpulse/NetPulseDashboardPage';
import { GridWatchDashboardPage } from './pages/gridwatch/GridWatchDashboardPage';

/* ═══════════════════════════════════════════════
   Shared TopNav component for horizontal layout
   ═══════════════════════════════════════════════ */

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

function TopNav({
  brand,
  brandSub,
  brandIcon,
  accentColor,
  accentGradient,
  navItems,
  statusLabel,
  linkClass,
}: {
  brand: string;
  brandSub: string;
  brandIcon: React.ReactNode;
  accentColor: string;
  accentGradient: string;
  navItems: NavItem[];
  statusLabel: string;
  linkClass: string;
}) {
  const navigate = useNavigate();

  return (
    <header className="topnav" style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-card)' }}>
      <div className="topnav-inner">
        {/* Left: Logo + Brand */}
        <div className="topnav-brand">
          <button type="button" onClick={() => navigate('/')} className="topnav-logo group">
            <div className="topnav-logo-icon" style={{ background: accentGradient }}>
              {brandIcon}
            </div>
            <div className="topnav-logo-text">
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {brand}
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', fontWeight: 600, color: accentColor, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {brandSub}
              </span>
            </div>
          </button>

          {/* Divider */}
          <div className="topnav-divider" />

          {/* Nav Links */}
          <nav className="topnav-links">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) => `topnav-link ${linkClass} ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Status + Date + Back */}
        <div className="topnav-right">
          <div className="topnav-status">
            <div className="topnav-status-dot" style={{ background: accentColor }} />
            <span>{statusLabel}</span>
          </div>
          <div className="topnav-date">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <button type="button" onClick={() => navigate('/')} className="topnav-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            <span>All Cases</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════
   Page Header — shown below nav, context-aware
   ═══════════════════════════════════════════════ */

function PageHeader({ titles, badgeLabel, badgeColor, badgeBg }: {
  titles: Record<string, string>;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
}) {
  const location = useLocation();
  const pathBase = '/' + location.pathname.split('/').slice(1, 3).join('/');
  const title = titles[location.pathname] || titles[pathBase] || Object.values(titles)[0] || '';

  return (
    <div className="page-header">
      <div className="flex items-center gap-3">
        <h1 className="page-header-title">{title}</h1>
        <span className="page-header-badge" style={{ background: badgeBg, color: badgeColor }}>
          {badgeLabel}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Retail Layout
   ═══════════════════════════════════════════════ */

const RETAIL_NAV: NavItem[] = [
  { to: '/retail', label: 'Dashboard', icon: <GridIcon /> },
  { to: '/retail/digital-twin', label: 'Digital Twin', icon: <TwinIcon /> },
  { to: '/retail/governance', label: 'Governance', icon: <ShieldIcon /> },
  { to: '/retail/replay', label: 'Event Replay', icon: <PlayIcon /> },
  { to: '/retail/events', label: 'Live Events', icon: <ActivityIcon /> },
  { to: '/retail/recommendations', label: 'Recommendations', icon: <AlertIcon /> },
  { to: '/retail/customers', label: 'Customers', icon: <UsersIcon /> },
];

const RETAIL_TITLES: Record<string, string> = {
  '/retail': 'Dashboard',
  '/retail/governance': 'Governance',
  '/retail/events': 'Live Events',
  '/retail/recommendations': 'Recommendations',
  '/retail/customers': 'Customers',
  '/retail/replay': 'Event Replay',
  '/retail/digital-twin': 'Digital Twin',
};

function RetailLayout() {
  return (
    <>
      <div className="ambient-glow" />
      <TopNav
        brand="RetailOps"
        brandSub="Control Tower"
        brandIcon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        }
        accentColor="#a78bfa"
        accentGradient="linear-gradient(135deg, #7c3aed, #a78bfa)"
        navItems={RETAIL_NAV}
        statusLabel="Kafka Connected"
        linkClass="retail-link"
      />
      <main className="topnav-content">
        <PageHeader titles={RETAIL_TITLES} badgeLabel="RETAIL" badgeColor="#a78bfa" badgeBg="rgba(139, 92, 246, 0.10)" />
        <Outlet />
      </main>
      <CopilotPanel />
    </>
  );
}

/* ═══════════════════════════════════════════════
   FleetOps Control Tower Layout
   ═══════════════════════════════════════════════ */

const FLEET_NAV: NavItem[] = [
  { to: '/fleet', label: 'Dashboard', icon: <GridIcon /> },
  { to: '/fleet/vehicles', label: 'Vehicles', icon: <TruckIcon /> },
  { to: '/fleet/incidents', label: 'Incidents', icon: <AlertIcon /> },
  { to: '/fleet/agents', label: 'AI Agents', icon: <BrainIcon /> },
  { to: '/fleet/governance', label: 'Governance', icon: <ShieldIcon /> },
  { to: '/fleet/replay', label: 'Event Replay', icon: <PlayIcon /> },
];

const FLEET_TITLES: Record<string, string> = {
  '/fleet': 'Control Tower',
  '/fleet/vehicles': 'Fleet Vehicles',
  '/fleet/incidents': 'Incidents',
  '/fleet/agents': 'AI Agents',
  '/fleet/governance': 'Governance',
  '/fleet/replay': 'Event Replay',
};

function FleetLayout() {
  return (
    <>
      <div className="fixed top-[-200px] right-[-100px] w-[600px] h-[600px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(251, 146, 60, 0.08) 0%, transparent 70%)' }} />
      <TopNav
        brand="FleetOps"
        brandSub="Control Tower"
        brandIcon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        }
        accentColor="#fb923c"
        accentGradient="linear-gradient(135deg, #c2410c, #fb923c)"
        navItems={FLEET_NAV}
        statusLabel="Fleet Streaming"
        linkClass="fleet-link"
      />
      <main className="topnav-content">
        <PageHeader titles={FLEET_TITLES} badgeLabel="FLEET" badgeColor="#fb923c" badgeBg="rgba(251, 146, 60, 0.10)" />
        <Outlet />
      </main>
      <CopilotPanel />
    </>
  );
}

/* ═══════════════════════════════════════════════
   App Router
   ═══════════════════════════════════════════════ */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CaseSelectorPage />} />

        <Route path="/retail" element={<RetailLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="governance" element={<GovernancePage />} />
          <Route path="replay" element={<ReplayPage />} />
          <Route path="digital-twin" element={<DigitalTwinPage />} />
          <Route path="events" element={<DashboardPage />} />
          <Route path="recommendations" element={<DashboardPage />} />
          <Route path="customers" element={<DashboardPage />} />
        </Route>

        <Route path="/fleet" element={<FleetLayout />}>
          <Route index element={<FleetDashboardPage />} />
          <Route path="vehicles" element={<FleetVehiclesPage />} />
          <Route path="vehicles/:id" element={<FleetVehicleDetailPage />} />
          <Route path="incidents" element={<FleetIncidentsPage />} />
          <Route path="agents" element={<FleetAgentsPage />} />
          <Route path="governance" element={<FleetGovernancePage />} />
          <Route path="replay" element={<ReplayPage />} />
        </Route>

        <Route path="/finguard" element={<FinGuardLayout />}>
          <Route index element={<FinGuardDashboardPage />} />
          <Route path="governance" element={<GovernancePage domain="finguard" />} />
        </Route>

        <Route path="/factory" element={<FactoryLayout />}>
          <Route index element={<FactoryDashboardPage />} />
          <Route path="governance" element={<GovernancePage domain="factory" />} />
        </Route>

        <Route path="/care" element={<CareLayout />}>
          <Route index element={<CareDashboardPage />} />
          <Route path="governance" element={<GovernancePage domain="care" />} />
        </Route>

        <Route path="/netpulse" element={<NetPulseLayout />}>
          <Route index element={<NetPulseDashboardPage />} />
          <Route path="governance" element={<GovernancePage domain="netpulse" />} />
        </Route>

        <Route path="/gridwatch" element={<GridWatchLayout />}>
          <Route index element={<GridWatchDashboardPage />} />
          <Route path="governance" element={<GovernancePage domain="gridwatch" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

/* ═══════════════════════════════════════════════
   Fleet Governance (domain-scoped)
   ═══════════════════════════════════════════════ */

function FleetGovernancePage() {
  return <GovernancePage domain="fleet" />;
}

/* ═══════════════════════════════════════════════
   FinGuard Layout
   ═══════════════════════════════════════════════ */

const FINGUARD_NAV: NavItem[] = [
  { to: '/finguard', label: 'Dashboard', icon: <GridIcon /> },
  { to: '/finguard/governance', label: 'Governance', icon: <ShieldIcon /> },
];
const FINGUARD_TITLES: Record<string, string> = { '/finguard': 'Fraud & Risk Dashboard', '/finguard/governance': 'Governance' };

function FinGuardLayout() {
  return (
    <>
      <div className="fixed top-[-200px] right-[-100px] w-[600px] h-[600px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)' }} />
      <TopNav brand="FinGuard" brandSub="AI" brandIcon={
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      } accentColor="#f59e0b" accentGradient="linear-gradient(135deg, #b45309, #f59e0b)"
        navItems={FINGUARD_NAV} statusLabel="Fraud Monitoring" linkClass="finguard-link" />
      <main className="topnav-content">
        <PageHeader titles={FINGUARD_TITLES} badgeLabel="FINANCE" badgeColor="#f59e0b" badgeBg="rgba(245, 158, 11, 0.10)" />
        <Outlet />
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════
   FactoryGuardian Layout
   ═══════════════════════════════════════════════ */

const FACTORY_NAV: NavItem[] = [
  { to: '/factory', label: 'Dashboard', icon: <GridIcon /> },
  { to: '/factory/governance', label: 'Governance', icon: <ShieldIcon /> },
];
const FACTORY_TITLES: Record<string, string> = { '/factory': 'OEE & Maintenance Dashboard', '/factory/governance': 'Governance' };

function FactoryLayout() {
  return (
    <>
      <div className="fixed top-[-200px] right-[-100px] w-[600px] h-[600px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)' }} />
      <TopNav brand="FactoryGuardian" brandSub="AI" brandIcon={
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      } accentColor="#f97316" accentGradient="linear-gradient(135deg, #c2410c, #f97316)"
        navItems={FACTORY_NAV} statusLabel="Production Monitoring" linkClass="factory-link" />
      <main className="topnav-content">
        <PageHeader titles={FACTORY_TITLES} badgeLabel="MANUFACTURING" badgeColor="#f97316" badgeBg="rgba(249, 115, 22, 0.10)" />
        <Outlet />
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════
   CareFlow Layout
   ═══════════════════════════════════════════════ */

const CARE_NAV: NavItem[] = [
  { to: '/care', label: 'Dashboard', icon: <GridIcon /> },
  { to: '/care/governance', label: 'Governance', icon: <ShieldIcon /> },
];
const CARE_TITLES: Record<string, string> = { '/care': 'Patient Flow Dashboard', '/care/governance': 'Governance' };

function CareLayout() {
  return (
    <>
      <div className="fixed top-[-200px] right-[-100px] w-[600px] h-[600px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, transparent 70%)' }} />
      <TopNav brand="CareFlow" brandSub="AI" brandIcon={
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      } accentColor="#34d399" accentGradient="linear-gradient(135deg, #059669, #34d399)"
        navItems={CARE_NAV} statusLabel="Clinical Monitoring" linkClass="care-link" />
      <main className="topnav-content">
        <PageHeader titles={CARE_TITLES} badgeLabel="HEALTHCARE" badgeColor="#34d399" badgeBg="rgba(52, 211, 153, 0.10)" />
        <Outlet />
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════
   NetPulse Layout
   ═══════════════════════════════════════════════ */

const NETPULSE_NAV: NavItem[] = [
  { to: '/netpulse', label: 'Dashboard', icon: <GridIcon /> },
  { to: '/netpulse/governance', label: 'Governance', icon: <ShieldIcon /> },
];
const NETPULSE_TITLES: Record<string, string> = { '/netpulse': 'Network Operations Dashboard', '/netpulse/governance': 'Governance' };

function NetPulseLayout() {
  return (
    <>
      <div className="fixed top-[-200px] right-[-100px] w-[600px] h-[600px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)' }} />
      <TopNav brand="NetPulse" brandSub="AI" brandIcon={
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      } accentColor="#38bdf8" accentGradient="linear-gradient(135deg, #0369a1, #38bdf8)"
        navItems={NETPULSE_NAV} statusLabel="Network Monitoring" linkClass="netpulse-link" />
      <main className="topnav-content">
        <PageHeader titles={NETPULSE_TITLES} badgeLabel="TELECOM" badgeColor="#38bdf8" badgeBg="rgba(56, 189, 248, 0.10)" />
        <Outlet />
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════
   GridWatch Layout
   ═══════════════════════════════════════════════ */

const GRIDWATCH_NAV: NavItem[] = [
  { to: '/gridwatch', label: 'Dashboard', icon: <GridIcon /> },
  { to: '/gridwatch/governance', label: 'Governance', icon: <ShieldIcon /> },
];
const GRIDWATCH_TITLES: Record<string, string> = { '/gridwatch': 'Grid Operations Dashboard', '/gridwatch/governance': 'Governance' };

function GridWatchLayout() {
  return (
    <>
      <div className="fixed top-[-200px] right-[-100px] w-[600px] h-[600px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(250, 204, 21, 0.08) 0%, transparent 70%)' }} />
      <TopNav brand="GridWatch" brandSub="AI" brandIcon={
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      } accentColor="#facc15" accentGradient="linear-gradient(135deg, #a16207, #facc15)"
        navItems={GRIDWATCH_NAV} statusLabel="Grid Monitoring" linkClass="gridwatch-link" />
      <main className="topnav-content">
        <PageHeader titles={GRIDWATCH_TITLES} badgeLabel="ENERGY" badgeColor="#facc15" badgeBg="rgba(250, 204, 21, 0.10)" />
        <Outlet />
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════
   Coming Soon Placeholder
   ═══════════════════════════════════════════════ */

function ComingSoonPage({ name, color }: { name: string; color: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="ambient-glow" />
      <div className="text-center relative z-[1]">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{name}</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          This use case is under development. Check back soon.
        </p>
        <button onClick={() => navigate('/')}
          className="text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105"
          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
          Back to Use Cases
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Icons (inline SVG)
   ═══════════════════════════════════════════════ */

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function TwinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function BrainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <path d="M10 21h4" /><path d="M9 17h6" />
    </svg>
  );
}
