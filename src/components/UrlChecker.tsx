import { useEffect, useState } from 'react';
import {
  Link2,
  Search,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Globe,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';

import { analyzeUrl, type UrlAnalysisResult } from '@/lib/urlAnalyzer';
import { type UrlScan } from '@/lib/supabase';
import { apiGet, apiPost } from '@/lib/api';

export default function UrlChecker() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] =
    useState<UrlAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<UrlScan[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  async function loadHistory() {
    try {
      const { items } = await apiGet<{ items: UrlScan[] }>(
        '/scans'
      );

      setHistory(items.slice(0, 20));
      setHistoryLoaded(true);
    } catch {
      setHistoryLoaded(true);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = analyzeUrl(input);

      await apiPost('/scans', {
        url: analysis.url,
        domain: analysis.domain,
        verdict: analysis.verdict,
        risk_score: analysis.riskScore,
        reasons: analysis.reasons
      });

      setResult(analysis);
      loadHistory();
    } catch {
      setError(
        'Could not save the scan result. Please try again.'
      );

      setResult(analyzeUrl(input));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <ViewHeader
        icon={Link2}
        title="URL Threat Checker"
        subtitle="Paste any link to get an instant risk assessment. We analyze the URL structure for phishing, malware, and impersonation signals."
      />

      <form onSubmit={handleCheck}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Globe className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="example.com or https://suspicious-link.com/login"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}

            {loading ? 'Analyzing...' : 'Check URL'}
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && <ResultCard result={result} />}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="mb-4 font-semibold">
          Community Scan History
        </h3>

        {!historyLoaded ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Loading scan history...
          </p>
        ) : history.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No scans yet. Be the first to check a URL.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map(s => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg bg-slate-800/40 px-3 py-3"
              >
                <VerdictBadge verdict={s.verdict} />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-200">
                    {s.domain || s.url}
                  </div>

                  <div className="truncate text-xs text-slate-500">
                    {s.url}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-300">
                    {s.risk_score}/100
                  </div>

                  <div className="text-xs text-slate-500">
                    {timeAgo(s.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  result
}: {
  result: UrlAnalysisResult;
}) {
  const config = {
    safe: {
      icon: ShieldCheck,
      label: 'Safe',
      color: 'text-emerald-400',
      bg: 'border-emerald-500/30 bg-emerald-500/5',
      ring: 'from-emerald-500 to-teal-500',
      bar: 'bg-emerald-500'
    },
    suspicious: {
      icon: ShieldAlert,
      label: 'Suspicious',
      color: 'text-amber-400',
      bg: 'border-amber-500/30 bg-amber-500/5',
      ring: 'from-amber-500 to-orange-500',
      bar: 'bg-amber-500'
    },
    dangerous: {
      icon: AlertTriangle,
      label: 'Dangerous',
      color: 'text-rose-400',
      bg: 'border-rose-500/30 bg-rose-500/5',
      ring: 'from-rose-500 to-red-600',
      bar: 'bg-rose-500'
    }
  }[result.verdict];

  const Icon = config.icon;

  return (
    <div
      className={`rounded-2xl border ${config.bg} p-6`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${config.ring} shadow-lg`}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold ${config.color}`}
            >
              {config.label}
            </span>

            <span className="text-sm text-slate-500">
              ·
            </span>

            <span className="text-sm text-slate-400">
              Risk score {result.riskScore}/100
            </span>
          </div>

          <div className="mt-1 truncate text-sm text-slate-400">
            {result.domain || result.url}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full ${config.bar} transition-all duration-700`}
            style={{
              width: `${Math.max(3, result.riskScore)}%`
            }}
          />
        </div>
      </div>

      <div className="mt-5">
        <h4 className="mb-3 text-sm font-semibold text-slate-300">
          Analysis Details
        </h4>

        <ul className="space-y-2">
          {result.reasons.map((r, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm text-slate-400"
            >
              {result.verdict === 'safe' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <XCircle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`}
                />
              )}

              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function VerdictBadge({
  verdict
}: {
  verdict: string;
}) {
  const config = {
    safe: {
      label: 'Safe',
      cls: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
    },
    suspicious: {
      label: 'Suspicious',
      cls: 'bg-amber-500/15 text-amber-400 ring-amber-500/30'
    },
    dangerous: {
      label: 'Dangerous',
      cls: 'bg-rose-500/15 text-rose-400 ring-rose-500/30'
    }
  }[verdict] ?? {
    label: verdict,
    cls: 'bg-slate-500/15 text-slate-400 ring-slate-500/30'
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${config.cls}`}
    >
      {config.label}
    </span>
  );
}

export function ViewHeader({
  icon: Icon,
  title,
  subtitle
}: {
  icon: typeof Link2;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
        <Icon className="h-6 w-6 text-white" />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {title}
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff =
    Date.now() - new Date(iso).getTime();

  const m = Math.floor(diff / 60000);

  if (m < 1) return 'just now';

  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);

  if (h < 24) return `${h}h ago`;

  const d = Math.floor(h / 24);

  return `${d}d ago`;
}