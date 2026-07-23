import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';
import RecordPaymentModal from './RecordPaymentModal';

const PAGE_SIZE = 10;

const statusConfig: Record<string, { label: string; dot: string; badge: string; text: string }> = {
  verified:     { label: 'Verified',     dot: '#10B981', badge: 'rgba(16,185,129,0.1)',  text: '#059669' },
  pending:      { label: 'Pending',      dot: '#F59E0B', badge: 'rgba(245,158,11,0.12)', text: '#92400E' },
  failed:       { label: 'Failed',       dot: '#EF4444', badge: 'rgba(239,68,68,0.1)',   text: '#DC2626' },
  needs_review: { label: 'Needs Review', dot: '#06B6D4', badge: 'rgba(6,182,212,0.1)',   text: '#0E7490' },
};

const methodIcons: Record<string, string> = {
  MoMo: 'ri-smartphone-line',
  'Bank Transfer': 'ri-bank-line',
  Cash: 'ri-money-dollar-circle-line',
  Card: 'ri-bank-card-line',
};

export default function TransactionTable() {
  const { transactions, verify, reload } = useTransactions();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [showRecordModal, setShowRecordModal] = useState(false);

  const approve = (id: string) => verify(id, 'verified');

  const filtered = transactions.filter((t) => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchSearch = !search || t.customer.toLowerCase().includes(search.toLowerCase()) || t.reference.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const { paginated: pagedTxns, page, setPage, totalPages, total } = usePagination(filtered, PAGE_SIZE, `${filter}|${search}`);

  const selected = transactions.find(t => t.id === selectedId) ?? transactions[0];
  const items = selected ? [{ name: selected.product, qty: 1, price: selected.amount }] : [];
  const sc = selected ? statusConfig[selected.status] : statusConfig.pending;

  const filters = ['all', 'verified', 'pending', 'needs_review', 'failed'];

  return (
    <div
      className="rounded-2xl overflow-hidden flex"
      style={{
        background: 'white',
        border: '1px solid rgba(7,16,31,0.07)',
        boxShadow: '0 1px 3px rgba(7,16,31,0.04), 0 8px 32px rgba(236,1,24,0.08)',
        height: '620px',
      }}
    >
      {/* ── LEFT: Transaction list ─────────────────────────────────── */}
      <div className="flex flex-col w-[300px] flex-shrink-0" style={{ borderRight: '1px solid rgba(7,16,31,0.07)' }}>
        {/* List header */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(236,1,24,0.08)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold" style={{ color: '#0F172A' }}>Transactions</h3>
            <button
              onClick={() => setShowRecordModal(true)}
              title="Record Payment"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white text-sm cursor-pointer"
              style={{ background: '#EC0118' }}
            >
              <i className="ri-add-line" />
            </button>
          </div>
          {/* Filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-[10px] font-semibold px-2 py-1 rounded-full cursor-pointer transition-all whitespace-nowrap"
                style={filter === f
                  ? { background: '#EC0118', color: 'white' }
                  : { background: 'rgba(236,1,24,0.08)', color: 'rgba(7,16,31,0.5)' }
                }
              >
                {f === 'all' ? 'All' : statusConfig[f]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {pagedTxns.map((txn) => {
            const s = statusConfig[txn.status];
            const isSelected = txn.id === selectedId;
            return (
              <button
                key={txn.id}
                onClick={() => setSelectedId(txn.id)}
                className="w-full text-left px-4 py-3.5 cursor-pointer transition-all block"
                style={{
                  borderBottom: '1px solid rgba(7,16,31,0.05)',
                  background: isSelected ? 'rgba(7,16,31,0.04)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #EC0118' : '3px solid transparent',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[12px] font-bold" style={{ color: '#0F172A' }}>{txn.id}</span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: s.badge, color: s.text }}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className="text-[11px] truncate" style={{ color: 'rgba(7,16,31,0.55)' }}>{txn.product}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(7,16,31,0.38)' }}>{txn.customer}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] font-bold" style={{ color: '#0F172A' }}>{txn.amount}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(7,16,31,0.38)' }}>{txn.date.split(',')[0]}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <i className="ri-inbox-line text-2xl" style={{ color: 'rgba(7,16,31,0.2)' }} />
              <p className="text-xs" style={{ color: 'rgba(7,16,31,0.35)' }}>No transactions found</p>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="px-3 py-1.5" style={{ borderTop: '1px solid rgba(7,16,31,0.07)' }}>
            <Pagination page={page} pageCount={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        )}

        {/* Search */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(236,1,24,0.08)' }}>
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'rgba(7,16,31,0.05)', border: '1px solid rgba(7,16,31,0.07)' }}
          >
            <i className="ri-search-line text-sm" style={{ color: 'rgba(7,16,31,0.35)' }} />
            <input
              type="text"
              placeholder="Search order…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[12px] outline-none flex-1 min-w-0"
              style={{ color: '#0F172A' }}
            />
          </div>
        </div>
      </div>

      {/* ── RIGHT: Detail panel ────────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb */}
          <div
            className="px-6 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(236,1,24,0.08)' }}
          >
            <i className="ri-time-line text-sm" style={{ color: 'rgba(7,16,31,0.35)' }} />
            <span className="text-[11px]" style={{ color: 'rgba(7,16,31,0.4)' }}>Transactions</span>
            <i className="ri-arrow-right-s-line text-sm" style={{ color: 'rgba(7,16,31,0.25)' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#0F172A' }}>Payment Detail</span>
            <div className="ml-auto flex items-center gap-2">
              <button className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ background: 'rgba(7,16,31,0.05)' }}>
                <i className="ri-more-2-line text-sm" style={{ color: 'rgba(7,16,31,0.4)' }} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Order header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[20px] font-bold" style={{ color: '#0F172A' }}>{selected.id}</h2>
              <span
                className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                style={{ background: sc.badge, color: sc.text }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                  style={{ background: sc.dot }}
                />
                {sc.label}
              </span>
            </div>

            {/* Details grid */}
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ background: 'rgba(7,16,31,0.03)', border: '1px solid rgba(236,1,24,0.08)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(7,16,31,0.4)' }}>Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] mb-0.5" style={{ color: 'rgba(7,16,31,0.38)' }}>Customer</p>
                  <p className="text-[12px] font-bold" style={{ color: '#0F172A' }}>{selected.customer}</p>
                  {selected.customerPhone && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(7,16,31,0.45)' }}>{selected.customerPhone}</p>
                  )}
                </div>
                {[
                  { label: 'Method',  value: selected.method },
                  { label: 'Date',    value: selected.date },
                  { label: 'Status',  value: sc.label },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] mb-0.5" style={{ color: 'rgba(7,16,31,0.38)' }}>{label}</p>
                    <p className="text-[12px] font-bold" style={{ color: '#0F172A' }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(236,1,24,0.08)' }}>
                <p className="text-[10px] mb-0.5" style={{ color: 'rgba(7,16,31,0.38)' }}>Reference</p>
                <p className="text-[11px] font-mono font-semibold" style={{ color: '#EC0118' }}>{selected.reference}</p>
              </div>
            </div>

            {/* Line items */}
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ border: '1px solid rgba(236,1,24,0.08)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(7,16,31,0.4)' }}>Order info</p>
                <div className="flex justify-between text-[10px]" style={{ color: 'rgba(7,16,31,0.35)' }}>
                  <span className="mr-6">Items</span>
                  <span>Price</span>
                </div>
              </div>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(7,16,31,0.05)' }}
                      >
                        <i className="ri-box-3-line text-sm" style={{ color: 'rgba(7,16,31,0.4)' }} />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold" style={{ color: '#0F172A' }}>{item.name}</p>
                        {item.qty > 1 && <p className="text-[10px]" style={{ color: 'rgba(7,16,31,0.4)' }}>{item.qty}×</p>}
                      </div>
                    </div>
                    <p className="text-[12px] font-bold flex-shrink-0" style={{ color: '#0F172A' }}>{item.price}</p>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center justify-between mt-4 pt-3"
                style={{ borderTop: '1px solid rgba(7,16,31,0.07)' }}
              >
                <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>Total</p>
                <p className="text-[16px] font-black" style={{ color: '#0F172A' }}>{selected.amount}</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          {(selected.status === 'pending' || selected.status === 'needs_review' || selected.status === 'failed') && (
            <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(7,16,31,0.07)' }}>
              {selected.status === 'pending' || selected.status === 'needs_review' ? (
                <button
                  onClick={() => approve(selected.id)}
                  className="w-full py-3.5 rounded-2xl text-[13px] font-bold text-white cursor-pointer transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #EC0118, #BD0113)' }}
                >
                  <i className="ri-checkbox-circle-line mr-2" />
                  Mark as Verified — {selected.amount}
                </button>
              ) : (
                <button
                  className="w-full py-3.5 rounded-2xl text-[13px] font-bold cursor-pointer transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#DC2626' }}
                >
                  <i className="ri-close-circle-line mr-2" />
                  Transaction Failed — Contact Customer
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <i className="ri-file-list-3-line text-4xl" style={{ color: 'rgba(7,16,31,0.15)' }} />
          <p className="text-sm" style={{ color: 'rgba(7,16,31,0.3)' }}>Select a transaction to view details</p>
        </div>
      )}

      {showRecordModal && (
        <RecordPaymentModal onClose={() => setShowRecordModal(false)} onSaved={reload} />
      )}
    </div>
  );
}
