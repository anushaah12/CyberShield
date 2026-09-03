import { useCallback, useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import {
  Shield,
  LayoutDashboard,
  Link2,
  Siren,
  BookOpen,
  LogOut,
  Search,
  X,
  Plus,
  Trash2,
  Menu,
  RefreshCw,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
  Bell,
  Users,
  UserCheck,
} from 'lucide-react';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '@/lib/api';

type Stats = {
  scans: number;
  reports: number;
  articles: number;
  admins: number;
  users: number;
};

type Report = {
  id: string;
  reporter_name: string | null;
  report_type: string;
  threat_url: string | null;
  description: string;
  severity: string;
  status: string;
  created_at: string;
};

type Scan = {
  id: string;
  url: string;
  domain: string | null;
  verdict: string;
  risk_score: number;
  reasons: string[];
  created_at: string;
};

type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  read_time: number;
  created_at: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_login: string | null;
};

type ArticleDraft = {
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  read_time: number;
};

type NavItem = {
  id: string;
  label: string;
  icon: ComponentType;
};

const nav: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'reports',
    label: 'Threat Reports',
    icon: Siren,
  },
  {
    id: 'scans',
    label: 'URL Scans',
    icon: Link2,
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
  },
  {
    id: 'articles',
    label: 'Awareness',
    icon: BookOpen,
  },
];

export default function Admin() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('cybershield_admin_token')
  );

  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');

  const [stats, setStats] = useState<Stats>({
    scans: 0,
    reports: 0,
    articles: 0,
    admins: 0,
    users: 0,
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [query, setQuery] = useState('');
  const [mobile, setMobile] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [draft, setDraft] = useState<ArticleDraft>({
    title: '',
    slug: '',
    category: 'phishing',
    summary: '',
    content: '',
    read_time: 5,
  });

  function logout() {
    localStorage.removeItem('cybershield_admin_token');
    setToken(null);
  }

  const load = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const [s, r, sc, u, a] = await Promise.all([
        apiGet<{ stats: Stats }>('/admin/stats'),
        apiGet<{ items: Report[] }>('/admin/reports'),
        apiGet<{ items: Scan[] }>('/admin/scans'),
        apiGet<{ items: User[] }>('/admin/users'),
        apiGet<{ items: Article[] }>('/admin/articles'),
      ]);

      setStats(s.stats);
      setReports(r.items);
      setScans(sc.items);
      setUsers(u.items);
      setArticles(a.items);
      setError('');
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Could not load admin data';

      setError(message);

      if (
        message.toLowerCase().includes('authentication') ||
        message.toLowerCase().includes('unauthorized')
      ) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      void load();
    }
  }, [token, load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const r = await apiPost<{ token: string }>(
        '/admin/login',
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        'cybershield_admin_token',
        r.token
      );

      setToken(r.token);
      setPassword('');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Invalid credentials'
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateReport(
    id: string,
    changes: Partial<Report>
  ) {
    try {
      const r = await apiPatch<{ item: Report }>(
        `/admin/reports/${id}`,
        changes
      );

      setReports((current) =>
        current.map((item) =>
          item.id === id ? r.item : item
        )
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not update report'
      );
    }
  }

  async function addArticle(e: React.FormEvent) {
    e.preventDefault();

    try {
      await apiPost('/admin/articles', draft);

      setShowForm(false);

      setDraft({
        title: '',
        slug: '',
        category: 'phishing',
        summary: '',
        content: '',
        read_time: 5,
      });

      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not add article'
      );
    }
  }

  async function updateUser(
    id: string,
    status: string
  ) {
    try {
      const r = await apiPatch<{ item: User }>(
        `/admin/users/${id}`,
        { status }
      );

      setUsers((current) =>
        current.map((item) =>
          item.id === id ? r.item : item
        )
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not update user'
      );
    }
  }

  async function deleteArticle(id: string) {
    if (!confirm('Delete this article?')) return;

    try {
      await apiDelete(`/admin/articles/${id}`);
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not delete article'
      );
    }
  }

  if (!token) {
    return (
      <Login
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        error={error}
        onSubmit={login}
      />
    );
  }

  const searchText = query.toLowerCase();

  const filteredReports = reports.filter((report) =>
    JSON.stringify(report)
      .toLowerCase()
      .includes(searchText)
  );

  const filteredScans = scans.filter((scan) =>
    JSON.stringify(scan)
      .toLowerCase()
      .includes(searchText)
  );

  const filteredUsers = users.filter((user) =>
    JSON.stringify(user)
      .toLowerCase()
      .includes(searchText)
  );

  return (
    <div className="admin-shell">
      <aside
        className={`admin-sidebar ${
          mobile ? 'open' : ''
        }`}
      >
        <div className="admin-brand">
          <div className="brand-mark">
            <Shield />
          </div>

          <div>
            <b>CYBERSHIELD</b>
            <small>ADMIN CONSOLE</small>
          </div>
        </div>

        <div className="admin-nav-label">
          CONTROL CENTER
        </div>

        <nav>
          {nav.map(
            ({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={
                  tab === id ? 'active' : ''
                }
                onClick={() => {
                  setTab(id);
                  setMobile(false);
                }}
              >
                <Icon />
                <span>{label}</span>
              </button>
            )
          )}
        </nav>

        <div className="admin-side-footer">
          <div>
            <span className="online-dot" /> System
            online
          </div>

          <button onClick={logout}>
            <LogOut /> Sign out
          </button>
        </div>
      </aside>

      {mobile && (
        <button
          className="admin-scrim"
          onClick={() => setMobile(false)}
          aria-label="Close menu"
        />
      )}

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu"
            onClick={() => setMobile(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <div>
            <span className="admin-kicker">
              SECURITY OPERATIONS
            </span>

            <h1>
              {nav.find(
                (item) => item.id === tab
              )?.label}
            </h1>
          </div>

          <div className="admin-top-actions">
            <div className="admin-search">
              <Search />

              <input
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                placeholder="Search records..."
              />
            </div>

            <button
              className="admin-refresh"
              onClick={() => void load()}
              aria-label="Refresh"
            >
              <RefreshCw
                className={
                  loading ? 'spin' : ''
                }
              />
            </button>
          </div>
        </header>

        {error && (
          <div className="admin-error">
            <X />
            <span>{error}</span>

            <button
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="admin-content">
          {tab === 'overview' && (
            <Overview
              stats={stats}
              reports={reports}
              scans={scans}
              onTab={setTab}
            />
          )}

          {tab === 'reports' && (
            <Reports
              reports={filteredReports}
              onUpdate={updateReport}
            />
          )}

          {tab === 'scans' && (
            <Scans scans={filteredScans} />
          )}

          {tab === 'users' && (
            <UsersTable
              users={filteredUsers}
              onUpdate={updateUser}
            />
          )}

          {tab === 'articles' && (
            <Articles
              articles={articles}
              showForm={showForm}
              setShowForm={setShowForm}
              draft={draft}
              setDraft={setDraft}
              onAdd={addArticle}
              onDelete={deleteArticle}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function Login({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  onSubmit,
}: {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [showPassword, setShowPassword] =
    useState(false);

  return (
    <div className="admin-login-photo-page">
      <section
        className="admin-login-visual"
        aria-label="CyberShield administrator security illustration"
      >
        <div className="admin-login-visual-overlay" />

        <div className="admin-photo-brand">
          <div className="admin-photo-brand-mark">
            <Shield />
          </div>

          <div>
            <strong>
              CYBER<span>SHIELD</span>
            </strong>

            <small>
              Smart Protection. Safe Future.
            </small>
          </div>
        </div>

        <div className="admin-threat-badge badge-one">
          <AlertTriangle />

          <span>
            Suspicious
            <br />
            Activity
          </span>
        </div>

        <div className="admin-threat-badge badge-two">
          <Lock />

          <span>
            Unauthorized
            <br />
            Access
          </span>
        </div>

        <div className="admin-threat-badge badge-three">
          <AlertTriangle />

          <span>
            Data
            <br />
            Breach
          </span>
        </div>

        <div className="admin-threat-badge badge-four">
          <ShieldCheck />

          <span>
            System
            <br />
            Protected
          </span>
        </div>

        <div className="admin-photo-copy">
          <h2>
            Admin Control.
            <br />
            <span>Stronger Protection.</span>
          </h2>

          <p>
            Monitor reports, review suspicious
            activity and manage CyberShield
            awareness content from one secure
            console.
          </p>

          <div className="admin-photo-features">
            <div>
              <span>
                <ShieldCheck />
              </span>

              <small>
                Threat
                <br />
                Monitoring
              </small>
            </div>

            <div>
              <span>
                <KeyRound />
              </span>

              <small>
                Secure
                <br />
                Access
              </small>
            </div>

            <div>
              <span>
                <BookOpen />
              </span>

              <small>
                Awareness
                <br />
                Control
              </small>
            </div>

            <div>
              <span>
                <Bell />
              </span>

              <small>
                Instant
                <br />
                Alerts
              </small>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-login-form-side">
        <div className="admin-login-form-card">
          <div className="admin-login-shield">
            <Shield />
          </div>

          <div className="admin-login-heading">
            <span className="admin-login-kicker">
              ADMIN CONSOLE
            </span>

            <h1>Welcome Back!</h1>

            <p>
              Login to your CyberShield
              administrator account
            </p>
          </div>

          {error && (
            <div className="admin-login-message">
              <AlertTriangle />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit}>
            <label htmlFor="admin-email">
              Email Address
            </label>

            <div className="admin-login-input">
              <Mail />

              <input
                id="admin-email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                type="email"
                placeholder="Enter admin email"
                required
                autoComplete="username"
              />
            </div>

            <label htmlFor="admin-password">
              Password
            </label>

            <div className="admin-login-input">
              <Lock />

              <input
                id="admin-password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff />
                ) : (
                  <Eye />
                )}
              </button>
            </div>

            <div className="admin-login-help">
              Authorized administrators only
            </div>

            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading}
            >
              {loading ? (
                'Authenticating…'
              ) : (
                <>
                  Login <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="admin-login-divider">
            <span>SECURE ACCESS</span>
          </div>

          <a
            className="admin-back-user"
            href="/"
          >
            ← Back to CyberShield user login
          </a>

          <small className="admin-login-hint">
            Default admin: admin@gmail.com /
            Admin@12345
          </small>
        </div>
      </section>
    </div>
  );
}

function Overview({
  stats,
  reports,
  scans,
  onTab,
}: {
  stats: Stats;
  reports: Report[];
  scans: Scan[];
  onTab: (tab: string) => void;
}) {
  const critical = reports.filter(
    (report) =>
      report.severity === 'critical'
  ).length;

  const pending = reports.filter(
    (report) =>
      report.status !== 'resolved'
  ).length;

  const statItems: {
    label: string;
    value: number;
    icon: ComponentType;
    tone: string;
    tab: string;
  }[] = [
    {
      label: 'Threat reports',
      value: stats.reports,
      icon: Siren,
      tone: 'rose',
      tab: 'reports',
    },
    {
      label: 'URL scans',
      value: stats.scans,
      icon: Link2,
      tone: 'cyan',
      tab: 'scans',
    },
    {
      label: 'Awareness articles',
      value: stats.articles,
      icon: BookOpen,
      tone: 'violet',
      tab: 'articles',
    },
    {
      label: 'Registered users',
      value: stats.users,
      icon: Users,
      tone: 'cyan',
      tab: 'users',
    },
    {
      label: 'Open reports',
      value: pending,
      icon: Siren,
      tone: 'amber',
      tab: 'reports',
    },
  ];

  return (
    <>
      <div className="admin-hero">
        <div>
          <span className="admin-kicker">
            LIVE DATABASE
          </span>

          <h2>
            Security operations at a glance
          </h2>

          <p>
            Manage the CyberShield community
            data from one place. Changes are
            saved directly to SQLite.
          </p>
        </div>

        <div className="admin-hero-badge">
          <Shield /> Protected
        </div>
      </div>

      <div className="admin-stat-grid">
        {statItems.map(
          ({
            label,
            value,
            icon: Icon,
            tone,
            tab: targetTab,
          }) => (
            <button
              className={`admin-stat ${tone}`}
              key={label}
              onClick={() =>
                onTab(targetTab)
              }
            >
              <Icon />

              <div>
                <span>{label}</span>

                <strong>
                  {String(value)}
                </strong>
              </div>
            </button>
          )
        )}
      </div>

      <div className="admin-grid-2">
        <div className="admin-panel">
          <div className="panel-title">
            <div>
              <h3>Recent reports</h3>

              <span>
                {critical} critical reports
              </span>
            </div>

            <button
              onClick={() =>
                onTab('reports')
              }
            >
              View all →
            </button>
          </div>

          {reports
            .slice(0, 5)
            .map((report) => (
              <div
                className="activity-row"
                key={report.id}
              >
                <span
                  className={`severity-dot ${report.severity}`}
                />

                <div>
                  <b>
                    {report.report_type.replace(
                      '_',
                      ' '
                    )}
                  </b>

                  <small>
                    {report.reporter_name ||
                      'Anonymous'}{' '}
                    · {report.status}
                  </small>
                </div>

                <time>
                  {new Date(
                    report.created_at
                  ).toLocaleString()}
                </time>
              </div>
            ))}

          {!reports.length && <Empty />}
        </div>

        <div className="admin-panel">
          <div className="panel-title">
            <div>
              <h3>Latest URL scans</h3>

              <span>
                Most recent checks
              </span>
            </div>

            <button
              onClick={() =>
                onTab('scans')
              }
            >
              View all →
            </button>
          </div>

          {scans
            .slice(0, 5)
            .map((scan) => (
              <div
                className="activity-row"
                key={scan.id}
              >
                <span
                  className={`verdict-dot ${scan.verdict}`}
                />

                <div>
                  <b>
                    {scan.domain ||
                      scan.url}
                  </b>

                  <small>
                    {scan.verdict} · risk{' '}
                    {scan.risk_score}/100
                  </small>
                </div>

                <time>
                  {new Date(
                    scan.created_at
                  ).toLocaleString()}
                </time>
              </div>
            ))}

          {!scans.length && <Empty />}
        </div>
      </div>
    </>
  );
}

function Empty() {
  return (
    <div className="admin-empty">
      No records yet.
    </div>
  );
}

function Reports({
  reports,
  onUpdate,
}: {
  reports: Report[];
  onUpdate: (
    id: string,
    changes: Partial<Report>
  ) => void;
}) {
  return (
    <div className="admin-panel table-panel">
      <div className="panel-title">
        <div>
          <h3>Threat reports</h3>

          <span>
            Review and resolve community
            submissions
          </span>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Reporter</th>
              <th>Description</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>
                  <b className="capitalize">
                    {report.report_type.replace(
                      '_',
                      ' '
                    )}
                  </b>

                  <small>
                    {report.threat_url ||
                      'No URL'}
                  </small>
                </td>

                <td>
                  {report.reporter_name ||
                    'Anonymous'}
                </td>

                <td className="description-cell">
                  {report.description}
                </td>

                <td>
                  <select
                    value={report.severity}
                    onChange={(e) =>
                      onUpdate(report.id, {
                        severity:
                          e.target.value,
                      })
                    }
                  >
                    {[
                      'low',
                      'medium',
                      'high',
                      'critical',
                    ].map((value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <select
                    value={report.status}
                    onChange={(e) =>
                      onUpdate(report.id, {
                        status:
                          e.target.value,
                      })
                    }
                  >
                    {[
                      'submitted',
                      'reviewing',
                      'resolved',
                    ].map((value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  {new Date(
                    report.created_at
                  ).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!reports.length && <Empty />}
      </div>
    </div>
  );
}

function Scans({
  scans,
}: {
  scans: Scan[];
}) {
  return (
    <div className="admin-panel table-panel">
      <div className="panel-title">
        <div>
          <h3>URL scan history</h3>

          <span>
            All analysis results stored in
            SQLite
          </span>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Verdict</th>
              <th>Risk</th>
              <th>Analysis reasons</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {scans.map((scan) => (
              <tr key={scan.id}>
                <td>
                  <b>
                    {scan.domain ||
                      'Unknown domain'}
                  </b>

                  <small>
                    {scan.url}
                  </small>
                </td>

                <td>
                  <span
                    className={`pill ${scan.verdict}`}
                  >
                    {scan.verdict}
                  </span>
                </td>

                <td>
                  <b>
                    {scan.risk_score}/100
                  </b>
                </td>

                <td className="description-cell">
                  {scan.reasons.join(' · ')}
                </td>

                <td>
                  {new Date(
                    scan.created_at
                  ).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!scans.length && <Empty />}
      </div>
    </div>
  );
}

function UsersTable({
  users,
  onUpdate,
}: {
  users: User[];
  onUpdate: (
    id: string,
    status: string
  ) => void;
}) {
  return (
    <div className="admin-panel table-panel">
      <div className="panel-title">
        <div>
          <h3>Registered users</h3>

          <span>
            Users synchronized from
            CyberShield sign-in and sign-up
          </span>
        </div>

        <div className="admin-user-count">
          <UserCheck /> {users.length} users
        </div>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last login</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <b>{user.name}</b>

                  <small>
                    {user.id}
                  </small>
                </td>

                <td>{user.email}</td>

                <td>
                  <span className="pill">
                    {user.role}
                  </span>
                </td>

                <td>
                  <select
                    value={user.status}
                    onChange={(e) =>
                      onUpdate(
                        user.id,
                        e.target.value
                      )
                    }
                  >
                    <option value="active">
                      active
                    </option>

                    <option value="suspended">
                      suspended
                    </option>
                  </select>
                </td>

                <td>
                  {new Date(
                    user.created_at
                  ).toLocaleDateString()}
                </td>

                <td>
                  {user.last_login
                    ? new Date(
                        user.last_login
                      ).toLocaleString()
                    : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!users.length && <Empty />}
      </div>
    </div>
  );
}

function Articles({
  articles,
  showForm,
  setShowForm,
  draft,
  setDraft,
  onAdd,
  onDelete,
}: {
  articles: Article[];
  showForm: boolean;
  setShowForm: (value: boolean) => void;
  draft: ArticleDraft;
  setDraft: (value: ArticleDraft) => void;
  onAdd: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="admin-panel">
      <div className="panel-title">
        <div>
          <h3>Awareness library</h3>

          <span>
            Publish and maintain security
            education
          </span>
        </div>

        <button
          className="primary-btn"
          onClick={() =>
            setShowForm(!showForm)
          }
        >
          <Plus /> New article
        </button>
      </div>

      {showForm && (
        <form
          className="article-form"
          onSubmit={onAdd}
        >
          <div className="form-grid">
            <label>
              Title

              <input
                required
                value={draft.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    title: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Slug

              <input
                required
                value={draft.slug}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    slug: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Category

              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    category: e.target.value,
                  })
                }
              >
                {[
                  'phishing',
                  'passwords',
                  'privacy',
                  'malware',
                  'social',
                  'data',
                ].map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Read time

              <input
                type="number"
                min="1"
                value={draft.read_time}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    read_time: Number(
                      e.target.value
                    ),
                  })
                }
              />
            </label>
          </div>

          <label>
            Summary

            <textarea
              required
              rows={2}
              value={draft.summary}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  summary: e.target.value,
                })
              }
            />
          </label>

          <label>
            Content

            <textarea
              required
              rows={6}
              value={draft.content}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  content: e.target.value,
                })
              }
            />
          </label>

          <div className="form-actions">
            <button
              type="button"
              onClick={() =>
                setShowForm(false)
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-btn"
            >
              Publish article
            </button>
          </div>
        </form>
      )}

      <div className="article-admin-list">
        {articles.map((article) => (
          <div
            className="article-admin-card"
            key={article.id}
          >
            <div>
              <span className="article-tag">
                {article.category}
              </span>

              <h4>{article.title}</h4>

              <p>{article.summary}</p>

              <small>
                {article.read_time} min read ·{' '}
                {new Date(
                  article.created_at
                ).toLocaleDateString()}
              </small>
            </div>

            <button
              type="button"
              className="danger-icon"
              onClick={() =>
                onDelete(article.id)
              }
              aria-label={`Delete ${article.title}`}
            >
              <Trash2 />
            </button>
          </div>
        ))}
      </div>

      {!articles.length && <Empty />}
    </div>
  );
}