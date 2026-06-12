import { useState, useMemo } from 'react';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';
import AdminLayout from '@/components/feature/AdminLayout';
import { expenseCategories } from '@/mocks/expenses';
import AddExpenseModal from './components/AddExpenseModal';
import { useExpenses } from '@/hooks/useExpenses';
import { useSales } from '@/hooks/useSales';
import { useBudgets } from '@/hooks/useBudgets';
import type { Expense } from '@/services/expenses';

const tabs = ['Overview', 'Transactions', 'Budgets'];

export default function ExpensesPage() {
  const { expenses, loading, add: addExpense, update: updateExpense, remove: removeExpense } = useExpenses();
  const { sales } = useSales();
  const { budgetMap, setBudget } = useBudgets();
  const [activeTab, setActiveTab] = useState('Overview');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { paginated: pagedExpenses, page: expPage, setPage: setExpPage, totalPages: expTotalPages, total: expTotal, from: expFrom, to: expTo } = usePagination(expenses, 20);

  const now = new Date();
  const parseAmt = (s: string | number) => typeof s === 'number' ? s : parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;

  const thisMonth = now.toLocaleDateString('en-GH', { month: 'short' });
  const thisYear = String(now.getFullYear());

  const activeSales = sales.filter(s => s.status !== 'cancelled' && s.status !== 'refunded');
  const monthlySales = activeSales.filter(s => s.date?.includes(thisMonth) && s.date?.includes(thisYear));
  const monthlyRevenue = monthlySales.reduce((sum, s) => sum + parseAmt(s.total), 0);
  const monthlyCogs = monthlySales.reduce((sum, s) => sum + (s.cogs ?? 0), 0);
  const monthlyOpEx = expenses
    .filter(e => e.type === 'expense' && e.date?.includes(thisMonth) && e.date?.includes(thisYear))
    .reduce((sum, e) => sum + parseAmt(e.amount), 0);
  const grossProfit = monthlyRevenue - monthlyCogs;
  const netProfit = grossProfit - monthlyOpEx;
  const netMargin = monthlyRevenue > 0 ? Math.round((netProfit / monthlyRevenue) * 100) : 0;
  const hasCogs = monthlySales.some(s => (s.cogs ?? 0) > 0);

  const ytdRevenue = activeSales.filter(s => s.date?.includes(String(now.getFullYear()))).reduce((sum, s) => sum + parseAmt(s.total), 0);
  const ytdCogs = activeSales.filter(s => s.date?.includes(String(now.getFullYear()))).reduce((sum, s) => sum + (s.cogs ?? 0), 0);
  const ytdOpEx = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + parseAmt(e.amount), 0);
  const ytdGrossProfit = ytdRevenue - ytdCogs;
  const ytdNetProfit = ytdGrossProfit - ytdOpEx;

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const month = d.toLocaleDateString('en-GH', { month: 'short' });
      const year = String(d.getFullYear());
      const mSales = activeSales.filter(s => s.date?.includes(month) && s.date?.includes(year));
      const rev = mSales.reduce((sum, s) => sum + parseAmt(s.total), 0);
      const cogs = mSales.reduce((sum, s) => sum + (s.cogs ?? 0), 0);
      const opex = expenses
        .filter(e => e.type === 'expense' && e.date?.includes(month) && e.date?.includes(year))
        .reduce((sum, e) => sum + parseAmt(e.amount), 0);
      return { month, revenue: rev, expenses: opex, cogs, profit: rev - cogs - opex };
    });
  }, [sales, expenses]);

  const handleSave = async (data: Omit<Expense, 'id'>, id?: string) => {
    if (id) {
      await updateExpense(id, data);
    } else {
      await addExpense(data);
      setActiveTab('Transactions');
    }
  };

  const handleDelete = async (id: string) => {
    await removeExpense(id);
    setConfirmDeleteId(null);
  };

  return (
    <AdminLayout title="Expenses & Profit" subtitle="Track spending · Monitor margins · Budget control">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Monthly Revenue',    value: `GHS ${Math.round(monthlyRevenue).toLocaleString()}`,  icon: 'ri-money-dollar-circle-line', color: '#DC1F1F', sub: null },
          { label: 'COGS',               value: `GHS ${Math.round(monthlyCogs).toLocaleString()}`,     icon: 'ri-shopping-cart-line',        color: '#E05A2B', sub: hasCogs ? null : 'Add cost prices to inventory' },
          { label: 'Gross Profit',       value: `GHS ${Math.round(grossProfit).toLocaleString()}`,     icon: 'ri-arrow-up-circle-line',      color: '#25D366', sub: 'Revenue − COGS' },
          { label: 'Net Profit',         value: `GHS ${Math.round(netProfit).toLocaleString()}`,       icon: 'ri-percent-line',              color: netProfit >= 0 ? '#25D366' : '#E05A2B', sub: `${netMargin}% margin` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <i className={`${s.icon} text-sm`} style={{ color: s.color }} />
              </div>
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
            {s.sub && <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* YTD Banner */}
      <div className="rounded-2xl p-5 mb-5 flex items-center justify-between overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #DC1F1F 100%)' }}>
        <div className="relative">
          <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">Year to Date</p>
          <h2 className="text-white text-xl font-bold tracking-tight">GHS {Math.round(ytdRevenue).toLocaleString()} revenue · GHS {Math.round(ytdNetProfit).toLocaleString()} net profit</h2>
          <p className="text-white/50 text-xs mt-1.5">Jan – {now.toLocaleDateString('en-GH', { month: 'short' })} {now.getFullYear()} · Gross: GHS {Math.round(ytdGrossProfit).toLocaleString()} · OpEx: GHS {Math.round(ytdOpEx).toLocaleString()}{ytdRevenue > 0 ? ` · ${Math.round((ytdNetProfit / ytdRevenue) * 100)}% net margin` : ''}</p>
        </div>
        <div className="relative hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-white/40 text-[10px] uppercase tracking-wider">YTD Net Profit</p>
            <p className="text-white text-lg font-bold">GHS {Math.round(ytdNetProfit).toLocaleString()}</p>
            <p className="text-white/50 text-xs">{expenses.filter(e => e.status === 'Pending').length} pending expenses</p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)' }}>
            <i className="ri-file-list-3-line text-2xl" style={{ color: '#F59E0B' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex border border-slate-200 rounded-xl p-1 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
              style={activeTab === tab ? { background: '#DC1F1F' } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddExpense(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
          style={{ background: '#E05A2B' }}
        >
          <i className="ri-add-line mr-1" /> Add Expense
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Monthly Chart */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Revenue vs Expenses (Last 6 Months)</h3>
            {chartData.every(m => m.revenue === 0 && m.expenses === 0) ? (
              <div className="h-48 flex flex-col items-center justify-center text-center">
                <i className="ri-bar-chart-2-line text-3xl text-slate-200 block mb-2" />
                <p className="text-sm text-slate-400">No data yet. Sales and expenses will appear here.</p>
              </div>
            ) : (() => {
              const maxVal = Math.max(...chartData.map(m => Math.max(m.revenue, m.expenses)), 1);
              return (
                <div className="flex items-end gap-3 h-48 px-2">
                  {chartData.map((month) => (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col gap-0.5">
                        <div className="w-full rounded-t-md relative group" style={{ height: `${Math.max((month.revenue / maxVal) * 150, month.revenue > 0 ? 4 : 0)}px`, background: '#DC1F1F' }}>
                          {month.revenue > 0 && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              GHS {month.revenue.toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="w-full rounded-b-md relative group" style={{ height: `${Math.max((month.expenses / maxVal) * 150, month.expenses > 0 ? 4 : 0)}px`, background: '#E05A2B' }}>
                          {month.expenses > 0 && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              GHS {month.expenses.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">{month.month}</span>
                      {(month.revenue > 0 || month.expenses > 0) && (
                        <span className="text-[10px] font-semibold" style={{ color: month.profit >= 0 ? '#25D366' : '#E05A2B' }}>
                          {month.profit >= 0 ? '+' : ''}GHS {Math.round(month.profit).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: '#DC1F1F' }} />
                <span className="text-slate-500">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: '#E05A2B' }} />
                <span className="text-slate-500">Expenses</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Expense by Category</h3>
            <div className="space-y-3">
              {expenseCategories.map((cat) => {
                const budget = budgetMap[cat.id] ?? 0;
                const spent = expenses
                  .filter(e => e.type === 'expense' && e.category === cat.id)
                  .reduce((sum, e) => sum + parseAmt(e.amount), 0);
                const percent = budget > 0 ? (spent / budget) * 100 : 0;
                const isOver = budget > 0 && spent > budget;
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded" style={{ background: cat.color }} />
                        <span className="text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {budget > 0 ? (
                          <>
                            <span className="text-slate-500">GHS {Math.round(spent).toLocaleString()} / GHS {Math.round(budget).toLocaleString()}</span>
                            <span className={`font-semibold ${isOver ? 'text-red-500' : 'text-slate-700'}`}>{Math.round(percent)}%</span>
                          </>
                        ) : (
                          <span className="text-slate-500">GHS {Math.round(spent).toLocaleString()} <span className="text-slate-300">— no budget set</span></span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: budget > 0 ? `${Math.min(percent, 100)}%` : spent > 0 ? '100%' : '0%',
                          background: isOver ? '#E05A2B' : cat.color,
                          opacity: budget > 0 ? 1 : 0.35,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'Transactions' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">All Transactions</h3>
            <span className="text-xs text-slate-400">{expenses.length} entries</span>
          </div>
          {loading ? (
            <div className="py-16 text-center">
              <i className="ri-loader-4-line text-3xl text-slate-200 block mb-2 animate-spin" />
              <p className="text-sm text-slate-400">Loading expenses…</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-16 text-center">
              <i className="ri-receipt-line text-3xl text-slate-200 block mb-2" />
              <p className="text-sm text-slate-400">No expenses yet. Add your first one.</p>
            </div>
          ) : null}
          <div className="divide-y divide-slate-100">
            {pagedExpenses.map((tx) => (
              <div key={tx.id} className={`transition-colors ${confirmDeleteId === tx.id ? 'bg-red-50' : 'hover:bg-slate-50/50'}`}>
                {confirmDeleteId === tx.id ? (
                  /* Inline delete confirmation */
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-100">
                      <i className="ri-delete-bin-line text-lg text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-700">Delete "{tx.description}"?</p>
                      <p className="text-xs text-red-400 mt-0.5">This cannot be undone.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tx.type === 'expense' ? '#E05A2B15' : '#25D36615' }}>
                      <i className={`${tx.type === 'expense' ? 'ri-arrow-down-line' : 'ri-arrow-up-line'} text-lg`} style={{ color: tx.type === 'expense' ? '#E05A2B' : '#25D366' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{tx.description}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500">
                        <span>{tx.category}</span>
                        <span>{tx.date}</span>
                        <span className={`px-1.5 py-0.5 rounded-full ${tx.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{tx.status}</span>
                      </div>
                    </div>
                    <p className={`text-sm font-bold flex-shrink-0 ${tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                      {tx.type === 'expense' ? '-' : '+'}GHS {parseAmt(tx.amount).toLocaleString()}
                    </p>
                    {/* Action buttons — visible on hover */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingExpense(tx)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                        title="Edit"
                      >
                        <i className="ri-pencil-line text-sm" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(tx.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={expPage} totalPages={expTotalPages} total={expTotal} from={expFrom} to={expTo} onPageChange={setExpPage} />
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'Budgets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenseCategories.map((cat) => {
            const budget = budgetMap[cat.id] ?? 0;
            const spent = expenses
              .filter(e => e.type === 'expense' && e.category === cat.id)
              .reduce((sum, e) => sum + parseAmt(e.amount), 0);
            const percent = budget > 0 ? (spent / budget) * 100 : 0;
            const isOver = budget > 0 && spent > budget;
            const isEditing = editingBudgetId === cat.id;

            return (
              <div key={cat.id} className="bg-white rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${cat.color}15` }}>
                      <i className="ri-folder-line text-sm" style={{ color: cat.color }} />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                  </div>
                  {budget > 0 && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOver ? 'bg-red-50 text-red-500' : percent > 80 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                      {isOver ? 'Over Budget' : percent > 80 ? 'Near Limit' : 'On Track'}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-2xl font-bold text-slate-800">GHS {Math.round(spent).toLocaleString()}</span>
                  {budget > 0 && <span className="text-xs text-slate-400">/ GHS {Math.round(budget).toLocaleString()}</span>}
                </div>

                {budget > 0 && (
                  <>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(percent, 100)}%`, background: isOver ? '#E05A2B' : cat.color }} />
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      {isOver
                        ? `GHS ${Math.round(spent - budget).toLocaleString()} over budget`
                        : `GHS ${Math.round(budget - spent).toLocaleString()} remaining`}
                    </p>
                  </>
                )}

                {/* Budget editor */}
                {isEditing ? (
                  <form onSubmit={e => { e.preventDefault(); setBudget(cat.id, parseFloat(budgetInput) || 0); setEditingBudgetId(null); }}
                    className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 flex-1 rounded-xl px-3 py-2 text-sm" style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)' }}>
                      <span className="text-slate-400 text-xs">GHS</span>
                      <input
                        autoFocus
                        type="number"
                        value={budgetInput}
                        onChange={e => setBudgetInput(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="flex-1 outline-none bg-transparent text-slate-800 text-sm"
                      />
                    </div>
                    <button type="submit" className="px-3 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap" style={{ background: cat.color }}>
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingBudgetId(null)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 cursor-pointer whitespace-nowrap">
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => { setEditingBudgetId(cat.id); setBudgetInput(budget > 0 ? String(budget) : ''); }}
                    className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors hover:opacity-90"
                    style={{ background: `${cat.color}15`, color: cat.color }}
                  >
                    <i className="ri-pencil-line mr-1" />
                    {budget > 0 ? 'Edit Budget' : 'Set Budget'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(showAddExpense || editingExpense) && (
        <AddExpenseModal
          categories={expenseCategories}
          expense={editingExpense ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowAddExpense(false); setEditingExpense(null); }}
        />
      )}
    </AdminLayout>
  );
}
