import { useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { useCustomers } from '@/hooks/useCustomers';
import CustomerDetail from './components/CustomerDetail';
import AddCustomerModal from './components/AddCustomerModal';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';

const segmentConfig: Record<string, { label: string; color: string }> = {
  VIP: { label: 'VIP', color: 'bg-amber-100 text-amber-700' },
  Repeat: { label: 'Repeat', color: 'bg-slate-100 text-slate-700' },
  New: { label: 'New', color: 'bg-emerald-100 text-emerald-700' },
  'At-Risk': { label: 'At-Risk', color: 'bg-red-100 text-red-600' },
};

export default function CustomersPage() {
  const { customers, add } = useCustomers();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const parseLtv = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
  const avgLtv = customers.length ? customers.reduce((sum, c) => sum + parseLtv(c.ltv), 0) / customers.length : 0;
  const stats = [
    { label: 'Total Customers', value: customers.length, icon: 'ri-group-line', accent: 'bg-[#DC1F1F]' },
    { label: 'VIP',             value: customers.filter(c => c.segment === 'VIP').length, icon: 'ri-vip-crown-line', accent: 'bg-amber-500' },
    { label: 'At-Risk',         value: customers.filter(c => c.segment === 'At-Risk').length, icon: 'ri-alarm-warning-line', accent: 'bg-red-500' },
    { label: 'Avg. LTV',        value: `GHS ${Math.round(avgLtv).toLocaleString()}`, icon: 'ri-line-chart-line', accent: 'bg-emerald-500' },
  ];

  const q = search.trim().toLowerCase();
  const filtered = customers.filter((c) => {
    const matchSegment = filter === 'all' || c.segment === filter;
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
    return matchSegment && matchSearch;
  });
  const { paginated, page, setPage, totalPages, total, from, to } = usePagination(filtered, 12, `${search}|${filter}`);
  const customer = selected ? customers.find((c) => c.id === selected) : null;

  return (
    <AdminLayout title="Customers" subtitle="Profiles, segments, and lifetime value">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.accent} rounded-l-2xl`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <i className={`${s.icon} text-lg`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-sm">
          <div className="w-4 h-4 flex items-center justify-center text-slate-400">
            <i className="ri-search-line text-sm" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="bg-transparent text-sm text-slate-600 outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'VIP', 'Repeat', 'New', 'At-Risk'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filter === f ? 'bg-[#DC1F1F] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#DC1F1F] hover:bg-[#B81616] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors duration-150 cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line text-sm" />
          New Customer
        </button>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-4 bg-white rounded-2xl border border-slate-100 py-16 text-center">
            <i className="ri-group-line text-3xl text-slate-200 block mb-2" />
            <p className="text-sm text-slate-400">No customers yet. They'll appear here after first purchases.</p>
          </div>
        )}
        {paginated.map((c) => {
          const seg = segmentConfig[c.segment];
          return (
            <div
              key={c.id}
              onClick={() => setSelected(c.id)}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${c.segment === 'VIP' ? 'bg-amber-500' : c.segment === 'At-Risk' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                  <p className="text-[10px] text-slate-400">{c.phone}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${seg.color}`}>{seg.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-400">LTV</p>
                  <p className="text-sm font-bold text-slate-800">{c.ltv}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-400">Orders</p>
                  <p className="text-sm font-bold text-slate-800">{c.orders}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Since {c.since}</span>
                <span>Last: {c.lastOrder}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} onPageChange={setPage} />
      {customer && <CustomerDetail customer={customer} onClose={() => setSelected(null)} />}
      {showAdd && <AddCustomerModal onSave={add} onClose={() => setShowAdd(false)} />}
    </AdminLayout>
  );
}