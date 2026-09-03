import { useState, useEffect } from 'react';
import { Shield, Mail, Lock, User, Loader2, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { apiPost } from '@/lib/api';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setInfo(null);
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: { data: { full_name: name.trim() || 'CyberShield User' } },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          await apiPost('/users/sync', { id: data.user.id, email: data.user.email, name: name.trim() || 'CyberShield User' });
        }
        if (data.user && !data.session) {
          setInfo('Account created! Check your email to confirm, or sign in if confirmation is off.');
          setMode('signin');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (signInError) throw signInError;
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          await apiPost('/users/sync', { id: sessionData.session.user.id, email: sessionData.session.user.email, name: sessionData.session.user.user_metadata?.full_name || 'CyberShield User' });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-container">
        {/* Left panel */}
        <div className="login-left">
          <div className="login-brand">
            <div className="login-brand-mark"><Shield className="h-8 w-8" strokeWidth={2.5} /></div>
            <div><strong>CYBERSHIELD</strong><span>Smart Protection. Safe Future.</span></div>
          </div>
          <h2>Defend yourself against <span>cyber threats</span></h2>
          <p>Check suspicious URLs, test your passwords, learn security best practices, and report threats — all in one place.</p>
          <ul className="login-features">
            <li><CheckCircle2 className="h-4 w-4" /> Real-time URL threat analysis</li>
            <li><CheckCircle2 className="h-4 w-4" /> Local password strength checking</li>
            <li><CheckCircle2 className="h-4 w-4" /> Curated cyber awareness guides</li>
            <li><CheckCircle2 className="h-4 w-4" /> Community threat reporting & map</li>
          </ul>
        </div>

        {/* Right panel — form */}
        <div className="login-right">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <div className="login-form-icon"><Shield className="h-7 w-7" /></div>
              <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
              <p>{mode === 'signin' ? 'Sign in to access your CyberShield dashboard' : 'Join CyberShield to start protecting yourself online'}</p>
            </div>

            {error && (
              <div className="login-alert error"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>
            )}
            {info && (
              <div className="login-alert success"><CheckCircle2 className="h-4 w-4 shrink-0" />{info}</div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              {mode === 'signup' && (
                <div className="login-field">
                  <User className="h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Full name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="login-field">
                <Mail className="h-4 w-4" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="login-field">
                <Lock className="h-4 w-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="login-eye" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <div className="login-switch">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
