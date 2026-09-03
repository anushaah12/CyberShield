import { useEffect, useState } from 'react';
import { Siren, Loader2, CheckCircle2, AlertTriangle, Globe, Send } from 'lucide-react';
import { type ThreatReport } from '@/lib/supabase';
import { apiGet, apiPost } from '@/lib/api';
import { ViewHeader } from '@/components/UrlChecker';

const REPORT_TYPES = [
  { id: 'phishing', label: 'Phishing', desc: 'Fraudulent emails, messages, or websites' },
  { id: 'malware', label: 'Malware', desc: 'Viruses, ransomware, or spyware' },
  { id: 'data_breach', label: 'Data Breach', desc: 'Exposed or stolen personal data' },
  { id: 'social_engineering', label: 'Social Engineering', desc: 'Manipulation or impersonation' },
  { id: 'identity_theft', label: 'Identity Theft', desc: 'Someone using your identity' },
  { id: 'other', label: 'Other', desc: 'Any other suspicious activity' },
] as const;

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  high: 'bg-orange-500/15 text-orange-400 ring-orange-500/30',
  critical: 'bg-rose-500/15 text-rose-400 ring-rose-500/30',
};

export default function ReportThreat() {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('phishing');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<string>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ThreatReport[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    const { items } = await apiGet<{ items: ThreatReport[] }>('/reports');
    setReports(items.slice(0, 30));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await apiPost('/reports', {
        reporter_name: name.trim() || null,
        report_type: type,
        threat_url: url.trim() || null,
        description: description.trim(),
        severity,
      });
    } catch {
      setSubmitting(false);
      setError('Could not submit your report. Please try again.');
      return;
    }

    setSubmitting(false);

    setSuccess(true);
    setName('');
    setUrl('');
    setDescription('');
    setSeverity('medium');
    setType('phishing');
    loadReports();
  }

  return (
    <div className="space-y-8">
      <ViewHeader
        icon={Siren}
        title="Report a Threat"
        subtitle="Report suspicious activity you've encountered. Your report is added to the community board so others can stay informed."
      />

      {success && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Your report has been submitted. Thank you for helping keep the community safe.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
            {/* Type */}
            <div>
              <label className="mb-3 block text-sm font-medium text-slate-300">Threat Type</label>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {REPORT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      type === t.id
                        ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-200">{t.label}</div>
                    <div className="text-xs text-slate-500">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Your Name <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anonymous"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* URL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Related URL <span className="text-slate-500">(optional)</span>
              </label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://suspicious-site.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-3 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Severity</label>
              <div className="flex flex-wrap gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ring-1 ${
                      severity === s ? SEVERITY_STYLES[s] : 'bg-slate-800/50 text-slate-400 ring-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, what you saw, and any details that could help others..."
                rows={5}
                required
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:shadow-rose-500/40 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

        {/* Community board */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="mb-4 font-semibold">Community Threat Board</h3>
            {reports.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No reports yet. Be the first to report a threat.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-xl bg-slate-800/40 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold capitalize text-slate-200">{r.report_type.replace('_', ' ')}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${SEVERITY_STYLES[r.severity]}`}>
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{r.description}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{r.reporter_name || 'Anonymous'}</span>
                      <span className="rounded-full bg-slate-700/50 px-2 py-0.5 capitalize">{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
