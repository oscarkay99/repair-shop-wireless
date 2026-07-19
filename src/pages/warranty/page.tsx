import { useState } from 'react';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';
import AdminLayout from '@/components/feature/AdminLayout';
import { warranties, warrantyStats } from '@/mocks/warranty';
import { useWarranty } from '@/hooks/useWarranty';
import WarrantyDetail from './components/WarrantyDetail';
import NewReturnModal from './components/NewReturnModal';

const tabs = ['Warranties', 'Returns & Refunds'];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#25D366', bg: '#25D36615' },
  expiring_soon: { label: 'Expiring Soon', color: '#F59E0B', bg: '#F59E0B15' },
  expired: { label: 'Expired', color: '#94A3B8', bg: '#94A3B815' },
};

const returnStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Approved', color: '#EC0118', bg: 'rgba(236,1,24,0.08)' },
  pending: { label: 'Pending', color: '#F59E0B', bg: '#F59E0B15' },
  rejected: { label: 'Rejected', color: '#E05A2B', bg: '#E05A2B15' },
  completed: { label: 'Completed', color: '#25D366', bg: '#25D36615' },
};

export default function WarrantyPage() {
  const { returns, loading: returnsLoading, addReturn, updateStatus, stats } = useWarranty();
  const [activeTab, setActiveTab] = useState('Warranties');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedWarranty, setSelectedWarranty] = useState<string | null>(null);
  const [showNewReturn, setShowNewReturn] = useState(false);

  const filteredWarranties = warranties.filter(w => {
    const matchSearch = w.customer.toLowerCase().includes(search.toLowerCase()) || w.device.toLowerCase().includes(search.toLowerCase()) || w.imei.includes(search);
    const matchStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const { paginated: pagedWarranties, page: wPage, setPage: setWPage, totalPages: wTotalPages, total: wTotal, from: wFrom, to: wTo } = usePagination(filteredWarranties, 15, `${search}|${filterStatus}`);
  const { paginated: pagedReturns, page: rPage, setPage: setRPage, totalPages: rTotalPages, total: rTotal, from: rFrom, to: rTo } = usePagination(returns as never[], 15);

  const selected = warranties.find(w => w.id === selectedWarranty);

  return (
    <AdminLayout title="Warranty & Returns" subtitle="Track warranties · Manage returns · Process refunds">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Active Warranties', value: `${warrantyStats.totalActive}`, icon: 'ri-shield-check-line', color: '#25D366' },
          { label: 'Expiring Soon', value: `${warrantyStats.expiringSoon}`, icon: 'ri-alarm-warning-line', color: '#F59E0B' },
          { label: 'Pending Returns', value: `${stats.pendingReturns}`, icon: 'ri-arrow-go-back-line', color: '#E05A2B' },
          { label: 'Total Returns', value: `${stats.totalReturns}`, icon: 'ri-refund-2-line', color: '#EC0118' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-2xl p-4 border border-[hsl(var(--border))]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <i className={`${s.icon} text-sm`} style={{ color: s.color }} />
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-[hsl(var(--foreground))]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex border border-[hsl(var(--border))] rounded-xl p-1 bg-[hsl(var(--card))]">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
              style={activeTab === tab ? { background: '#EC0118' } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewReturn(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
          style={{ background: '#E05A2B' }}
        >
          <i className="ri-arrow-go-back-line mr-1" /> New Return Request
        </button>
      </div>

      {/* Warranties Tab */}
      {activeTab === 'Warranties' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 flex-1">
                <i className="ri-search-line text-[hsl(var(--muted-foreground))] text-sm" />
                <input
                  type="text"
                  placeholder="Search by customer, device, or IMEI..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm text-[hsl(var(--muted-foreground))] outline-none w-full"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'active', 'expiring_soon', 'expired'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${filterStatus === f ? 'text-white' : 'bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}
                    style={filterStatus === f ? { background: '#EC0118' } : {}}
                  >
                    {f === 'all' ? 'All' : f === 'expiring_soon' ? 'Expiring' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
              <div className="divide-y divide-[hsl(var(--border))]">
                {pagedWarranties.map(w => {
                  const st = statusConfig[w.status];
                  return (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWarranty(selectedWarranty === w.id ? null : w.id)}
                      className={`w-full flex items-center gap-4 p-4 text-left hover:bg-[hsl(var(--muted))]/50 transition-colors ${selectedWarranty === w.id ? 'bg-[rgba(236,1,24,0.04)]' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: st.bg }}>
                        <i className="ri-shield-check-line text-sm" style={{ color: st.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{w.customer}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: st.color }}>{st.label}</span>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{w.device}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">IMEI: {w.imei} · {w.type} · {w.duration}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Expires {w.expiryDate}</p>
                        {w.status === 'active' && <p className="text-[10px]" style={{ color: '#25D366' }}>{w.daysLeft} days left</p>}
                        {w.status === 'expiring_soon' && <p className="text-[10px]" style={{ color: '#F59E0B' }}>{w.daysLeft} days left</p>}
                        {w.status === 'expired' && <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Expired</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <Pagination page={wPage} pageCount={wTotalPages} total={wTotal} pageSize={15} onPageChange={setWPage} />
            </div>
          </div>

          {/* Detail Panel */}
          <div>
            {selected ? (
              <WarrantyDetail
                warranty={selected}
                onClose={() => setSelectedWarranty(null)}
                onNewReturn={() => setShowNewReturn(true)}
              />
            ) : (
              <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-8 text-center">
                <i className="ri-shield-check-line text-3xl text-[hsl(var(--muted-foreground))] mb-3" />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Select a warranty to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === 'Returns & Refunds' && (
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
          {returnsLoading ? (
            <div className="flex items-center justify-center py-16 text-[hsl(var(--muted-foreground))] text-sm">
              <i className="ri-loader-4-line animate-spin mr-2" />Loading returns…
            </div>
          ) : returns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <i className="ri-arrow-go-back-line text-3xl text-[hsl(var(--muted-foreground))] mb-3" />
              <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">No return requests yet</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Click "New Return Request" to log one</p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {(pagedReturns as typeof returns).map(ret => {
                const st = returnStatusConfig[ret.status] ?? returnStatusConfig.pending;
                return (
                  <div key={ret.id} className="p-4 flex items-start gap-4 hover:bg-[hsl(var(--muted))]/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: st.bg }}>
                      <i className="ri-arrow-go-back-line text-sm" style={{ color: st.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{ret.id}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: st.color }}>{st.label}</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--foreground))]">{ret.customer} · {ret.product}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{ret.issue}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Requested: {ret.date} · Resolution: {ret.notes}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {ret.status === 'pending' && (
                        <div className="flex gap-1 mt-2">
                          <button onClick={() => updateStatus(ret.id, 'approved')} className="px-2 py-1 rounded-lg text-[10px] font-semibold text-white cursor-pointer" style={{ background: '#25D366' }}>Approve</button>
                          <button onClick={() => updateStatus(ret.id, 'rejected')} className="px-2 py-1 rounded-lg text-[10px] font-semibold text-white cursor-pointer" style={{ background: '#E05A2B' }}>Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Pagination page={rPage} pageCount={rTotalPages} total={rTotal} pageSize={15} onPageChange={setRPage} />
        </div>
      )}

      {showNewReturn && <NewReturnModal onClose={() => setShowNewReturn(false)} onSave={addReturn} />}
    </AdminLayout>
  );
}