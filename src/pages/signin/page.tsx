import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

function FixHubLogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0D1F4A" />
      <path d="M12 28 L16 16 L20 22 L24 16 L28 28" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="20" cy="13" r="3" fill="#F5A623" />
    </svg>
  );
}

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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
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

  const quickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setError('');
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.08fr_0.92fr] overflow-hidden" style={{ background: '#060E1F' }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex relative min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://readdy.ai/api/search-image?query=modern%20premium%20phone%20repair%20shop%20interior%20with%20technician%20workstation%2C%20tools%20and%20devices%2C%20dark%20navy%20and%20gold%20ambient%20lighting%2C%20high-end%20professional%20atmosphere%2C%20bokeh%20background%2C%20cinematic%20photography%2C%20ultra%20wide%20angle%2C%20deep%20shadows%20and%20warm%20accent%20lights&width=1100&height=900&seq=fixhub-signin-bg-01&orientation=landscape"
            alt="FixHub"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(6,14,31,0.88) 0%, rgba(10,31,74,0.75) 50%, rgba(6,14,31,0.92) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: 'linear-gradient(to top, #060E1F, transparent)' }} />
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute top-0 bottom-0 border-l border-white/20" style={{ left: `${(i + 1) * 16.66}%` }} />
          ))}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-white/20" style={{ top: `${(i + 1) * 20}%` }} />
          ))}
        </div>

        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.18) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex min-h-screen flex-col px-12 py-10">
          <div className="flex items-center gap-3">
            <FixHubLogoMark size={42} />
            <div className="leading-none">
              <p className="text-[22px] font-black text-white" style={{ letterSpacing: '-0.02em' }}>
                Fix<span style={{ color: '#F5A623' }}>Hub</span>
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55 mt-0.5">Command Center</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full" style={{ background: '#F5A623' }} />
                Phone Repair Shop Command Center
              </div>
              <h1 className="text-5xl font-black text-white leading-[1.02] tracking-tight">
                Run your entire
                <br />
                repair business
                <br />
                <span style={{ color: '#F5A623' }}>from one place.</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/80">
                FixHub brings repairs, sales, inventory, customer follow-up and analytics into one secure command center built for fast-moving phone repair shops.
              </p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {modules.map(m => (
                <div key={m.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <i className={`${m.icon} text-xs text-white/75`} />
                  <span className="text-white/75 text-[10px] font-medium">{m.label}</span>
                </div>
              ))}
            </div>
            <p className="text-white/50 text-[10px] mt-8">&copy; 2026 FixHub · All rights reserved</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="relative flex min-h-screen items-stretch justify-center px-6 py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(7,16,31,0.08) 0%, transparent 60%)' }} />

        <div className="relative z-10 flex w-full max-w-[440px] flex-col justify-center">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:p-8">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10">
                <FixHubLogoMark size={32} />
              </div>
              <div>
                <p className="text-2xl font-black leading-none text-white">Fix<span style={{ color: '#F5A623' }}>Hub</span></p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Command Center</p>
              </div>
            </div>

            {/* ── SIGN IN VIEW ── */}
            {view === 'signin' && (
              <div className={`transition-all duration-500 ${loginSuccess ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
                <div className="mb-7">
                  <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Welcome back</h2>
                  <p className="text-white/65 text-sm">Sign in to your Command Center</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                        <i className={`ri-mail-line text-sm transition-colors ${emailFocused ? '' : 'text-white/30'}`} style={emailFocused ? { color: '#F5A623' } : {}} />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        placeholder="you@fixhub.com"
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
                        style={{
                          background: emailFocused ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.06)',
                          border: emailFocused ? '1px solid rgba(245,166,35,0.6)' : '1px solid rgba(255,255,255,0.1)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-white/70">Password</label>
                      <button
                        type="button"
                        onClick={() => { setView('forgot'); setForgotEmail(email); setForgotError(''); }}
                        className="text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ color: '#F5A623' }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                        <i className={`ri-lock-line text-sm transition-colors ${passwordFocused ? '' : 'text-white/30'}`} style={passwordFocused ? { color: '#F5A623' } : {}} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-12 py-3.5 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
                        style={{
                          background: passwordFocused ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.06)',
                          border: passwordFocused ? '1px solid rgba(245,166,35,0.6)' : '1px solid rgba(255,255,255,0.1)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-white/30 hover:text-white/60 cursor-pointer transition-colors"
                      >
                        <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-sm`} />
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <i className="ri-error-warning-line text-red-400 text-sm flex-shrink-0" />
                      <p className="text-xs text-red-300">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer whitespace-nowrap relative overflow-hidden group"
                    style={{ background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #0D1F4A 0%, #07101F 100%)', border: '1px solid rgba(245,166,35,0.4)' }}
                  >
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #2B6DD4 0%, #0D1F4A 100%)' }} />
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <><i className="ri-loader-4-line animate-spin" /> Signing in...</>
                      ) : (
                        <><i className="ri-login-box-line" /> Sign In to Command Center</>
                      )}
                    </span>
                  </button>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-[10px] text-white/25 uppercase tracking-wider">Demo Accounts</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                <div className="space-y-2">
                  {[
                    { name: 'Kwame Asante', role: 'Admin', email: 'admin@fixhub.com', password: 'admin123', avatar: 'KA', color: '#0D1F4A' },
                    { name: 'Kofi Mensah', role: 'Sales Manager', email: 'kofi@fixhub.com', password: 'kofi123', avatar: 'KM', color: '#F5A623' },
                    { name: 'Ama Owusu', role: 'Technician', email: 'ama@fixhub.com', password: 'ama123', avatar: 'AO', color: '#E05A2B' },
                  ].map(u => (
                    <button
                      key={u.email}
                      type="button"
                      onClick={() => quickLogin(u.email, u.password)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left group"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ background: u.color }}>
                        {u.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white/80">{u.name} <span className="text-white/35 font-normal">· {u.role}</span></p>
                        <p className="text-[10px] text-white/45 font-mono mt-0.5">{u.email}</p>
                        <p className="text-[10px] mt-0.5">
                          <span className="text-white/30">pw: </span>
                          <span className="text-white/60 font-mono">{u.password}</span>
                        </p>
                      </div>
                      <i className="ri-arrow-right-line text-white/20 text-sm group-hover:text-white/50 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>

                <p className="text-center text-[11px] text-white/45 mt-6">
                  Having trouble? Contact your system administrator.
                </p>
              </div>
            )}

            {/* ── FORGOT PASSWORD VIEW ── */}
            {view === 'forgot' && (
              <div>
                <button
                  onClick={() => setView('signin')}
                  className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 cursor-pointer mb-7 transition-colors"
                >
                  <i className="ri-arrow-left-line" /> Back to Sign In
                </button>
                <div className="mb-7">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.25)' }}>
                    <i className="ri-lock-password-line text-xl" style={{ color: '#F5A623' }} />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Forgot Password?</h2>
                  <p className="text-white/65 text-sm">Enter your email and we&apos;ll send you a reset link.</p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        <i className="ri-mail-line text-white/30 text-sm" />
                      </div>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@fixhub.com"
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>
                  </div>
                  {forgotError && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <i className="ri-error-warning-line text-red-400 text-sm" />
                      <p className="text-xs text-red-300">{forgotError}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer whitespace-nowrap"
                    style={{ background: forgotLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #0D1F4A 0%, #07101F 100%)', border: '1px solid rgba(245,166,35,0.4)' }}
                  >
                    {forgotLoading ? <span className="flex items-center justify-center gap-2"><i className="ri-loader-4-line animate-spin" /> Sending...</span> : 'Send Reset Link'}
                  </button>
                </form>
              </div>
            )}

            {/* ── RESET SENT VIEW ── */}
            {view === 'reset_sent' && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.25)' }}>
                  <i className="ri-mail-check-line text-3xl" style={{ color: '#25D366' }} />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Check your email</h2>
                <p className="text-white/65 text-sm mb-2">We&apos;ve sent a password reset link to</p>
                <p className="text-sm font-bold mb-6" style={{ color: '#F5A623' }}>{forgotEmail}</p>
                <div className="p-4 rounded-xl mb-6 text-left" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}>
                  <div className="flex items-start gap-2">
                    <i className="ri-information-line text-sm mt-0.5" style={{ color: '#F5A623' }} />
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: '#F5A623' }}>{isSupabaseAuth ? 'Supabase Connected' : 'Demo Mode'}</p>
                      <p className="text-xs text-white/65">
                        {isSupabaseAuth
                          ? 'If your Supabase project is configured to send auth emails, the reset link has been dispatched.'
                          : 'This is a simulated reset. Contact your system administrator to reset your password.'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setView('signin')}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white cursor-pointer whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #0D1F4A 0%, #07101F 100%)', border: '1px solid rgba(245,166,35,0.4)' }}
                >
                  Back to Sign In
                </button>
              </div>
            )}

            {loginSuccess && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(37,211,102,0.2)', border: '1px solid rgba(37,211,102,0.4)' }}>
                  <i className="ri-check-double-line text-3xl" style={{ color: '#25D366' }} />
                </div>
                <p className="text-white font-bold text-lg">Welcome back!</p>
                <p className="text-white/65 text-sm mt-1">Redirecting to Command Center...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
