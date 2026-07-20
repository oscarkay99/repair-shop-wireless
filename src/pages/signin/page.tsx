import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Lock, Eye, EyeOff, ArrowRight, Loader2, User,
  AlertCircle, CheckCircle2,
  Ticket, Users, Boxes, LineChart,
} from 'lucide-react';

const FEATURES = [
  { icon: Ticket,    title: 'Smart Ticket Management', desc: 'Track every repair from start to finish' },
  { icon: Users,     title: 'Customer Relationship',   desc: 'Build stronger relationships' },
  { icon: Boxes,     title: 'Inventory Control',       desc: 'Real-time stock & parts tracking' },
  { icon: LineChart, title: 'Analytics & Reports',     desc: 'Powerful insights that grow your business' },
];

export default function SignInPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, deniedMessage, clearDeniedMessage, isSupabaseAuth, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Google sign-in leaves and comes back as a fresh page load, and the
  // rejection (if any) only resolves asynchronously after the redirect —
  // so this has to watch reactive state rather than checking once on mount.
  useEffect(() => {
    if (deniedMessage) {
      setError(deniedMessage);
      setGoogleLoading(false);
      clearDeniedMessage();
    }
  }, [deniedMessage, clearDeniedMessage]);

  // Password/demo login navigate immediately after `login()` resolves, but
  // Google sign-in leaves and comes back as a fresh page load — the session
  // only finishes establishing asynchronously afterward, so this is the only
  // reliable place to catch "we're now authenticated" and enter the app.
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  // Sign-in is always day mode, regardless of the app-wide theme preference —
  // this only touches the DOM class for as long as the page is mounted, it
  // doesn't change or persist the user's actual saved theme choice.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => { if (wasDark) root.classList.add('dark'); };
  }, []);

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

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(result.error || 'Unable to sign in with Google');
      setGoogleLoading(false);
    }
    // On success the page redirects to Google, then back — nothing else to do here.
  };

  const inputBase: React.CSSProperties = {
    background: 'hsl(var(--muted))',
    border: '1.5px solid hsl(var(--border))',
    color: 'hsl(var(--foreground))',
    borderRadius: 10,
    width: '100%',
    fontSize: 14,
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const inputFocus: React.CSSProperties = {
    border: '1.5px solid hsl(354 60% 55%)',
    boxShadow: '0 0 0 3px hsl(354 60% 55% / 0.12)',
  };

  return (
    <div
      className="min-h-screen lg:grid lg:grid-cols-[1.15fr_0.85fr] overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* ── LEFT PANEL (dark hero side) ── */}
      <div className="hidden lg:flex relative min-h-screen overflow-hidden" style={{ background: 'hsl(354 38% 8%)' }}>
        <div className="absolute top-[8%] right-[-15%] w-[560px] h-[560px] rounded-full pointer-events-none blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(354 55% 24% / 0.4) 0%, transparent 72%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
          style={{ background: 'linear-gradient(to top, hsl(354 40% 6%), transparent)' }} />

        <div className="relative z-10 flex min-h-screen flex-col px-12 py-9 w-full">
          {/* Logo */}
          <div>
            <img src="/wireless-logo-dark.png" alt="WIRELESS" style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mt-1" style={{ color: 'hsl(354 40% 65%)' }}>Command Center</p>
          </div>

          {/* Hero + feature list + floating mockup */}
          <div className="flex flex-1 items-center gap-8 py-6">
            <div className="flex-1 max-w-md">
              <h1 className="text-[42px] font-black text-white leading-[1.05] tracking-tight">
                Run your entire
                <br />
                repair business
                <br />
                <span style={{ color: 'hsl(354 65% 62%)' }}>from one place.</span>
              </h1>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: 'hsl(354 15% 65%)' }}>
                Manage repairs, customers, inventory, payments and analytics from one intelligent command center built for modern repair shops.
              </p>

              <div className="mt-7 space-y-3.5">
                {FEATURES.map(f => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#0F0F0F', border: '1px solid rgba(236,1,24,0.25)' }}
                    >
                      <f.icon className="w-4 h-4" style={{ color: '#EC0118' }} />
                    </div>
                    <div className="pt-1">
                      <p className="text-[13px] font-semibold text-white leading-tight">{f.title}</p>
                      <p className="text-[11.5px] mt-0.5" style={{ color: 'hsl(354 15% 60%)' }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating tilted dashboard mockup */}
            <div className="hidden xl:block flex-shrink-0" style={{ perspective: 1400 }}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  width: 400,
                  transform: 'rotateY(-10deg) rotateX(4deg) rotate(-1deg)',
                  transformStyle: 'preserve-3d',
                  background: 'hsl(222 24% 12%)',
                  border: '1px solid hsl(354 30% 22%)',
                  boxShadow: 'rgba(220,40,40,0.35) 0px 30px 70px -20px, rgba(0,0,0,0.5) 0px 40px 80px -20px',
                }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'hsl(222 20% 20%)' }}>
                  <p className="text-[13px] font-bold text-white">Dashboard</p>
                  <span className="text-[9px] font-medium px-2 py-1 rounded-md flex items-center gap-1" style={{ background: 'hsl(222 20% 18%)', color: 'hsl(220 10% 65%)' }}>
                    <i className="ri-calendar-line" /> May 18, 2026
                  </span>
                </div>

                <div className="flex">
                  {/* Mini nav rail */}
                  <div className="w-10 flex-shrink-0 flex flex-col items-center gap-3 py-4 border-r" style={{ borderColor: 'hsl(222 20% 20%)' }}>
                    {['ri-home-5-fill', 'ri-file-list-3-line', 'ri-team-line', 'ri-archive-line', 'ri-shopping-cart-2-line', 'ri-bar-chart-2-line', 'ri-settings-3-line'].map((ic, i) => (
                      <div key={ic} className="w-6 h-6 rounded-lg flex items-center justify-center" style={i === 0 ? { background: '#EC0118' } : undefined}>
                        <i className={`${ic} text-[12px]`} style={{ color: i === 0 ? '#fff' : 'hsl(220 10% 55%)' }} />
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 p-3.5 space-y-3">
                    <div>
                      <p className="text-[13px] font-bold text-white">Good morning, Kwame 👋</p>
                      <p className="text-[10px]" style={{ color: 'hsl(220 10% 55%)' }}>Here's what's happening with your shop today.</p>
                    </div>

                    {/* Stat row 1 */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Total Repairs', value: '42', delta: '+18%' },
                        { label: 'Waiting for Parts', value: '11', delta: '+8%' },
                        { label: 'Completed Today', value: '19', delta: '+26%' },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg p-2" style={{ background: 'hsl(222 20% 16%)' }}>
                          <p className="text-[8.5px] leading-tight" style={{ color: 'hsl(220 10% 55%)' }}>{s.label}</p>
                          <p className="text-[15px] font-bold text-white mt-0.5">{s.value}</p>
                          <p className="text-[8.5px] font-semibold mt-0.5" style={{ color: 'hsl(142 55% 55%)' }}>▲ {s.delta}</p>
                        </div>
                      ))}
                    </div>

                    {/* Stat row 2 with sparklines */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg p-2" style={{ background: 'hsl(222 20% 16%)' }}>
                        <p className="text-[8.5px]" style={{ color: 'hsl(220 10% 55%)' }}>Revenue Today</p>
                        <p className="text-[14px] font-bold text-white mt-0.5">$3,412.00</p>
                        <svg viewBox="0 0 80 24" className="w-full h-5 mt-1"><path d="M0 20 L15 16 L30 18 L45 8 L60 10 L80 2" fill="none" stroke="#EC0118" strokeWidth="2" strokeLinecap="round" /></svg>
                      </div>
                      <div className="rounded-lg p-2" style={{ background: 'hsl(222 20% 16%)' }}>
                        <p className="text-[8.5px]" style={{ color: 'hsl(220 10% 55%)' }}>New Customers</p>
                        <p className="text-[14px] font-bold text-white mt-0.5">12</p>
                        <svg viewBox="0 0 80 24" className="w-full h-5 mt-1"><path d="M0 18 L15 19 L30 12 L45 14 L60 6 L80 4" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" /></svg>
                      </div>
                    </div>

                    {/* Recent tickets */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-bold text-white">Recent Repair Tickets</p>
                        <p className="text-[9px] font-medium" style={{ color: 'hsl(354 65% 62%)' }}>View All</p>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { device: 'iPhone 15 Pro', job: 'Screen Replacement', status: 'In Progress', statusColor: 'hsl(38 85% 55%)', tech: 'Kwame A.', time: '2h ago' },
                          { device: 'MacBook Air M2', job: 'Battery Replacement', status: 'Waiting Parts', statusColor: 'hsl(280 60% 65%)', tech: 'Efua B.', time: '3h ago' },
                          { device: 'PlayStation 5', job: 'HDMI Port Repair', status: 'Completed', statusColor: 'hsl(142 55% 50%)', tech: 'Ama O.', time: '5h ago' },
                        ].map(t => (
                          <div key={t.device} className="flex items-center gap-2 rounded-lg p-1.5" style={{ background: 'hsl(222 20% 16%)' }}>
                            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(222 20% 22%)' }}>
                              <i className="ri-smartphone-line text-[10px]" style={{ color: 'hsl(220 10% 65%)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9.5px] font-semibold text-white truncate">{t.device}</p>
                              <p className="text-[8px]" style={{ color: 'hsl(220 10% 55%)' }}>{t.job}</p>
                            </div>
                            <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: `${t.statusColor}22`, color: t.statusColor }}>{t.status}</span>
                            <span className="text-[8px] flex-shrink-0 w-10 text-right" style={{ color: 'hsl(220 10% 50%)' }}>{t.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t" style={{ borderColor: 'hsl(354 30% 16%)' }}>
            <p className="text-[10px]" style={{ color: 'hsl(354 15% 34%)' }}>&copy; 2026 Wireless · All rights reserved</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (light form side) ── */}
      <div
        className="relative flex min-h-screen items-stretch justify-center px-6 py-8 lg:px-10 lg:py-10"
        style={{ background: 'hsl(var(--background))' }}
      >
        <div className="relative z-10 flex w-full max-w-[420px] flex-col justify-center">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <img src="/wireless-logo-light.png" alt="WIRELESS" style={{ height: 24, width: 'auto', objectFit: 'contain' }} />
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'hsl(var(--muted-foreground))' }}>Command Center</p>
          </div>

          <div
            className="relative rounded-2xl p-7"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* ── SIGN IN VIEW ── */}
            <div className={`transition-all duration-500 ${loginSuccess ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black tracking-tight mb-1" style={{ color: 'hsl(var(--foreground))' }}>Welcome back 👋</h2>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Sign in to your Wireless Command Center</p>
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
                    icon={<User className="w-4 h-4" />}
                    type="text"
                    value={email}
                    onChange={setEmail}
                    placeholder={isSupabaseAuth ? 'you@wireless.com or username' : 'you@wireless.com'}
                    label="Email or Username"
                    inputBase={inputBase}
                    inputFocus={inputFocus}
                  />

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Password</label>
                    <PasswordInput
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggle={() => setShowPassword(s => !s)}
                      inputBase={inputBase}
                      inputFocus={inputFocus}
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded cursor-pointer accent-brand-500"
                    />
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Remember me</span>
                  </label>

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
                      background: 'linear-gradient(135deg, hsl(354 65% 45%), hsl(354 58% 34%))',
                      boxShadow: '0 4px 14px hsl(354 50% 30% / 0.35)',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <><ArrowRight className="w-4 h-4" /> Sign In</>}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Or</span>
                  <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={googleLoading}
                    className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60"
                    style={{ background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    onMouseEnter={e => { if (!googleLoading) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--card))'; }}
                  >
                    {googleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 01-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.87-3.01c-1.08.72-2.46 1.15-4.08 1.15-3.13 0-5.79-2.12-6.74-4.96H1.27v3.11A11.998 11.998 0 0012 24z"/>
                        <path fill="#FBBC05" d="M5.26 14.28A7.2 7.2 0 014.87 12c0-.79.14-1.56.39-2.28V6.61H1.27A11.998 11.998 0 000 12c0 1.94.46 3.77 1.27 5.39l3.99-3.11z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l3.99 3.11C6.21 6.87 8.87 4.75 12 4.75z"/>
                      </svg>
                    )}
                    {googleLoading ? 'Redirecting…' : 'Continue with Google'}
                  </button>
                </div>

                <p className="text-center text-[11px] mt-5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Need help? <span className="font-semibold" style={{ color: 'hsl(354 60% 35%)' }}>Contact your system administrator</span>
                </p>
              </div>

            {/* ── SUCCESS OVERLAY ── */}
            {loginSuccess && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 rounded-2xl"
                style={{ background: 'hsl(var(--card) / 0.95)' }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'hsl(142 55% 91%)', border: '1px solid hsl(142 50% 78%)' }}>
                  <CheckCircle2 className="w-7 h-7" style={{ color: 'hsl(142 55% 28%)' }} />
                </div>
                <p className="font-bold text-lg" style={{ color: 'hsl(var(--foreground))' }}>Welcome back!</p>
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
          style={{ color: focused ? 'hsl(354 60% 45%)' : 'hsl(var(--muted-foreground))' }}>
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
        style={{ color: focused ? 'hsl(354 60% 45%)' : 'hsl(var(--muted-foreground))' }}>
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
