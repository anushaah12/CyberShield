import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  ChevronDown,
  Globe,
  KeyRound,
  Link2,
  Lock,
  Menu,
  Moon,
  Search,
  Shield,
  ShieldAlert,
  Siren,
  Target,
  X,
} from 'lucide-react';

import CyberBackground from '@/components/CyberBackground';
import { NAV_ITEMS, type ViewId } from '@/lib/nav';
import { supabase, type ThreatReport, type UrlScan } from '@/lib/supabase';
import { apiGet } from '@/lib/api';

import UrlChecker from '@/components/UrlChecker';
import PasswordAnalyzer from '@/components/PasswordAnalyzer';
import Awareness from '@/components/Awareness';
import ReportThreat from '@/components/ReportThreat';
import ThreatMap from '@/components/ThreatMap';
import SettingsView from '@/components/SettingsView';
import About from '@/components/About';
import Login from '@/components/Login';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState<ViewId>('dashboard');

  const [mobileOpen, setMobileOpen] = useState(false);

  const [scanCount, setScanCount] = useState<number | null>(null);
  const [reportCount, setReportCount] = useState<number | null>(null);

  const [recentScans, setRecentScans] = useState<UrlScan[]>([]);
  const [recentReports, setRecentReports] = useState<ThreatReport[]>([]);

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  /* ---------------- LOAD DASHBOARD DATA ---------------- */

  useEffect(() => {
    if (!session) return;

    async function loadStats() {
      try {
        const [
          { stats },
          { items: scanRows },
          { items: reportRows },
        ] = await Promise.all([
          apiGet<{ stats: { scans: number; reports: number } }>('/stats'),

          apiGet<{ items: UrlScan[] }>('/scans'),

          apiGet<{ items: ThreatReport[] }>('/reports'),
        ]);

        setScanCount(stats.scans);
        setReportCount(stats.reports);

        setRecentScans(scanRows.slice(0, 5));
        setRecentReports(reportRows.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    }

    loadStats();
  }, [view, session]);

  /* ---------------- NAVIGATION ---------------- */

  function navigate(nextView: ViewId) {
    setView(nextView);
    setMobileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /* ---------------- SIGN OUT ---------------- */

  async function handleSignOut() {
    await supabase.auth.signOut();
    setView('dashboard');
  }

  /* ---------------- LOADING ---------------- */

  if (!authReady) {
    return (
      <div
        className="app-shell"
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CyberBackground />

        <div
          style={{
            color: '#53c9ff',
            fontSize: '14px',
          }}
        >
          Loading CyberShield...
        </div>
      </div>
    );
  }

  /* ---------------- LOGIN ---------------- */

  if (!session) {
    return (
      <div className="app-shell">
        <CyberBackground />
        <Login />
      </div>
    );
  }

  const userEmail = session.user?.email ?? null;

  const userInitial = (
    userEmail?.[0] ?? 'C'
  ).toUpperCase();

  /* ---------------- MAIN APP ---------------- */

  return (
    <div className="app-shell">
      <CyberBackground />

      <Sidebar
        activeView={view}
        mobileOpen={mobileOpen}
        onNavigate={navigate}
        onClose={() => setMobileOpen(false)}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />

      <div className="app-content">

        {/* TOP BAR */}

        <header className="topbar">

          <button
            className="mobile-menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="topbar-search">
            <Search className="h-4 w-4" />

            <input
              placeholder="Search threats, URLs, reports..."
              aria-label="Search threats, URLs, reports"
            />

            <kbd>⌘ K</kbd>
          </div>

          <div className="topbar-actions">

            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span />
            </button>

            <button
              className="icon-button desktop-only"
              aria-label="Toggle dark mode"
            >
              <Moon className="h-4 w-4" />
            </button>

            <div className="profile-chip">

              <div className="profile-avatar">
                {userInitial}
              </div>

              <div className="profile-copy">
                <strong>
                  {userEmail?.split('@')[0] || 'User'}
                </strong>

                <small>{userEmail}</small>
              </div>

              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />

            </div>

          </div>
        </header>

        {/* PAGE CONTENT */}

        <main className="page-content">

          {view === 'dashboard' && (
            <Dashboard
              scanCount={scanCount}
              reportCount={reportCount}
              recentScans={recentScans}
              recentReports={recentReports}
              onNavigate={navigate}
            />
          )}

          {view === 'url-checker' && <UrlChecker />}

          {view === 'password' && <PasswordAnalyzer />}

          {view === 'awareness' && <Awareness />}

          {view === 'report' && <ReportThreat />}

          {view === 'threat-map' && <ThreatMap />}

          {view === 'settings' && (
            <SettingsView
              userEmail={userEmail}
              onSignOut={handleSignOut}
            />
          )}

          {view === 'about' && (
            <About onNavigate={navigate} />
          )}

        </main>

        {/* FOOTER */}

        <footer className="app-footer">
          <span>
            <Shield className="h-4 w-4 text-cyan-400" />
            Be Smart. Be Safe. Be CyberShield.
          </span>

          <span>
            Protect yourself and others.
          </span>
        </footer>

      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  activeView,
  mobileOpen,
  onNavigate,
  onClose,
  userEmail,
  onSignOut,
}: {
  activeView: ViewId;
  mobileOpen: boolean;
  onNavigate: (view: ViewId) => void;
  onClose: () => void;
  userEmail: string | null;
  onSignOut: () => void;
}) {
  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? 'sidebar-open' : ''
        }`}
      >

        <div className="sidebar-brand">

          <div className="brand-mark">
            <Shield
              className="h-6 w-6"
              strokeWidth={2.5}
            />
          </div>

          <div>
            <strong>CYBERSHIELD</strong>
            <span>
              Smart Protection. Safe Future.
            </span>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        <div className="sidebar-label">
          Workspace
        </div>

        <nav className="sidebar-nav">

          {NAV_ITEMS.map((item) => {

            const Icon = item.icon;

            const active =
              activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`sidebar-link ${
                  active ? 'active' : ''
                }`}
              >

                <Icon className="h-[18px] w-[18px]" />

                <span>{item.label}</span>

                {active && (
                  <span className="active-line" />
                )}

              </button>
            );
          })}

        </nav>

        <div className="sidebar-alert">

          <div className="alert-illustration">
            <ShieldAlert className="h-12 w-12" />
          </div>

          <strong>Stay Alert!</strong>

          <p>
            Cyber threats are real.
            Stay informed, stay safe.
          </p>

          <button
            onClick={() =>
              onNavigate('awareness')
            }
          >
            Learn More
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

        </div>

        <div className="sidebar-user">

          <div className="sidebar-user-avatar">
            {(userEmail?.[0] ?? 'C').toUpperCase()}
          </div>

          <div className="sidebar-user-info">
            <strong>
              {userEmail?.split('@')[0] || 'User'}
            </strong>

            <small>{userEmail}</small>
          </div>

          <button
            onClick={onSignOut}
            className="sidebar-signout"
            aria-label="Sign out"
          >
            Sign Out
          </button>

        </div>

      </aside>
    </>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  scanCount,
  reportCount,
  recentScans,
  recentReports,
  onNavigate,
}: {
  scanCount: number | null;
  reportCount: number | null;
  recentScans: UrlScan[];
  recentReports: ThreatReport[];
  onNavigate: (view: ViewId) => void;
}) {

  /*
   * FIX:
   * recentScans is now actually used.
   *
   * We take the latest scan and display its URL.
   * If there are no scans, the default URL is displayed.
   */

  const latestScan = recentScans[0];

  const latestUrl =
    latestScan?.url ||
    'https://secure-login-verify-account.com';

  return (
    <div className="dashboard-stack">

      {/* HERO */}

      <section className="dashboard-hero">

        <div className="hero-copy">

          <div className="eyebrow">
            <Activity className="h-3.5 w-3.5" />
            Real-time protection active
          </div>

          <h1>
            Welcome back,
            <span> CyberShield user!</span>
          </h1>

          <p>
            Monitor, detect and stay protected
            from cyber threats in real-time.
          </p>

          <div className="protection-score">

            <div className="score-icon">
              <Shield className="h-7 w-7" />
            </div>

            <div className="score-info">

              <small>
                Your Protection Score
              </small>

              <strong>
                85<span>%</span>
              </strong>

              <div className="score-track">
                <i />
              </div>

            </div>

          </div>

        </div>

        <div
          className="hero-art"
          aria-hidden="true"
        >
          <div className="hero-orb" />

          <div className="hero-silhouette">
            <ShieldAlert className="h-24 w-24" />
          </div>
        </div>

        <div className="system-status">

          <StatusRow
            label="System Status"
            value="Secure"
            tone="green"
          />

          <StatusRow
            label="Last Scan"
            value="2 minutes ago"
          />

          <StatusRow
            label="Database Updated"
            value="1 hour ago"
          />

          <StatusRow
            label="Active Users"
            value="236"
          />

        </div>

      </section>

      {/* METRICS */}

      <section className="metric-grid">

        <MetricCard
          icon={Globe}
          label="URLs Checked"
          value={scanCount ?? 128}
          caption="Today"
          tone="purple"
          trend="+12%"
        />

        <MetricCard
          icon={Lock}
          label="Passwords Checked"
          value="86"
          caption="Today"
          tone="teal"
          trend="+8%"
        />

        <MetricCard
          icon={AlertTriangle}
          label="Threats Detected"
          value={reportCount ?? 12}
          caption="This Week"
          tone="orange"
          trend="+4"
        />

        <MetricCard
          icon={Siren}
          label="Suspicious Activities"
          value="23"
          caption="This Week"
          tone="red"
          trend="+7"
        />

        <MetricCard
          icon={Shield}
          label="Awareness Score"
          value="75%"
          caption="Good"
          tone="blue"
          trend="+15%"
        />

      </section>

      {/* TOP DASHBOARD GRID */}

      <section className="dashboard-grid dashboard-grid-top">

        {/* URL CHECKER */}

        <ToolPanel
          title="URL Threat Checker"
          icon={Link2}
          action="Analyze URL"
          onAction={() =>
            onNavigate('url-checker')
          }
        >

          <div className="mini-input-row">

            <input
              value={latestUrl}
              readOnly
              aria-label="Latest scanned URL"
            />

            <button
              onClick={() =>
                onNavigate('url-checker')
              }
            >
              Analyze URL
            </button>

          </div>

          <div className="url-result">

            <div className="url-warning">

              <AlertTriangle className="h-5 w-5" />

              <small>HIGH RISK</small>

            </div>

            <div className="url-result-copy">

              <strong>High Risk</strong>

              <span>
                This URL is suspicious!
              </span>

            </div>

            <div className="risk-number">

              <small>Risk Score</small>

              <strong>
                8.7<span>/10</span>
              </strong>

            </div>

          </div>

          <div className="issue-list">

            <strong>
              Detected Issues
            </strong>

            <IssueRow
              label="Uses IP Address"
              risk="High Risk"
            />

            <IssueRow
              label="Suspicious Keywords Detected"
              risk="High Risk"
            />

            <IssueRow
              label="Domain Age Is Very Low"
              risk="Medium Risk"
            />

            <IssueRow
              label="No HTTPS Connection"
              risk="Medium Risk"
            />

          </div>

        </ToolPanel>

        {/* PASSWORD */}

        <ToolPanel
          title="Password Strength Checker"
          icon={KeyRound}
          action="Check Strength"
          onAction={() =>
            onNavigate('password')
          }
        >

          <div className="mini-input-row">

            <input
              type="password"
              defaultValue="password123"
              aria-label="Password preview"
            />

            <button
              onClick={() =>
                onNavigate('password')
              }
            >
              Check Strength
            </button>

          </div>

          <div className="password-preview">

            <div className="strength-gauge">

              <div>
                <strong>92%</strong>
                <span>Strong</span>
              </div>

            </div>

            <div className="checklist">

              <strong>
                Strength Checklist
              </strong>

              <Check label="Minimum 8 characters" />

              <Check label="Uppercase letters (A-Z)" />

              <Check label="Lowercase letters (a-z)" />

              <Check label="Numbers (0-9)" />

              <Check label="Special characters (!@#$%?)" />

            </div>

          </div>

        </ToolPanel>

        {/* ACTIVITY */}

        <ToolPanel
          title="Suspicious Activity Monitor"
          icon={Activity}
          action="View All Alerts"
          onAction={() =>
            onNavigate('report')
          }
        >

          <div className="activity-map">

            <span className="map-glow one" />
            <span className="map-glow two" />
            <span className="map-glow three" />

            <div className="map-grid" />

          </div>

          <div className="activity-table">

            {recentReports
              .slice(0, 4)
              .map((report, index) => (

                <ActivityRow
                  key={report.id}
                  location={
                    [
                      'New York, USA',
                      'Moscow, Russia',
                      'Mumbai, India',
                      'London, UK',
                    ][index]
                  }
                  activity={report.report_type.replace(
                    '_',
                    ' '
                  )}
                  risk={report.severity}
                  time={`${index * 5 + 2} min ago`}
                />

              ))}

            {recentReports.length === 0 && (
              <ActivityRow
                location="New York, USA"
                activity="Unusual Login"
                risk="high"
                time="2 min ago"
              />
            )}

          </div>

        </ToolPanel>

      </section>

      {/* BOTTOM GRID */}

      <section className="dashboard-grid dashboard-grid-bottom">

        <AwarenessPanel
          onNavigate={onNavigate}
        />

        <ThreatMapPanel
          onNavigate={onNavigate}
        />

        <ReportPanel
          onNavigate={onNavigate}
        />

      </section>

      {/* QUOTE */}

      <section className="quote-bar">

        <Shield className="h-6 w-6" />

        <span>
          “Cyber security is much more than
          a matter of IT.”
          <em> – Stéphane Nappo</em>
        </span>

        <span className="quote-right">
          Your digital safety starts here.
        </span>

      </section>

    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="status-row">
      <span>{label}</span>

      <strong
        className={
          tone === 'green'
            ? 'status-green'
            : ''
        }
      >
        {value}
      </strong>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  caption,
  tone,
  trend,
}: {
  icon: typeof Globe;
  label: string;
  value: number | string;
  caption: string;
  tone: string;
  trend: string;
}) {
  return (
    <div className={`metric-card tone-${tone}`}>

      <div className="metric-icon">
        <Icon className="h-6 w-6" />
      </div>

      <div className="metric-copy">

        <small>{label}</small>

        <strong>{value}</strong>

        <span>{caption}</span>

      </div>

      <div className="metric-trend">
        {trend}
      </div>

    </div>
  );
}

function ToolPanel({
  title,
  icon: Icon,
  action,
  onAction,
  children,
}: {
  title: string;
  icon: typeof Link2;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="tool-panel">

      <div className="panel-heading">

        <h2>
          <Icon className="h-4 w-4" />
          {title}
        </h2>

        <button onClick={onAction}>
          {action}
          <ArrowRight className="h-3 w-3" />
        </button>

      </div>

      {children}

    </section>
  );
}

function IssueRow({
  label,
  risk,
}: {
  label: string;
  risk: string;
}) {
  return (
    <div className="issue-row">

      <span>
        <i
          className={
            risk === 'High Risk'
              ? 'dot-high'
              : 'dot-medium'
          }
        />

        {label}
      </span>

      <b
        className={
          risk === 'High Risk'
            ? 'risk-high'
            : 'risk-medium'
        }
      >
        {risk}
      </b>

    </div>
  );
}

function Check({
  label,
}: {
  label: string;
}) {
  return (
    <div className="check-row">

      <span>✓</span>

      {label}

      <b>✓</b>

    </div>
  );
}

function ActivityRow({
  location,
  activity,
  risk,
  time,
}: {
  location: string;
  activity: string;
  risk: string;
  time: string;
}) {
  return (
    <div className="activity-row">

      <span>
        <i className={`dot-${risk}`} />
        {location}
      </span>

      <span>{activity}</span>

      <b className={`risk-${risk}`}>
        {risk}
      </b>

      <time>{time}</time>

    </div>
  );
}

/* =========================================================
   AWARENESS
========================================================= */

function AwarenessPanel({
  onNavigate,
}: {
  onNavigate: (view: ViewId) => void;
}) {
  const cards = [
    {
      label: 'Phishing',
      icon: '✉',
      tone: 'violet',
    },
    {
      label: 'Malware',
      icon: '♟',
      tone: 'green',
    },
    {
      label: 'Ransomware',
      icon: '▣',
      tone: 'red',
    },
    {
      label: 'Social Engineering',
      icon: '♟',
      tone: 'purple',
    },
  ];

  return (
    <section className="tool-panel awareness-panel">

      <div className="panel-heading">

        <h2>
          <BookOpen className="h-4 w-4" />
          Cyber Awareness
        </h2>

        <button
          onClick={() =>
            onNavigate('awareness')
          }
        >
          View All
          <ArrowRight className="h-3 w-3" />
        </button>

      </div>

      <div className="awareness-cards">

        {cards.map((card) => (

          <button
            key={card.label}
            className={`awareness-card ${card.tone}`}
            onClick={() =>
              onNavigate('awareness')
            }
          >

            <span>{card.icon}</span>

            <strong>{card.label}</strong>

            <small>
              Learn More →
            </small>

          </button>

        ))}

      </div>

    </section>
  );
}

/* =========================================================
   THREAT MAP
========================================================= */

function ThreatMapPanel({
  onNavigate,
}: {
  onNavigate: (view: ViewId) => void;
}) {
  return (
    <section className="tool-panel map-panel">

      <div className="panel-heading">

        <h2>
          <Target className="h-4 w-4" />
          Threat Map
        </h2>

        <button
          onClick={() =>
            onNavigate('threat-map')
          }
        >
          View Full Map
          <ArrowRight className="h-3 w-3" />
        </button>

      </div>

      <div className="world-map">

        <span className="map-pulse a" />
        <span className="map-pulse b" />
        <span className="map-pulse c" />

      </div>

      <div className="map-legend">

        <span>
          <i className="dot-high" />
          High Risk
        </span>

        <span>
          <i className="dot-medium" />
          Medium Risk
        </span>

        <span>
          <i className="dot-low" />
          Low Risk
        </span>

      </div>

    </section>
  );
}

/* =========================================================
   REPORT
========================================================= */

function ReportPanel({
  onNavigate,
}: {
  onNavigate: (view: ViewId) => void;
}) {
  return (
    <section className="tool-panel report-panel">

      <div className="panel-heading">

        <h2>
          <Siren className="h-4 w-4" />
          Report a Threat
        </h2>

      </div>

      <div className="report-copy">

        <p>
          Help us make the internet safer.
          Report any suspicious activity
          or incident.
        </p>

        <button
          onClick={() =>
            onNavigate('report')
          }
        >
          Report Now
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

      </div>

      <div className="report-art">
        <ShieldAlert className="h-20 w-20" />
      </div>

    </section>
  );
}