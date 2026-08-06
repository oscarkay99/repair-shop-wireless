import { useState, useMemo, useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import { useSales } from '@/hooks/useSales';
import { useBudgets } from '@/hooks/useBudgets';
import { useAssets } from '@/hooks/useAssets';
import { expenseCategories } from '@/mocks/expenses';
import AddExpenseModal from './components/AddExpenseModal';
import AddAssetModal from './components/AddAssetModal';
import Pagination from '@/components/shared/Pagination';
import { TrendingUp, TrendingDown, Plus, Pencil, Trash2, X, Boxes } from 'lucide-react';
import type { Expense } from '@/services/wireless/expenses';
import type { FixedAsset } from '@/services/wireless/assets';

const PAGE_SIZE = 15;

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseAmt(s: string | number): number {
  return typeof s === 'number' ? s : parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
}

function fmt(n: number) {
  return `GH₵ ${Math.round(Math.abs(n)).toLocaleString()}`;
}

function fmtFull(n: number) {
  return `GH₵ ${Math.abs(n).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Parse loose date strings like "Apr 22, 2026" or ISO strings
function parseDate(s: string): Date {
  return new Date(s);
}

// Period filter bounds
type Period = '1m' | '3m' | '6m' | 'ytd';

function periodBounds(p: Period): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  switch (p) {
    case '1m': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
    case '3m': return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to };
    case '6m': return { from: new Date(now.getFullYear(), now.getMonth() - 5, 1), to };
    case 'ytd': return { from: new Date(now.getFullYear(), 0, 1), to };
  }
}

const PERIOD_LABELS: Record<Period, string> = {
  '1m': 'This Month',
  '3m': 'Last 3 Months',
  '6m': 'Last 6 Months',
  'ytd': 'Year to Date',
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, positive }: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-2"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
      <span className="text-2xl font-bold tracking-tight" style={{ color: positive === undefined ? 'hsl(var(--foreground))' : positive ? '#22c55e' : '#ef4444' }}>
        {value}
      </span>
      {sub && <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{sub}</span>}
      <div className="mt-auto pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

// ─── Bar chart (inline, no dependency) ───────────────────────────────────────

function BarChart({ data }: { data: { month: string; revenue: number; expenses: number; profit: number }[] }) {
  const maxVal = Math.max(...data.map(m => Math.max(m.revenue, m.expenses)), 1);
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-2" style={{ height: 160 }}>
        {data.map(m => (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
            <div className="w-full flex flex-col gap-0.5 justify-end" style={{ height: '100%' }}>
              {/* Revenue bar */}
              <div className="relative group w-full"
                style={{ height: `${Math.max((m.revenue / maxVal) * 140, m.revenue > 0 ? 3 : 0)}px`, background: 'hsl(var(--primary))', borderRadius: '3px 3px 0 0' }}>
                {m.revenue > 0 && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-semibold rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                    style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>
                    {fmt(m.revenue)}
                  </div>
                )}
              </div>
              {/* Expenses bar */}
              <div className="relative group w-full"
                style={{ height: `${Math.max((m.expenses / maxVal) * 140, m.expenses > 0 ? 3 : 0)}px`, background: '#f59e0b', borderRadius: '0 0 3px 3px' }}>
                {m.expenses > 0 && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-semibold rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                    style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>
                    {fmt(m.expenses)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Month labels + profit */}
      <div className="flex gap-2">
        {data.map(m => (
          <div key={m.month} className="flex-1 text-center">
            <div className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{m.month}</div>
            {(m.revenue > 0 || m.expenses > 0) && (
              <div className="text-[10px] font-bold mt-0.5" style={{ color: m.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                {m.profit >= 0 ? '+' : '-'}{fmt(m.profit)}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-5 pt-1">
        {[['hsl(var(--primary))', 'Revenue'], ['#f59e0b', 'Expenses']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── P&L Statement ───────────────────────────────────────────────────────────

function PnLRow({ label, value, indent, bold, separator, color }: {
  label: string; value: number | null; indent?: boolean; bold?: boolean; separator?: boolean; color?: string;
}) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${separator ? 'border-t' : ''}`}
      style={separator ? { borderColor: 'hsl(var(--border))' } : {}}>
      <span className={`text-sm ${indent ? 'pl-4' : ''} ${bold ? 'font-bold' : ''}`}
        style={{ color: bold ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
        {label}
      </span>
      {value !== null && (
        <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} tabular-nums`}
          style={{ color: color ?? (bold ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))') }}>
          {value < 0 ? `(${fmtFull(-value)})` : fmtFull(value)}
        </span>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { setPageTitle } = usePageTitle();
  const { user } = useAuth();
  const { expenses, loading, add, update, remove } = useExpenses();
  const { sales } = useSales();
  const { budgetMap, setBudget } = useBudgets();
  const { assets, loading: assetsLoading, add: addAsset, update: updateAsset, remove: removeAsset } = useAssets();
  // Admin is a protected system role that can't carry a DB-seeded
  // assets:edit permission (see the migration) — is_admin() already
  // bypasses every wireless.has_permission() check server-side, so the
  // client mirrors that with an explicit role check. Finance (and anyone
  // else with assets:view but not assets:edit) gets read-only.
  const canManageAssets = user?.role === 'admin';
  // Same admin-protected-role caveat as canManageAssets above — the DB seed
  // can't grant admin an explicit expenses:edit row, but is_admin() already
  // bypasses the RLS check server-side either way.
  const canEditExpenses = user?.role === 'admin' || (user?.permissions ?? []).includes('expenses:edit');

  const [period, setPeriod] = useState<Period>('1m');
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'budgets' | 'assets'>('overview');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [confirmDeleteAssetId, setConfirmDeleteAssetId] = useState<string | null>(null);
  const [assetPage, setAssetPage] = useState(1);

  useEffect(() => {
    setPageTitle({
      title: 'Expenses & P&L',
      subtitle: 'Track spending · Monitor profit & loss',
      hideDefaultAction: true,
      action: canEditExpenses ? { label: 'Add Expense', onClick: () => setShowAdd(true) } : undefined,
    });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle, canEditExpenses]);

  const { from, to } = periodBounds(period);

  // Filter sales and expenses to the selected period
  const activeSales = useMemo(() =>
    sales.filter(s => {
      if (s.status === 'cancelled' || s.status === 'refunded') return false;
      const d = parseDate(s.date);
      return d >= from && d <= to;
    }),
  [sales, period]);

  const periodExpenses = useMemo(() =>
    expenses.filter(e => {
      if (e.type !== 'expense') return false;
      const d = parseDate(e.date);
      return d >= from && d <= to;
    }),
  [expenses, period]);

  // P&L calculations
  const revenue   = useMemo(() => activeSales.reduce((s, sale) => s + parseAmt(sale.total), 0), [activeSales]);
  const cogs      = useMemo(() => activeSales.reduce((s, sale) => s + (sale.cogs ?? 0), 0), [activeSales]);
  const opex      = useMemo(() => periodExpenses.reduce((s, e) => s + parseAmt(e.amount), 0), [periodExpenses]);
  const grossProfit = revenue - cogs;
  const netProfit   = grossProfit - opex;
  const margin      = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

  // 6-month chart data (always last 6 months regardless of period filter)
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - 5 + i + 1, 1);
      const monthLabel = d.toLocaleDateString('en-GH', { month: 'short' });
      const mSales = sales.filter(s => {
        if (s.status === 'cancelled' || s.status === 'refunded') return false;
        const sd = parseDate(s.date);
        return sd >= d && sd < nextMonth;
      });
      const mExpenses = expenses.filter(e => {
        if (e.type !== 'expense') return false;
        const ed = parseDate(e.date);
        return ed >= d && ed < nextMonth;
      });
      const rev  = mSales.reduce((s, sale) => s + parseAmt(sale.total), 0);
      const exp  = mExpenses.reduce((s, e) => s + parseAmt(e.amount), 0);
      return { month: monthLabel, revenue: rev, expenses: exp, profit: rev - exp };
    });
  }, [sales, expenses]);

  // Category breakdown for period
  const categoryBreakdown = useMemo(() =>
    expenseCategories.map(cat => ({
      ...cat,
      spent: periodExpenses.filter(e => e.category === cat.id || e.category === cat.name)
        .reduce((s, e) => s + parseAmt(e.amount), 0),
    })).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent),
  [periodExpenses]);

  // Paginated transactions
  const allTx = useMemo(() => [...expenses].sort((a, b) =>
    parseDate(b.date).getTime() - parseDate(a.date).getTime()
  ), [expenses]);
  const txPageCount = Math.ceil(allTx.length / PAGE_SIZE);
  const pagedTx = useMemo(() =>
    allTx.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE),
  [allTx, txPage]);

  const handleSave = async (data: Omit<Expense, 'id'>, id?: string) => {
    if (id) update(id, data as Partial<Expense>);
    else await add(data);
  };

  const handleDelete = (id: string) => {
    remove(id);
    setConfirmDeleteId(null);
  };

  const activeAssets = useMemo(() => assets.filter(a => a.status !== 'disposed'), [assets]);
  const totalPurchaseCost = useMemo(() => activeAssets.reduce((s, a) => s + a.purchase_cost, 0), [activeAssets]);
  const totalCurrentValue = useMemo(() => activeAssets.reduce((s, a) => s + a.current_value, 0), [activeAssets]);
  const assetPageCount = Math.max(1, Math.ceil(assets.length / PAGE_SIZE));
  const pagedAssets = useMemo(() =>
    assets.slice((assetPage - 1) * PAGE_SIZE, assetPage * PAGE_SIZE),
  [assets, assetPage]);

  const handleSaveAsset = async (data: Omit<FixedAsset, 'id' | 'created_at' | 'updated_at' | 'created_by'>, id?: string) => {
    if (id) await updateAsset(id, data);
    else await addAsset(data);
  };

  const handleDeleteAsset = (id: string) => {
    removeAsset(id);
    setConfirmDeleteAssetId(null);
  };

  const tabs = [
    { key: 'overview',     label: 'Overview' },
    { key: 'transactions', label: `Transactions (${expenses.length})` },
    { key: 'budgets',      label: 'Budgets' },
    { key: 'assets',       label: `Assets (${assets.length})` },
  ] as const;

  return (
    <div className="space-y-5">

      {/* Period filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className="h-8 px-3 rounded-lg text-xs font-semibold transition-colors"
            style={period === p
              ? { background: 'hsl(var(--primary))', color: '#fff' }
              : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Revenue" value={fmt(revenue)}
          sub={`${activeSales.length} sales in period`}
          color="hsl(var(--primary))" />
        <KpiCard label="Total Costs" value={fmt(opex)}
          sub={`${periodExpenses.length} expenses`}
          color="#f59e0b" />
        <KpiCard label="Gross Profit" value={fmt(grossProfit)}
          sub="Revenue − COGS"
          color={grossProfit >= 0 ? '#22c55e' : '#ef4444'}
          positive={grossProfit >= 0} />
        <KpiCard label="Net Profit / Loss" value={fmt(netProfit)}
          sub={`${Math.abs(margin)}% ${netProfit >= 0 ? 'margin' : 'loss margin'}`}
          color={netProfit >= 0 ? '#22c55e' : '#ef4444'}
          positive={netProfit >= 0} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl p-1 w-fit"
        style={{ background: 'hsl(var(--muted))' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="h-8 px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
            style={activeTab === t.key
              ? { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
              : { color: 'hsl(var(--muted-foreground))' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Revenue vs Expenses Chart */}
          <div className="rounded-xl p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <h3 className="text-sm font-bold mb-5" style={{ color: 'hsl(var(--foreground))' }}>
              Revenue vs Expenses — Last 6 Months
            </h3>
            {chartData.every(m => m.revenue === 0 && m.expenses === 0) ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2">
                <TrendingUp className="w-8 h-8 opacity-20" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  No data yet. Sales and expenses will appear here.
                </p>
              </div>
            ) : (
              <BarChart data={chartData} />
            )}
          </div>

          {/* P&L Statement */}
          <div className="rounded-xl p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                Profit & Loss Statement
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                style={{ background: netProfit >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                {netProfit >= 0 ? 'Profitable' : 'At a Loss'}
              </span>
            </div>

            <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
              <PnLRow label="Revenue" value={revenue} bold />
              <PnLRow label="Cost of Goods Sold (COGS)" value={-cogs} indent color={cogs > 0 ? '#f59e0b' : undefined} />
              <PnLRow label="Gross Profit" value={grossProfit} bold separator
                color={grossProfit >= 0 ? '#22c55e' : '#ef4444'} />
              <PnLRow label="Operating Expenses" value={null} />

              {/* Category rows */}
              {categoryBreakdown.slice(0, 5).map(cat => (
                <PnLRow key={cat.id} label={cat.name} value={-cat.spent} indent color="#f59e0b" />
              ))}
              {categoryBreakdown.length === 0 && (
                <PnLRow label="No expenses in period" value={0} indent />
              )}

              <PnLRow label="Total Operating Expenses" value={-opex} bold separator color="#f59e0b" />
              <div className="flex items-center justify-between py-4 rounded-lg px-3 mt-2"
                style={{ background: netProfit >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
                <span className="text-sm font-bold" style={{ color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                  Net {netProfit >= 0 ? 'Profit' : 'Loss'}
                </span>
                <div className="flex items-center gap-2">
                  {netProfit >= 0
                    ? <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                    : <TrendingDown className="w-4 h-4 text-[#ef4444]" />}
                  <span className="text-base font-bold" style={{ color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                    {netProfit < 0 ? `(${fmtFull(-netProfit)})` : fmtFull(netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expense by Category */}
          <div className="rounded-xl p-5 lg:col-span-2"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
              Expense Breakdown by Category
            </h3>
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
                No expenses in this period.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {expenseCategories.map(cat => {
                  const budget = budgetMap[cat.id] ?? 0;
                  const spent  = periodExpenses
                    .filter(e => e.category === cat.id || e.category === cat.name)
                    .reduce((s, e) => s + parseAmt(e.amount), 0);
                  if (spent === 0 && budget === 0) return null;
                  const pct    = budget > 0 ? (spent / budget) * 100 : 0;
                  const isOver = budget > 0 && spent > budget;
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                          <span style={{ color: 'hsl(var(--foreground))' }}>{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>{fmt(spent)}</span>
                          {budget > 0 && (
                            <span className="font-semibold" style={{ color: isOver ? '#ef4444' : '#22c55e' }}>
                              {Math.round(pct)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: budget > 0 ? `${Math.min(pct, 100)}%` : spent > 0 ? '100%' : '0%',
                            background: isOver ? '#ef4444' : cat.color,
                            opacity: budget > 0 ? 1 : 0.5,
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS ─────────────────────────────────────────────────────── */}
      {activeTab === 'transactions' && (
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>All Transactions</h3>
            {canEditExpenses && (
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white"
                style={{ background: 'hsl(var(--primary))' }}>
                <Plus className="w-3.5 h-3.5" />
                Add Expense
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
          ) : allTx.length === 0 ? (
            <div className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No expenses yet. Add your first one.
            </div>
          ) : (
            <div>
              {pagedTx.map((tx, i) => (
                <div key={tx.id}
                  style={{ borderBottom: i < pagedTx.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                  {confirmDeleteId === tx.id ? (
                    <div className="flex items-center gap-4 px-5 py-3.5"
                      style={{ background: 'rgba(239,68,68,0.06)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                          Delete "{tx.description}"?
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          This cannot be undone.
                        </p>
                      </div>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="h-7 px-3 rounded-lg text-xs font-semibold"
                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                        Cancel
                      </button>
                      <button onClick={() => handleDelete(tx.id)}
                        className="h-7 px-3 rounded-lg text-xs font-semibold text-white"
                        style={{ background: '#ef4444' }}>
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 px-5 py-3.5 group transition-colors"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted)/0.4)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: tx.type === 'expense' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)' }}>
                        {tx.type === 'expense'
                          ? <TrendingDown className="w-4 h-4" style={{ color: '#ef4444' }} />
                          : <TrendingUp   className="w-4 h-4" style={{ color: '#22c55e' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{tx.category}</span>
                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{tx.date}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={tx.status === 'Paid'
                              ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }
                              : { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-bold flex-shrink-0"
                        style={{ color: tx.type === 'expense' ? '#ef4444' : '#22c55e' }}>
                        {tx.type === 'expense' ? '-' : '+'}GH₵ {parseAmt(tx.amount).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEditExpenses && (
                          <>
                            <button onClick={() => setEditing(tx)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                              style={{ color: 'hsl(var(--muted-foreground))' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setConfirmDeleteId(tx.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                              style={{ color: 'hsl(var(--muted-foreground))' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-3">
            <Pagination page={txPage} pageCount={txPageCount} total={allTx.length} pageSize={PAGE_SIZE} onPageChange={setTxPage} />
          </div>
        </div>
      )}

      {/* ── BUDGETS ──────────────────────────────────────────────────────────── */}
      {activeTab === 'budgets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenseCategories.map(cat => {
            const budget  = budgetMap[cat.id] ?? 0;
            const spent   = expenses
              .filter(e => e.type === 'expense' && (e.category === cat.id || e.category === cat.name))
              .reduce((s, e) => s + parseAmt(e.amount), 0);
            const pct     = budget > 0 ? (spent / budget) * 100 : 0;
            const isOver  = budget > 0 && spent > budget;
            const isEditing = editingBudgetId === cat.id;

            return (
              <div key={cat.id} className="rounded-xl p-5"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${cat.color}20` }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{cat.name}</span>
                  </div>
                  {budget > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={isOver
                        ? { background: 'rgba(239,68,68,0.12)', color: '#ef4444' }
                        : pct > 80
                          ? { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }
                          : { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                      {isOver ? 'Over Budget' : pct > 80 ? 'Near Limit' : 'On Track'}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                    GH₵ {Math.round(spent).toLocaleString()}
                  </span>
                  {budget > 0 && (
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      / GH₵ {Math.round(budget).toLocaleString()}
                    </span>
                  )}
                </div>

                {budget > 0 && (
                  <>
                    <div className="h-1.5 rounded-full overflow-hidden mb-2"
                      style={{ background: 'hsl(var(--muted))' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, background: isOver ? '#ef4444' : cat.color }} />
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {isOver
                        ? `GH₵ ${Math.round(spent - budget).toLocaleString()} over budget`
                        : `GH₵ ${Math.round(budget - spent).toLocaleString()} remaining`}
                    </p>
                  </>
                )}

                {isEditing ? (
                  <form onSubmit={e => {
                    e.preventDefault();
                    setBudget(cat.id, parseFloat(budgetInput) || 0);
                    setEditingBudgetId(null);
                  }} className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5 flex-1 h-9 px-3 rounded-lg"
                      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>GH₵</span>
                      <input autoFocus type="number" value={budgetInput}
                        onChange={e => setBudgetInput(e.target.value)}
                        placeholder="0" min="0"
                        className="flex-1 bg-transparent outline-none text-sm"
                        style={{ color: 'hsl(var(--foreground))' }} />
                    </div>
                    <button type="submit" className="h-9 px-3 rounded-lg text-xs font-semibold text-white"
                      style={{ background: cat.color }}>Save</button>
                    <button type="button" onClick={() => setEditingBudgetId(null)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => { setEditingBudgetId(cat.id); setBudgetInput(budget > 0 ? String(budget) : ''); }}
                    className="w-full h-8 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ background: `${cat.color}18`, color: cat.color }}>
                    {budget > 0 ? 'Edit Budget' : 'Set Budget'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ASSETS (Fixed / Non-current Assets) ─────────────────────────────── */}
      {activeTab === 'assets' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard label="Total Assets" value={String(activeAssets.length)}
              sub={`${assets.length - activeAssets.length} disposed`}
              color="hsl(var(--primary))" />
            <KpiCard label="Total Purchase Cost" value={fmt(totalPurchaseCost)}
              color="#f59e0b" />
            <KpiCard label="Total Current Value" value={fmt(totalCurrentValue)}
              color="#22c55e" />
          </div>

          <div className="rounded-xl overflow-hidden"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Fixed Assets (Non-current Assets)</h3>
              {canManageAssets && (
                <button onClick={() => setShowAddAsset(true)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white"
                  style={{ background: 'hsl(var(--primary))' }}>
                  <Plus className="w-3.5 h-3.5" />
                  Add Asset
                </button>
              )}
            </div>

            {assetsLoading ? (
              <div className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
            ) : assets.length === 0 ? (
              <div className="py-16 text-center">
                <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  No fixed assets yet{canManageAssets ? ' — add your first one.' : '.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left" style={{ borderColor: 'hsl(var(--border))' }}>
                      {['Asset', 'Category', 'Purchase Date', 'Purchase Cost', 'Current Value', 'Status', 'Location', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAssets.map(a => (
                      <tr key={a.id} className="border-b last:border-0" style={{ borderColor: 'hsl(var(--border))' }}>
                        <td className="px-4 py-2.5 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{a.name}</td>
                        <td className="px-4 py-2.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{a.category}</td>
                        <td className="px-4 py-2.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{a.purchase_date || '—'}</td>
                        <td className="px-4 py-2.5" style={{ color: 'hsl(var(--foreground))' }}>{fmtFull(a.purchase_cost)}</td>
                        <td className="px-4 py-2.5 font-semibold" style={{ color: '#22c55e' }}>{fmtFull(a.current_value)}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={
                              a.status === 'active' ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }
                              : a.status === 'under_repair' ? { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }
                              : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                            }>
                            {a.status === 'under_repair' ? 'Under Repair' : a.status === 'disposed' ? 'Disposed' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{a.location || '—'}</td>
                        <td className="px-4 py-2.5">
                          {canManageAssets && (
                            confirmDeleteAssetId === a.id ? (
                              <div className="flex items-center gap-1.5 justify-end">
                                <button onClick={() => setConfirmDeleteAssetId(null)}
                                  className="h-7 px-2.5 rounded-lg text-xs font-semibold"
                                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                                  Cancel
                                </button>
                                <button onClick={() => handleDeleteAsset(a.id)}
                                  className="h-7 px-2.5 rounded-lg text-xs font-semibold text-white"
                                  style={{ background: '#ef4444' }}>
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 justify-end">
                                <button onClick={() => setEditingAsset(a)} className="w-7 h-7 flex items-center justify-center rounded-lg"
                                  style={{ background: 'hsl(var(--muted))' }} title="Edit">
                                  <Pencil className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                </button>
                                <button onClick={() => setConfirmDeleteAssetId(a.id)} className="w-7 h-7 flex items-center justify-center rounded-lg"
                                  style={{ background: 'hsl(var(--muted))' }} title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                                </button>
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-1 pb-1">
                  <Pagination page={assetPage} pageCount={assetPageCount} total={assets.length} pageSize={PAGE_SIZE} onPageChange={setAssetPage} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {(showAdd || editing) && (
        <AddExpenseModal
          categories={expenseCategories}
          expense={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowAdd(false); setEditing(null); }}
        />
      )}
      {canManageAssets && (showAddAsset || editingAsset) && (
        <AddAssetModal
          asset={editingAsset ?? undefined}
          onSave={handleSaveAsset}
          onClose={() => { setShowAddAsset(false); setEditingAsset(null); }}
        />
      )}
    </div>
  );
}
