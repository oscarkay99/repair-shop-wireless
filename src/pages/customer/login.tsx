import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Chrome, Apple, ArrowRight, CheckCircle } from 'lucide-react';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { isSupabaseConfigured } from '@/services/supabase';

type Mode = 'signin' | 'magic';

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const {
    customer, authLoading, error, magicLinkSent,
    setError, setMagicLinkSent,
    signIn, sendMagicLink, signInWithGoogle, signInWithApple,
  } = useCustomerPortal();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (customer) navigate('/customer/repairs', { replace: true });
  }, [customer, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await signIn(email, password);
    if (ok) navigate('/customer/repairs', { replace: true });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMagicLink(email);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setMagicLinkSent(false);
  };

  const inputStyle = {
    background: 'hsl(var(--muted))',
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: 'hsl(0 80% 12%)' }}
          >
            <span className="text-xl font-black" style={{ color: 'hsl(var(--primary))' }}>W</span>
          </div>
          <h1 className="text-xl font-bold tracking-wide" style={{ color: 'hsl(var(--foreground))' }}>
            WIRELESS
          </h1>
          <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Customer Repair Portal
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          {/* Mode tabs */}
          <div className="flex rounded-lg p-0.5 mb-5" style={{ background: 'hsl(var(--muted))' }}>
            {(['signin', 'magic'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: mode === m ? 'hsl(var(--card))' : 'transparent',
                  color: mode === m ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {m === 'signin' ? 'Password' : 'Magic Link'}
              </button>
            ))}
          </div>

          {/* Magic link sent confirmation */}
          {magicLinkSent ? (
            <div className="text-center py-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(34,197,94,0.12)' }}
              >
                <CheckCircle className="w-6 h-6" style={{ color: '#22c55e' }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                Check your email
              </p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                We sent a sign-in link to <strong>{email}</strong>. Click it to access your repairs.
              </p>
              <button
                onClick={() => setMagicLinkSent(false)}
                className="mt-4 text-xs underline"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Use a different email
              </button>
            </div>
          ) : mode === 'signin' ? (
            /* Email + Password form */
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: 'hsl(var(--primary))' }}
              >
                {authLoading ? 'Signing in…' : (
                  <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          ) : (
            /* Magic link form */
            <form onSubmit={handleMagicLink} className="space-y-3">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Enter the email address associated with your repair record and we'll send you a secure sign-in link.
              </p>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {error && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: 'hsl(var(--primary))' }}
              >
                {authLoading ? 'Sending…' : (
                  <><Mail className="w-4 h-4" /><span>Send Magic Link</span></>
                )}
              </button>
            </form>
          )}

          {/* Social auth */}
          {!magicLinkSent && isSupabaseConfigured && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
              </div>
              <div className="space-y-2">
                <button
                  onClick={signInWithGoogle}
                  className="w-full h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Chrome className="w-4 h-4" />
                  Continue with Google
                </button>
                <button
                  onClick={signInWithApple}
                  className="w-full h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Apple className="w-4 h-4" />
                  Continue with Apple
                </button>
              </div>
            </>
          )}

          {/* Local mode hint */}
          {!isSupabaseConfigured && !magicLinkSent && (
            <p className="text-[10px] text-center mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Demo: use <strong>kwame@example.com</strong> / <strong>repair123</strong>
            </p>
          )}
        </div>

        <p className="text-center text-[10px] mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Your email must match the address provided when your device was dropped off.
        </p>
      </div>
    </div>
  );
}
