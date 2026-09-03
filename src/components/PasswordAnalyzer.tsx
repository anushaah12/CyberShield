import { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  Shield
} from 'lucide-react';

import { analyzePassword } from '@/lib/passwordAnalyzer';
import { ViewHeader } from '@/components/UrlChecker';

export default function PasswordAnalyzer() {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  const result = password ? analyzePassword(password) : null;

  const verdictConfig = {
    weak: {
      label: 'Weak',
      color: 'text-rose-400',
      bar: 'bg-rose-500',
      ring: 'from-rose-500 to-red-600'
    },
    fair: {
      label: 'Fair',
      color: 'text-amber-400',
      bar: 'bg-amber-500',
      ring: 'from-amber-500 to-orange-500'
    },
    strong: {
      label: 'Strong',
      color: 'text-cyan-400',
      bar: 'bg-cyan-500',
      ring: 'from-cyan-500 to-blue-500'
    },
    'very-strong': {
      label: 'Very Strong',
      color: 'text-emerald-400',
      bar: 'bg-emerald-500',
      ring: 'from-emerald-500 to-teal-500'
    }
  };

  return (
    <div className="space-y-8">
      <ViewHeader
        icon={KeyRound}
        title="Password Strength Analyzer"
        subtitle="Test how strong your password is. Analysis happens entirely in your browser — your password is never sent anywhere or stored."
      />

      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        <Shield className="h-4 w-4 shrink-0" />
        100% local analysis. Nothing leaves your device.
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Enter a password to test
        </label>

        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Type or paste a password..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-3.5 pl-12 pr-12 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            autoComplete="off"
            spellCheck={false}
          />

          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {result && (
        <>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Strength</div>

                <div
                  className={`text-3xl font-bold ${
                    verdictConfig[result.verdict].color
                  }`}
                >
                  {verdictConfig[result.verdict].label}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-slate-500">Score</div>

                <div className="text-3xl font-bold text-slate-200">
                  {result.score}
                  <span className="text-lg text-slate-500">/100</span>
                </div>
              </div>
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${
                  verdictConfig[result.verdict].bar
                } transition-all duration-500`}
                style={{
                  width: `${Math.max(2, result.score)}%`
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatBox
              icon={Zap}
              label="Entropy"
              value={`${result.entropy} bits`}
              color="text-cyan-400"
            />

            <StatBox
              icon={Clock}
              label="Est. crack time"
              value={result.crackTime}
              color="text-amber-400"
            />

            <StatBox
              icon={KeyRound}
              label="Length"
              value={`${result.length} chars`}
              color="text-emerald-400"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="mb-4 font-semibold">
              Security Checklist
            </h3>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {result.checks.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg bg-slate-800/40 px-3 py-2.5"
                >
                  {c.passed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  )}

                  <span
                    className={`text-sm ${
                      c.passed
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="mb-3 font-semibold">
              Recommendations
            </h3>

            <ul className="space-y-2">
              {result.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-slate-400"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {!password && (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
          <KeyRound className="mx-auto h-10 w-10 text-slate-700" />

          <p className="mt-3 text-sm text-slate-500">
            Start typing above to see your password analysis.
          </p>
        </div>
      )}
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: typeof KeyRound;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <Icon className={`h-5 w-5 ${color}`} />

      <div className="mt-3 text-xl font-bold">
        {value}
      </div>

      <div className="text-xs text-slate-500">
        {label}
      </div>
    </div>
  );
}