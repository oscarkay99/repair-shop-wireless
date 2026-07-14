import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2,
  ArrowLeft, KeyRound, MailCheck, AlertCircle, CheckCircle2,
  LogIn,
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    name: 'Kwame Asante', role: 'Admin', email: 'admin@wireless.com', password: 'admin123', avatar: 'KA',
    color: '#DC1F1F', badgeBg: 'hsl(350 60% 95%)', hoverBg: 'hsl(350 60% 96%)', hoverBorder: 'hsl(350 60% 85%)',
    access: ['Dashboard', 'Repairs', 'Inventory', 'Sales', 'Analytics', 'Team', 'Settings', '+ more'],
  },
  {
    name: 'Efua Boateng', role: 'Receptionist', email: 'efua@wireless.com', password: 'efua123', avatar: 'EB',
    color: '#8B5CF6', badgeBg: 'hsl(262 60% 95%)', hoverBg: 'hsl(262 60% 96%)', hoverBorder: 'hsl(262 60% 85%)',
    access: ['Dashboard', 'Repairs', 'Customers', 'Payments', 'Invoices'],
  },
  {
    name: 'Ama Owusu', role: 'Technician', email: 'ama@wireless.com', password: 'ama123', avatar: 'AO',
    color: '#06B6D4', badgeBg: 'hsl(190 80% 93%)', hoverBg: 'hsl(190 80% 95%)', hoverBorder: 'hsl(190 60% 80%)',
    access: ['Dashboard', 'Repairs', 'Warranty', 'Inventory', 'Customers'],
  },
  {
    name: 'Kofi Mensah', role: 'Sales Manager', email: 'kofi@wireless.com', password: 'kofi123', avatar: 'KM',
    color: '#F59E0B', badgeBg: 'hsl(38 90% 93%)', hoverBg: 'hsl(38 90% 95%)', hoverBorder: 'hsl(38 70% 80%)',
    access: ['Dashboard', 'Sales', 'Customers', 'Inventory', 'Repairs', 'Analytics', 'Reports'],
  },
  {
    name: 'Yaw Darko', role: 'Inventory Manager', email: 'yaw@wireless.com', password: 'yaw123', avatar: 'YD',
    color: '#64748B', badgeBg: 'hsl(215 20% 93%)', hoverBg: 'hsl(215 20% 95%)', hoverBorder: 'hsl(215 20% 80%)',
    access: ['Dashboard', 'Analytics', 'Inventory', 'Delivery', 'Reports'],
  },
];

const modules = [
  { icon: 'ri-store-3-line', label: 'POS' },
  { icon: 'ri-tools-line', label: 'Repairs' },
  { icon: 'ri-bar-chart-2-line', label: 'Analytics' },
  { icon: 'ri-vip-crown-line', label: 'Loyalty' },
  { icon: 'ri-archive-line', label: 'Inventory' },
  { icon: 'ri-shield-check-line', label: 'Warranty' },
  { icon: 'ri-calculator-line', label: 'Expenses' },
  { icon: 'ri-truck-line', label: 'Delivery' },
  { icon: 'ri-wallet-3-line', label: 'Wallet' },
  { icon: 'ri-sparkling-2-line', label: 'AI Studio' },
];

export default function SignInPage() {
  const navigate = useNavigate();
  const { login, resetPassword, isSupabaseAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const [view, setView] = useState<'signin' | 'forgot' | 'reset_sent'>('signin');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      setLoginSuccess(true);
      await new Promise(r => setTimeout(r, 600));
      navigate('/');
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { setForgotError('Please enter your email address'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) { setForgotError('Please enter a valid email address'); return; }
    setForgotLoading(true);
    setForgotError('');
    const result = await resetPassword(forgotEmail);
    setForgotLoading(false);
    if (result.success) { setView('reset_sent'); return; }
    setForgotError(result.error || 'Unable to send reset link');
  };

  const quickLogin = async (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setError('');
    setLoading(true);
    const result = await login(userEmail, userPassword);
    setLoading(false);
    if (result.success) {
      setLoginSuccess(true);
      await new Promise(r => setTimeout(r, 600));
      navigate('/');
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  const inputBase: React.CSSProperties = {
    background: 'hsl(220 20% 97%)',
    border: '1.5px solid hsl(220 13% 90%)',
    color: 'hsl(220 20% 12%)',
    borderRadius: 10,
    width: '100%',
    fontSize: 14,
    outline: 'none',
    boxShadow: 'inset 0 1px 2px hsl(220 20% 12% / 0.03)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const inputFocus: React.CSSProperties = {
    border: '1.5px solid hsl(350 60% 55%)',
    boxShadow: '0 0 0 3px hsl(350 60% 55% / 0.12)',
  };

  return (
    <div
      className="min-h-screen lg:grid lg:grid-cols-[1.1fr_0.9fr] overflow-hidden"
      style={{ background: 'hsl(220 14% 95%)' }}
    >
      {/* ── LEFT PANEL (dark wine brand side) ── */}
      <div className="hidden lg:flex relative min-h-screen overflow-hidden" style={{ background: 'hsl(350 38% 10%)' }}>
        {/* Single soft glow, off-center */}
        <div className="absolute top-[10%] right-[-10%] w-[480px] h-[480px] rounded-full pointer-events-none blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(350 55% 22% / 0.35) 0%, transparent 72%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-56 pointer-events-none"
          style={{ background: 'linear-gradient(to top, hsl(350 40% 7%), transparent)' }} />

        <div className="relative z-10 flex min-h-screen flex-col px-12 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 40, height: 40,
                background: '#0F0F0F',
                boxShadow: 'rgba(220,60,40,0.80) 0px 0px 14px 3px, rgba(220,60,40,0.45) 0px 0px 32px 8px, rgba(220,60,40,0.20) 0px 0px 56px 14px',
              }}
            >
              <span className="text-white font-black text-[15px] tracking-tighter" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>W</span>
            </div>
            <div className="leading-none">
              <p className="text-[22px] font-bold lowercase text-white" style={{ letterSpacing: '-0.03em', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                wireless
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mt-0.5" style={{ color: 'hsl(350 40% 65%)' }}>Command Center</p>
            </div>
          </div>

          {/* Hero */}
          <div className="flex flex-1 flex-col justify-center">
            <div className="max-w-xl">
              <h1 className="text-5xl font-black text-white leading-[1.04] tracking-tight">
                Run your entire
                <br />
                repair business
                <br />
                <span style={{ color: 'hsl(350 65% 62%)' }}>from one place.</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed" style={{ color: 'hsl(350 15% 65%)' }}>
                Wireless brings repairs, sales, inventory, customer follow-up and analytics into one secure command center built for fast-moving gadget repair shops.
              </p>
            </div>
          </div>

          {/* Capability strip */}
          <div className="pt-8" style={{ borderTop: '1px solid hsl(350 30% 16%)' }}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              {modules.map((m, i) => (
                <div key={m.label} className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <i className={`${m.icon} text-[13px]`} style={{ color: 'hsl(350 45% 55%)' }} />
                    <span className="text-[11px] font-medium tracking-wide" style={{ color: 'hsl(350 12% 60%)' }}>{m.label}</span>
                  </div>
                  {i < modules.length - 1 && <span className="h-3 w-px" style={{ background: 'hsl(350 25% 18%)' }} />}
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-7" style={{ color: 'hsl(350 15% 34%)' }}>&copy; 2026 Wireless · All rights reserved</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (light form side) ── */}
      <div
        className="relative flex min-h-screen items-stretch justify-center px-6 py-8 lg:px-10 lg:py-10"
        style={{ background: 'hsl(220 14% 95%)' }}
      >
        <div className="relative z-10 flex w-full max-w-[420px] flex-col justify-center">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 36, height: 36,
                background: '#0F0F0F',
                boxShadow: 'rgba(220,60,40,0.70) 0px 0px 10px 2px',
              }}
            >
              <span className="text-white font-black text-[13px]" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>W</span>
            </div>
            <div>
              <p className="text-xl font-bold lowercase leading-none" style={{ letterSpacing: '-0.03em', color: 'hsl(350 60% 22%)' }}>wireless</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'hsl(var(--muted-foreground))' }}>Command Center</p>
            </div>
          </div>

          <div
            className="relative rounded-2xl p-7"
            style={{
              background: 'hsl(0 0% 99%)',
              border: '1px solid hsl(220 13% 90%)',
              boxShadow: '0 1px 2px hsl(220 20% 12% / 0.04), 0 8px 20px -8px hsl(220 20% 12% / 0.08)',
            }}
          >
            {/* ── SIGN IN VIEW ── */}
            {view === 'signin' && (
              <div className={`transition-all duration-500 ${loginSuccess ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black tracking-tight mb-1" style={{ color: 'hsl(220 20% 12%)' }}>Welcome back</h2>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Sign in to your Command Center</p>
                  </div>
                  {/* Live / Demo badge */}
                  <div
                    className="flex items-center gap-1.5 px-2 py-[3px] rounded-md text-[9.5px] font-semibold uppercase tracking-wider flex-shrink-0 mt-1"
                    style={isSupabaseAuth
                      ? { background: 'hsl(142 45% 95%)', color: 'hsl(142 55% 26%)' }
                      : { background: 'hsl(38 80% 95%)', color: 'hsl(38 75% 32%)' }
                    }
                  >
                    <span className="w-[5px] h-[5px] rounded-full" style={{ background: isSupabaseAuth ? 'hsl(142 55% 40%)' : 'hsl(38 80% 50%)' }} />
                    {isSupabaseAuth ? 'Live System' : 'Demo Mode'}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <FocusInput
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder={isSupabaseAuth ? 'your@email.com' : 'you@wireless.com'}
                    label="Email Address"
                    inputBase={inputBase}
                    inputFocus={inputFocus}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Password</label>
                      <button
                        type="button"
                        onClick={() => { setView('forgot'); setForgotEmail(email); setForgotError(''); }}
                        className="text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ color: 'hsl(350 60% 35%)' }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <PasswordInput
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggle={() => setShowPassword(s => !s)}
                      inputBase={inputBase}
                      inputFocus={inputFocus}
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg text-xs"
                      style={{ background: 'hsl(0 80% 97%)', border: '1px solid hsl(0 70% 88%)', color: 'hsl(0 65% 40%)' }}>
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer hover:opacity-90"
                    style={{
                      background: 'hsl(350 58% 34%)',
                      boxShadow: '0 2px 6px hsl(350 50% 30% / 0.25)',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <><LogIn className="w-4 h-4" /> Sign In</>}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: 'hsl(220 13% 91%)' }} />
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Quick Login</span>
                  <div className="flex-1 h-px" style={{ background: 'hsl(220 13% 91%)' }} />
                </div>

                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-0.5 -mr-0.5">
                  {DEMO_ACCOUNTS.map(u => {
                    const shown = u.access.slice(0, 3);
                    const rest = u.access.length - shown.length;
                    return (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() => quickLogin(u.email, u.password)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left cursor-pointer group"
                        style={{ background: 'hsl(220 14% 97%)', border: '1px solid hsl(220 13% 92%)', boxShadow: '0 1px 1px hsl(220 20% 12% / 0.02)', transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.15s' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = u.hoverBg; el.style.borderColor = u.hoverBorder; el.style.boxShadow = '0 4px 12px hsl(220 20% 12% / 0.06)'; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'hsl(220 14% 97%)'; el.style.borderColor = 'hsl(220 13% 92%)'; el.style.boxShadow = '0 1px 1px hsl(220 20% 12% / 0.02)'; }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                          style={{ background: u.color }}>
                          {u.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold" style={{ color: 'hsl(220 20% 12%)' }}>{u.name}</p>
                            <span className="text-[9.5px] font-semibold px-1.5 py-[1px] rounded-full" style={{ background: u.badgeBg, color: u.color }}>{u.role}</span>
                          </div>
                          <p className="text-[10px] font-mono mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {u.email} · pw: <span style={{ color: 'hsl(220 20% 35%)' }}>{u.password}</span>
                          </p>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {shown.map(a => (
                              <span key={a} className="text-[9px] font-medium px-1.5 py-[1px] rounded" style={{ background: 'hsl(220 13% 92%)', color: 'hsl(220 10% 44%)' }}>{a}</span>
                            ))}
                            {rest > 0 && (
                              <span className="text-[9px] font-medium" style={{ color: 'hsl(220 10% 60%)' }}>+{rest} more</span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: u.color }} />
                      </button>
                    );
                  })}
                </div>

                <p className="text-center text-[11px] mt-5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Having trouble? Contact your system administrator.
                </p>
              </div>
            )}

            {/* ── FORGOT PASSWORD VIEW ── */}
            {view === 'forgot' && (
              <div>
                <button
                  onClick={() => setView('signin')}
                  className="flex items-center gap-1.5 text-xs font-medium mb-6 cursor-pointer transition-opacity hover:opacity-70"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
                <div className="mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'hsl(350 60% 96%)', border: '1px solid hsl(350 60% 85%)' }}>
                    <KeyRound className="w-5 h-5" style={{ color: 'hsl(350 60% 35%)' }} />
                  </div>
                  <h2 className="text-xl font-black tracking-tight mb-1" style={{ color: 'hsl(220 20% 12%)' }}>Forgot Password?</h2>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Enter your email and we'll send you a reset link.</p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <FocusInput
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    placeholder="you@wireless.com"
                    label="Email Address"
                    inputBase={inputBase}
                    inputFocus={inputFocus}
                  />
                  {forgotError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg text-xs"
                      style={{ background: 'hsl(0 80% 97%)', border: '1px solid hsl(0 70% 88%)', color: 'hsl(0 65% 40%)' }}>
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {forgotError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: 'hsl(350 60% 35%)', opacity: forgotLoading ? 0.7 : 1 }}
                  >
                    {forgotLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Reset Link'}
                  </button>
                </form>
              </div>
            )}

            {/* ── RESET SENT VIEW ── */}
            {view === 'reset_sent' && (
              <div className="text-center">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'hsl(142 55% 91%)', border: '1px solid hsl(142 50% 78%)' }}>
                  <MailCheck className="w-7 h-7" style={{ color: 'hsl(142 55% 28%)' }} />
                </div>
                <h2 className="text-xl font-black tracking-tight mb-2" style={{ color: 'hsl(220 20% 12%)' }}>Check your email</h2>
                <p className="text-sm mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>We've sent a reset link to</p>
                <p className="text-sm font-bold mb-5" style={{ color: 'hsl(350 60% 35%)' }}>{forgotEmail}</p>
                <div className="p-3 rounded-lg mb-5 text-left"
                  style={{ background: 'hsl(350 60% 97%)', border: '1px solid hsl(350 60% 88%)' }}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(350 60% 42%)' }} />
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: 'hsl(350 60% 35%)' }}>
                        {isSupabaseAuth ? 'Supabase Connected' : 'Demo Mode'}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(350 30% 42%)' }}>
                        {isSupabaseAuth
                          ? 'If your Supabase project is configured to send auth emails, the reset link has been dispatched.'
                          : 'This is a simulated reset. Contact your system administrator to reset your password.'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setView('signin')}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white cursor-pointer"
                  style={{ background: 'hsl(350 60% 35%)' }}
                >
                  Back to Sign In
                </button>
              </div>
            )}

            {/* ── SUCCESS OVERLAY ── */}
            {loginSuccess && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 rounded-2xl"
                style={{ background: 'hsl(0 0% 100% / 0.95)' }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'hsl(142 55% 91%)', border: '1px solid hsl(142 50% 78%)' }}>
                  <CheckCircle2 className="w-7 h-7" style={{ color: 'hsl(142 55% 28%)' }} />
                </div>
                <p className="font-bold text-lg" style={{ color: 'hsl(220 20% 12%)' }}>Welcome back!</p>
                <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Redirecting to Command Center…</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper components ──────────────────────────────────────────

interface FocusInputProps {
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  inputBase: React.CSSProperties;
  inputFocus: React.CSSProperties;
}

function FocusInput({ icon, type, value, onChange, placeholder, label, inputBase, inputFocus }: FocusInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center"
          style={{ color: focused ? 'hsl(350 60% 45%)' : 'hsl(var(--muted-foreground))' }}>
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{ ...inputBase, paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, ...(focused ? inputFocus : {}) }}
        />
      </div>
    </div>
  );
}

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  inputBase: React.CSSProperties;
  inputFocus: React.CSSProperties;
}

function PasswordInput({ value, onChange, show, onToggle, inputBase, inputFocus }: PasswordInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center"
        style={{ color: focused ? 'hsl(350 60% 45%)' : 'hsl(var(--muted-foreground))' }}>
        <Lock className="w-4 h-4" />
      </div>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Enter your password"
        style={{ ...inputBase, paddingLeft: 36, paddingRight: 40, paddingTop: 10, paddingBottom: 10, ...(focused ? inputFocus : {}) }}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
