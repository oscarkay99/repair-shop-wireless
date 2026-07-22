import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepairs } from '@/hooks/useRepairs';
import { useAuth } from '@/hooks/useAuth';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';
import { useParts } from '@/hooks/useParts';
import { useExpenses } from '@/hooks/useExpenses';
import { useInvoices } from '@/hooks/useInvoices';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';
import BirthdayBanner from '@/components/shared/BirthdayBanner';
import ReceptionistDashboard from './ReceptionistDashboard';
import SalesManagerDashboard from './SalesManagerDashboard';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  ClipboardList, CheckCircle2, Users, AlertTriangle,
  Plus, UserPlus, Package, ArrowRight, Wrench, Coins,
  TrendingUp, TrendingDown, ChevronDown, Receipt,
} from 'lucide-react';
import type { Repair } from '@/types/repair';
import { REPAIR_STATUS_META, isActiveRepairStatus } from '@/utils/repairStatus';

// ── helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatGHS(n: number) {
  if (n >= 1_000_000) return `GH₵ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `GH₵ ${(n / 1000).toFixed(1)}k`;
  return `GH₵ ${n.toFixed(0)}`;
}

function parseAmt(s: string | number) {
  return typeof s === 'number' ? s : parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
}

function getDeviceType(r: Repair): string {
  const s = r.device.toLowerCase();
  if (s.includes('ipad'))                                                       return 'iPad';
  if (s.includes('iphone'))                                                     return 'iPhone';
  if (s.includes('macbook') || s.includes('mac'))                               return 'MacBook';
  if (s.includes('samsung') || s.includes('galaxy') || s.includes('pixel') || s.includes('android')) return 'Android';
  if (s.includes('windows') || s.includes('laptop') || s.includes('pc'))       return 'Windows';
  return 'Other';
}

function initials(name: string) { return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase(); }

const AVATAR_COLORS = ['#6366f1','#3b82f6','#f59e0b','#22c55e','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const PIPELINE = [
  { key: 'received',      label: 'Received',      color: '#6366f1' },
  { key: 'diagnosed',     label: 'Diagnosed',     color: '#8b5cf6' },
  { key: 'parts_pending', label: 'Parts Pending', color: '#f59e0b' },
  { key: 'in_progress',   label: 'In Progress',   color: '#3b82f6' },
  { key: 'ready',         label: 'Ready Pickup',  color: '#22c55e' },
] as const;

const DEVICE_COLORS: Record<string, string> = {
  iPhone: '#3b82f6', MacBook: '#f59e0b', Android: '#22c55e',
  iPad: '#6366f1', Windows: '#ef4444', Other: '#6b7280',
};

type PnLPeriod = '1m' | '3m' | '6m' | 'ytd' | 'all';
const PNL_LABELS: Record<PnLPeriod, string> = {
  '1m': 'This Month', '3m': 'Last 3 Months', '6m': 'Last 6 Months', 'ytd': 'Year to Date', 'all': 'All Time',
};

function pnlBounds(p: PnLPeriod): { from: Date | null; to: Date } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  switch (p) {
    case '1m':  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
    case '3m':  return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to };
    case '6m':  return { from: new Date(now.getFullYear(), now.getMonth() - 5, 1), to };
    case 'ytd': return { from: new Date(now.getFullYear(), 0, 1), to };
    case 'all': return { from: null, to };
  }
}

type RevFilter = '7d' | '14d' | '30d';

// ── P&L Banner ────────────────────────────────────────────────────────────────

function PnLBanner({
  revenue, expenses, netProfit, margin, activeRepairs,
  chartData, period, onPeriod,
}: {
  revenue: number; expenses: number; netProfit: number; margin: number;
  activeRepairs: number;
  chartData: { month: string; revenue: number; expenses: number; profit: number }[];
  period: PnLPeriod;
  onPeriod: (p: PnLPeriod) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const profitable = netProfit >= 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const tooltipStyle = {
    background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
    borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))',
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>

      {/* Banner header */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-4 h-4" style={{ color: profitable ? '#22c55e' : '#ef4444' }} />
          <span className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Profit &amp; Loss</span>
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>GH₵ equiv. · {PNL_LABELS[period]}</span>
        </div>
        {/* Period dropdown */}
        <div className="relative" ref={ref}>
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}>
            {PNL_LABELS[period]}
            <ChevronDown className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-xl overflow-hidden z-20"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}>
              {(Object.keys(PNL_LABELS) as PnLPeriod[]).map(p => (
                <button key={p} onClick={() => { onPeriod(p); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs transition-colors"
                  style={{
                    color: p === period ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                    background: p === period ? 'hsl(var(--muted))' : 'transparent',
                    fontWeight: p === period ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (p !== period) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={e => { if (p !== period) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  {PNL_LABELS[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x"
        style={{ borderBottom: '1px solid hsl(var(--border))', divideColor: 'hsl(var(--border))' }}>

        {/* Revenue */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Revenue Collected
          </p>
          <p className="text-2xl font-black tracking-tight" style={{ color: '#22c55e' }}>
            {formatGHS(revenue)}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>from paid invoices</p>
        </div>

        {/* Expenses */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Total Expenses
          </p>
          <p className="text-2xl font-black tracking-tight" style={{ color: '#ef4444' }}>
            {formatGHS(expenses)}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>operating costs</p>
        </div>

        {/* Net P/L */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Net P/L
          </p>
          <p className="text-2xl font-black tracking-tight" style={{ color: profitable ? '#22c55e' : '#ef4444' }}>
            {profitable ? '+' : ''}{formatGHS(netProfit)}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            {profitable
              ? <TrendingUp className="w-3 h-3" style={{ color: '#22c55e' }} />
              : <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} />}
            <span className="text-xs" style={{ color: profitable ? '#22c55e' : '#ef4444' }}>
              {Math.abs(margin)}% margin
            </span>
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>·</span>
            <span className="text-xs font-semibold" style={{ color: profitable ? '#22c55e' : '#ef4444' }}>
              {profitable ? 'Profitable' : 'At a Loss'}
            </span>
          </div>
        </div>

        {/* Active Repairs */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Active Repairs
          </p>
          <p className="text-2xl font-black tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            {activeRepairs}
          </p>
          <Link to="/tickets">
            <p className="text-xs mt-1.5 hover:underline" style={{ color: 'hsl(var(--primary))' }}>View repairs →</p>
          </Link>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-x"
        style={{ divideColor: 'hsl(var(--border))' }}>

        {/* Revenue vs Expenses bar chart */}
        <div className="lg:col-span-2 px-6 py-5">
          <p className="text-xs font-semibold mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Revenue vs Expenses · Last 6 Months
          </p>
          {chartData.every(d => d.revenue === 0 && d.expenses === 0) ? (
            <div className="h-36 flex items-center justify-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No data yet
            </div>
          ) : (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={2}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(v: number, name: string) => [formatGHS(v), name === 'revenue' ? 'Revenue' : 'Expenses']}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
                  <Bar dataKey="revenue"  fill="#22c55e" radius={[3,3,0,0]} maxBarSize={28} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[3,3,0,0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex items-center gap-5 mt-2">
            {[['#22c55e','Revenue'], ['#ef4444','Expenses']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Profit trend line */}
        <div className="px-6 py-5">
          <p className="text-xs font-semibold mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Profit Trend</p>
          {chartData.every(d => d.profit === 0) ? (
            <div className="h-36 flex items-center justify-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No data yet
            </div>
          ) : (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(v: number) => [formatGHS(v), 'Net Profit']} />
                  <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────

function AdminDashboard() {
  const { setPageTitle } = usePageTitle();
  const { repairs, loading: repairsLoading } = useRepairs();
  const { customers, loading: customersLoading } = useWirelessCustomers();
  const { lowStock } = useParts();
  const { user } = useAuth();
  const { expenses } = useExpenses();
  const { invoices } = useInvoices();

  const [pnlPeriod, setPnlPeriod] = useState<PnLPeriod>('1m');
  const [revFilter, setRevFilter] = useState<RevFilter>('14d');

  useEffect(() => { setPageTitle({ title: 'Dashboard' }); }, [setPageTitle]);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const now        = new Date();
  const today      = now.toDateString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const isDoneStatus = (status: Repair['status']) => status === 'completed' || status === 'diagnosis_only_closed';

  // ── Repair stats ──────────────────────────────────────────────────────────
  const activeRepairs  = repairs.filter(r => isActiveRepairStatus(r.status));
  const readyRepairs   = repairs.filter(r => r.status === 'ready');
  const completedToday = repairs.filter(r => isDoneStatus(r.status) && r.completedDate && new Date(r.completedDate).toDateString() === today);
  const completedMonth = repairs.filter(r => isDoneStatus(r.status) && r.completedDate && r.completedDate.slice(0, 10) >= monthStart);
  const revenueMonth   = completedMonth.reduce((s, r) => s + parseAmt(r.costNum ?? r.cost), 0);

  const pipelineCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of activeRepairs) {
      const key = REPAIR_STATUS_META[r.status].filterKey;
      m[key] = (m[key] ?? 0) + 1;
    }
    return m;
  }, [activeRepairs]);
  const pipelineMax = Math.max(1, ...PIPELINE.map(p => pipelineCounts[p.key] ?? 0));

  const { paginated: pagedRecent, page: recentPage, setPage: setRecentPage, totalPages: recentTotalPages, total: recentTotal } = usePagination(repairs, 5);
  const { paginated: pagedActiveJobs, page: activeJobsPage, setPage: setActiveJobsPage, totalPages: activeJobsTotalPages, total: activeJobsTotal } = usePagination(activeRepairs, 6);

  const avgTurnaround = useMemo(() => {
    const done = repairs.filter(r => isDoneStatus(r.status) && r.completedDate);
    if (!done.length) return 0;
    return Math.round(done.reduce((s, r) => s + (new Date(r.completedDate!).getTime() - new Date(r.createdAt ?? r.started).getTime()) / 86_400_000, 0) / done.length * 10) / 10;
  }, [repairs]);

  const activeTechs = useMemo(() => new Set(activeRepairs.map(r => r.technician).filter(Boolean)).size, [activeRepairs]);

  // ── Revenue chart ─────────────────────────────────────────────────────────
  const revenueData = useMemo(() => {
    const days = revFilter === '7d' ? 7 : revFilter === '14d' ? 14 : 30;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      const prefix = d.toISOString().slice(0, 10);
      const rev = repairs.filter(r => isDoneStatus(r.status) && r.completedDate?.startsWith(prefix))
        .reduce((s, r) => s + parseAmt(r.costNum ?? r.cost), 0);
      return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: rev };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairs, revFilter]);

  const revStats = useMemo(() => {
    const days = revFilter === '7d' ? 7 : revFilter === '14d' ? 14 : 30;
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - days);
    const source = repairs.filter(r => isDoneStatus(r.status) && r.completedDate && new Date(r.completedDate) >= cutoff);
    const total = source.reduce((s, r) => s + parseAmt(r.costNum ?? r.cost), 0);
    return { total, jobs: source.length, avg: source.length ? total / source.length : 0 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairs, revFilter]);

  const deviceTypes = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of activeRepairs) { const type = getDeviceType(r); m[type] = (m[type] ?? 0) + 1; }
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [activeRepairs]);

  const techWorkload = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of activeRepairs) {
      if (r.technician) {
        const short = r.technician.split(' ').map((p, i) => i === 0 ? p : p[0] + '.').join(' ');
        m[short] = (m[short] ?? 0) + 1;
      }
    }
    return Object.entries(m).map(([name, jobs]) => ({ name, jobs })).sort((a, b) => b.jobs - a.jobs);
  }, [activeRepairs]);
  const maxWorkload = Math.max(1, ...techWorkload.map(t => t.jobs));

  // ── P&L calculations ──────────────────────────────────────────────────────
  const { from: pnlFrom } = pnlBounds(pnlPeriod);

  // Invoices are the canonical "money received" ledger — amount_paid on paid
  // invoices, not ticket/accessory-sale totals directly, to avoid double-counting
  // the same job/sale across both its record and its invoice.
  const pnlRevenue = useMemo(() => {
    const src = invoices.filter(i => {
      if (i.status !== 'paid') return false;
      if (!pnlFrom) return true;
      return new Date(i.updated_at) >= pnlFrom;
    });
    return src.reduce((s, i) => s + i.amount_paid, 0);
  }, [invoices, pnlPeriod]);

  const pnlExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (e.type !== 'expense') return false;
      if (!pnlFrom) return true;
      return new Date(e.date) >= pnlFrom;
    }).reduce((s, e) => s + parseAmt(e.amount), 0);
  }, [expenses, pnlPeriod]);

  const pnlNet    = pnlRevenue - pnlExpenses;
  const pnlMargin = pnlRevenue > 0 ? Math.round((pnlNet / pnlRevenue) * 100) : 0;

  // 6-month chart for P&L banner (fixed to last 6m regardless of period filter)
  const pnlChartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d    = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - 5 + i + 1, 1);
      const label = d.toLocaleDateString('en-GH', { month: 'short' });
      const rev  = invoices.filter(inv => {
        if (inv.status !== 'paid') return false;
        const pd = new Date(inv.updated_at); return pd >= d && pd < next;
      }).reduce((s, inv) => s + inv.amount_paid, 0);
      const exp  = expenses.filter(e => {
        if (e.type !== 'expense') return false;
        const ed = new Date(e.date); return ed >= d && ed < next;
      }).reduce((s, e) => s + parseAmt(e.amount), 0);
      return { month: label, revenue: rev, expenses: exp, profit: rev - exp };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, expenses]);

  // ── KPI cards ─────────────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Active Repairs',     value: repairsLoading   ? '…' : String(activeRepairs.length),
      sub: `${readyRepairs.length} ready for pickup`,
      icon: Wrench,       iconColor: 'hsl(var(--status-in-progress))', iconBg: 'hsl(var(--status-in-progress-bg))',
      border: 'hsl(var(--status-in-progress))', link: '/tickets',
    },
    {
      label: 'Completed Today',    value: repairsLoading   ? '…' : String(completedToday.length),
      sub: `${completedMonth.length} this month`,
      icon: CheckCircle2, iconColor: 'hsl(var(--status-ready))',       iconBg: 'hsl(var(--status-ready-bg))',
      border: 'hsl(var(--status-ready))', link: '/tickets',
    },
    {
      label: 'Total Customers',    value: customersLoading ? '…' : String(customers.length),
      sub: 'registered accounts',
      icon: Users,        iconColor: 'hsl(38 80% 35%)',                iconBg: 'hsl(38 90% 92%)',
      border: 'hsl(38 80% 55%)', link: '/customers',
    },
    {
      label: 'Revenue This Month', value: repairsLoading   ? '…' : formatGHS(revenueMonth),
      sub: `${completedMonth.length} jobs closed`,
      icon: Coins,        iconColor: '#6366f1',                        iconBg: 'rgba(99,102,241,0.12)',
      border: '#6366f1', link: '/invoices',
    },
  ];

  const tooltipStyle = {
    background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
    borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))',
  };

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{dateStr}</p>
        </div>
        <Link to="/tickets">
          <button className="flex items-center gap-2 px-4 h-9 rounded-xl text-xs font-bold"
            style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>
            <Plus className="w-3.5 h-3.5" /> New Ticket
          </button>
        </Link>
      </div>

      {/* P&L Banner */}
      <PnLBanner
        revenue={pnlRevenue}
        expenses={pnlExpenses}
        netProfit={pnlNet}
        margin={pnlMargin}
        activeRepairs={activeRepairs.length}
        chartData={pnlChartData}
        period={pnlPeriod}
        onPeriod={setPnlPeriod}
      />

      {/* Revenue Chart + Device Types + Tech Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 rounded-2xl border p-5"
          style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Repair Revenue</p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Payments from completed jobs</p>
            </div>
            <div className="flex gap-1">
              {(['7d', '14d', '30d'] as RevFilter[]).map(f => (
                <button key={f} onClick={() => setRevFilter(f)}
                  className="px-3 h-7 rounded-lg text-xs font-semibold transition-colors"
                  style={revFilter === f
                    ? { background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }
                    : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-8 mb-5">
            {[
              { label: 'TOTAL',     value: formatGHS(revStats.total) },
              { label: 'JOBS',      value: String(revStats.jobs) },
              { label: 'AVG / JOB', value: formatGHS(revStats.avg) },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
                <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatGHS(v), 'Revenue']}
                  cursor={{ stroke: 'hsl(var(--border))' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2}
                  fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          {/* Device Types */}
          <div className="rounded-2xl border p-5"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-sm font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Device Mix</p>
            {deviceTypes.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No data</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <PieChart width={88} height={88}>
                    <Pie data={deviceTypes} cx={40} cy={40} innerRadius={24} outerRadius={40} dataKey="value" strokeWidth={0}>
                      {deviceTypes.map(d => <Cell key={d.name} fill={DEVICE_COLORS[d.name] ?? '#6b7280'} />)}
                    </Pie>
                  </PieChart>
                </div>
                <div className="flex-1 space-y-1.5">
                  {deviceTypes.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DEVICE_COLORS[d.name] ?? '#6b7280' }} />
                        <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>{d.name}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Technician Workload */}
          {techWorkload.length > 0 && (
            <div className="rounded-2xl border p-5"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
              <p className="text-sm font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Tech Workload</p>
              <div className="space-y-3">
                {techWorkload.map(t => (
                  <div key={t.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>{t.name}</span>
                      <span className="text-[10px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.jobs} jobs</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="h-full rounded-full" style={{ width: `${(t.jobs / maxWorkload) * 100}%`, background: '#6366f1' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <Link key={card.label} to={card.link} className="block group">
            <div className="rounded-2xl border p-4 relative overflow-hidden"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', boxShadow: 'var(--shadow-card)', transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = card.border + '66';
                el.style.boxShadow = 'var(--shadow-md)';
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'hsl(var(--border))';
                el.style.boxShadow = 'var(--shadow-card)';
                el.style.transform = 'translateY(0)';
              }}>
              <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: card.border }} />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 pl-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>{card.label}</p>
                  <p className="text-3xl font-bold leading-tight" style={{ color: 'hsl(var(--foreground))' }}>{card.value}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.sub}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: card.iconBg, boxShadow: `0 2px 8px ${card.border}33` }}>
                  <card.icon className="w-4.5 h-4.5" style={{ color: card.iconColor }} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border"
          style={{ background: 'hsl(38 90% 96%)', borderColor: 'hsl(38 70% 80%)' }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(38 80% 35%)' }} />
            <p className="text-sm font-semibold" style={{ color: 'hsl(38 80% 32%)' }}>
              {lowStock.length} item{lowStock.length > 1 ? 's' : ''} low on stock —{' '}
              <span className="font-normal text-xs" style={{ color: 'hsl(38 60% 46%)' }}>
                {lowStock.map(p => `${p.name} (${p.stock} left)`).join(' · ')}
              </span>
            </p>
          </div>
          <Link to="/inventory" className="flex-shrink-0">
            <button className="flex items-center gap-1 text-xs font-semibold px-3 h-7 rounded-lg whitespace-nowrap"
              style={{ background: 'hsl(38 90% 88%)', color: 'hsl(38 80% 32%)' }}>
              View <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      )}

      {/* Recent Repairs + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 rounded-2xl border overflow-hidden"
          style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
          <div className="px-5 py-3.5 border-b flex items-center justify-between"
            style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Recent Repairs</span>
            </div>
            <Link to="/tickets">
              <button className="flex items-center gap-1 text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          {repairsLoading ? (
            <div className="py-10 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
          ) : recentTotal === 0 ? (
            <div className="py-10 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No repairs yet</div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Ref', 'Customer', 'Device', 'Issue', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedRecent.map((r, i) => {
                    const badge = REPAIR_STATUS_META[r.status];
                    return (
                      <tr key={r.id} className="transition-colors cursor-pointer"
                        style={{ borderBottom: i < pagedRecent.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>{r.id}</span>
                        </td>
                        <td className="px-5 py-3 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{r.customer || '—'}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.device}</td>
                        <td className="px-5 py-3 text-xs max-w-[120px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.issue}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                            style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {new Date(r.createdAt ?? r.started).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
              <div className="px-5 py-1">
                <Pagination page={recentPage} pageCount={recentTotalPages} total={recentTotal} pageSize={5} onPageChange={setRecentPage} />
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border p-5 space-y-4"
          style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Quick Actions
          </p>
          <div className="space-y-2">
            {[
              { label: 'New Ticket',    desc: 'Create a repair job',      icon: Plus,      to: '/tickets',      primary: true },
              { label: 'Add Customer',  desc: 'Register a new customer',  icon: UserPlus,  to: '/customers' },
              { label: 'Add Part',      desc: 'Update inventory stock',   icon: Package,   to: '/inventory' },
              { label: 'Log Expense',   desc: 'Record a business cost',   icon: Receipt,   to: '/expenses' },
            ].map(action => (
              <Link key={action.label} to={action.to}>
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors mb-2"
                  style={{
                    borderColor: action.primary ? 'hsl(354 60% 76%)' : 'hsl(var(--border))',
                    background:  action.primary ? 'hsl(354 60% 95%)' : 'transparent',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = action.primary ? 'hsl(354 60% 91%)' : 'hsl(var(--muted))'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = action.primary ? 'hsl(354 60% 95%)' : 'transparent'; }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: action.primary ? 'hsl(354 60% 90%)' : 'hsl(var(--muted))' }}>
                    <action.icon className="w-4 h-4"
                      style={{ color: action.primary ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold"
                      style={{ color: action.primary ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{action.label}</p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Repair Pipeline + Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 rounded-2xl border p-5"
          style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Repair Pipeline</p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Job distribution by stage</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              {repairsLoading ? '…' : `${activeRepairs.length} active`}
            </span>
          </div>
          <div className="space-y-4">
            {PIPELINE.map(stage => {
              const count = pipelineCounts[stage.key] ?? 0;
              const pct   = Math.round((count / pipelineMax) * 100);
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                      <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{stage.label}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: stage.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-8 mt-6 pt-5 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            {[
              { label: 'Avg Turnaround', value: `${avgTurnaround}d` },
              { label: 'Active Techs',   value: String(activeTechs) },
              { label: 'Parts Waiting',  value: String(pipelineCounts['parts_pending'] ?? 0) },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
          <div className="px-4 py-3.5 border-b flex items-center justify-between"
            style={{ borderColor: 'hsl(var(--border))' }}>
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Active Jobs</p>
            <Link to="/tickets">
              <button className="flex items-center gap-1 text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          {repairsLoading ? (
            <div className="py-10 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
          ) : activeJobsTotal === 0 ? (
            <div className="py-10 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No active jobs</div>
          ) : (
            <div>
              {pagedActiveJobs.map(r => {
                const badge = REPAIR_STATUS_META[r.status];
                const name  = r.customer || '—';
                return (
                  <div key={r.id}
                    className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer"
                    style={{ borderColor: 'hsl(var(--border))' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${avatarColor(name)}, ${avatarColor(name)}cc)`,
                        boxShadow: `0 0 0 2px hsl(var(--card)), 0 2px 6px ${avatarColor(name)}55`,
                      }}>
                      {initials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{name}</p>
                      <p className="text-[10px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {r.device}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                      style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                  </div>
                );
              })}
              <div className="px-4 py-2">
                <Pagination page={activeJobsPage} pageCount={activeJobsTotalPages} total={activeJobsTotal} pageSize={6} onPageChange={setActiveJobsPage} />
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}

// ── Role dispatcher ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  // Technicians get a dedicated full-screen portal (no sidebar/topbar) —
  // never the shared shell's dashboard.
  if (user.role === 'technician') return <Navigate to="/tech-portal" replace />;
  return (
    <>
      <BirthdayBanner />
      {(() => {
        switch (user.role) {
          case 'receptionist':      return <ReceptionistDashboard />;
          case 'sales_manager':     return <SalesManagerDashboard />;
          default:                  return <AdminDashboard />;
        }
      })()}
    </>
  );
}
