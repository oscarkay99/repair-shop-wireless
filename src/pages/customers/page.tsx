import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';
import { useRepairs } from '@/hooks/useRepairs';
import { useAuth } from '@/hooks/useAuth';
import SearchDropdown from '@/components/shared/SearchDropdown';
import Pagination from '@/components/shared/Pagination';
import DateRangePicker, { type DateRange } from '@/components/shared/DateRangePicker';
import { X, Pencil } from 'lucide-react';
import type { WCustomer } from '@/types/wireless';

const PAGE_SIZE = 10;

// ── Add Customer Modal ────────────────────────────────────────────────────────

function AddCustomerModal({ onSave, onClose }: {
  onSave: (c: Omit<WCustomer, 'id' | 'ticket_count' | 'total_spent' | 'created_at' | 'updated_at'>) => Promise<unknown>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Customer</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: 'hsl(var(--muted))' }}
          >
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {[
            { key: 'name',    label: 'Full Name *',    type: 'text',  required: true },
            { key: 'phone',   label: 'Phone *',        type: 'tel',   required: true },
            { key: 'email',   label: 'Email',          type: 'email', required: false },
            { key: 'address', label: 'Address',        type: 'text',  required: false },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {f.label}
              </label>
              <input
                required={f.required}
                type={f.type}
                value={(form as Record<string, string>)[f.key]}
                onChange={e => set(f.key, e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: 'hsl(var(--primary))' }}>
              {saving ? 'Saving…' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Edit Customer Modal ──────────────────────────────────────────────────────

function EditCustomerModal({ customer, onSave, onClose }: {
  customer: WCustomer;
  onSave: (data: Partial<WCustomer>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name:    customer.name,
    phone:   customer.phone,
    email:   customer.email ?? '',
    address: customer.address ?? '',
    notes:   customer.notes  ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Edit Customer</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {[
            { key: 'name',    label: 'Full Name *', type: 'text',  required: true },
            { key: 'phone',   label: 'Phone *',     type: 'tel',   required: true },
            { key: 'email',   label: 'Email',       type: 'email', required: false },
            { key: 'address', label: 'Address',     type: 'text',  required: false },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {f.label}
              </label>
              <input
                required={f.required}
                type={f.type}
                value={(form as Record<string, string>)[f.key]}
                onChange={e => set(f.key, e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: 'hsl(var(--primary))' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Customer Detail Panel ────────────────────────────────────────────────────

function CustomerDetailPanel({ customer, lastRepair, canEdit, onEdit, onClose }: {
  customer: WCustomer;
  lastRepair: string | null;
  canEdit: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="absolute right-0 top-0 bottom-0 w-full lg:w-80 overflow-y-auto"
        style={{ background: 'hsl(var(--card))', borderLeft: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Customer Profile</p>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={e => { e.stopPropagation(); onEdit(); }}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: 'hsl(354 60% 94%)', color: 'hsl(354 60% 30%)', border: '1px solid hsl(354 60% 80%)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(354 60% 88%)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(354 60% 94%)'; }}
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
              <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base"
              style={{ background: 'hsl(var(--primary))' }}>
              {customer.name[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{customer.name}</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{customer.phone}</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Email',        value: customer.email || '—' },
              { label: 'Address',      value: customer.address || '—' },
              { label: '# Jobs',       value: String(customer.ticket_count) },
              { label: 'Total Spent',  value: `GHS ${customer.total_spent.toFixed(2)}` },
              { label: 'Last Job',     value: lastRepair ?? '—' },
              { label: 'Member Since', value: new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
            ].map(r => (
              <div key={r.label} className="flex items-start justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'hsl(var(--border))' }}>
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.label}</span>
                <span className="text-xs font-semibold text-right max-w-[160px]" style={{ color: 'hsl(var(--foreground))' }}>{r.value}</span>
              </div>
            ))}
          </div>
          {customer.notes && (
            <div>
              <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Notes</p>
              <p className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>{customer.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ACTIVITY_FILTERS = ['1hr', '2hrs', '3hrs', '4hrs', '24hrs', '48hrs', '72hrs', 'All'] as const;
type ActivityFilter = typeof ACTIVITY_FILTERS[number];

function activityHours(f: ActivityFilter): number | null {
  if (f === 'All') return null;
  return parseInt(f);
}

export default function CustomersPage() {
  const { setPageTitle } = usePageTitle();
  const { customers, loading, add, patch } = useWirelessCustomers();
  const { repairs } = useRepairs();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('All');
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<WCustomer | null>(null);

  const canEdit = user?.role === 'admin' || (user?.permissions ?? []).includes('customers:edit');

  useEffect(() => { setPage(1); }, [search, activityFilter, dateRange]);

  useEffect(() => {
    setPageTitle({
      title: 'Customers',
      subtitle: `${customers.length} registered customer${customers.length !== 1 ? 's' : ''}`,
      action: { label: 'Add Customer', onClick: () => setShowAdd(true) },
    });
  }, [customers.length, setPageTitle]);

  // last repair date per customer
  const lastRepairByCustomer = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of repairs) {
      if (!r.customerId) continue;
      const received = r.createdAt ?? r.started;
      const existing = map[r.customerId];
      if (!existing || received > existing) {
        map[r.customerId] = received;
      }
    }
    return map;
  }, [repairs]);

  // last activity date per customer — Repair has no updated_at, so this approximates
  // "activity" as completion date if closed, else the intake date.
  const lastActivityByCustomer = useMemo(() => {
    const map: Record<string, Date> = {};
    for (const r of repairs) {
      if (!r.customerId) continue;
      const d = new Date(r.completedDate ?? r.createdAt ?? r.started);
      if (!map[r.customerId] || d > map[r.customerId]) {
        map[r.customerId] = d;
      }
    }
    return map;
  }, [repairs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const hours = activityHours(activityFilter);
    const cutoff = hours ? new Date(Date.now() - hours * 3_600_000) : null;
    const from = dateRange.from ? new Date(dateRange.from + 'T00:00') : null;
    const to   = dateRange.to   ? new Date(dateRange.to   + 'T23:59:59') : null;

    return customers.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(q) && !c.email.toLowerCase().includes(q)) return false;
      if (cutoff) {
        const last = lastActivityByCustomer[c.id];
        if (!last || last < cutoff) return false;
      }
      if (from || to) {
        const d = new Date(c.created_at);
        if (from && d < from) return false;
        if (to   && d > to)   return false;
      }
      return true;
    });
  }, [customers, search, activityFilter, dateRange, lastActivityByCustomer]);

  const paged = useMemo(() =>
    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  [filtered, page]);

  const selected = selectedId ? customers.find(c => c.id === selectedId) ?? null : null;

  return (
    <div className="space-y-4">

      {/* Search + Activity filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <SearchDropdown
          query={search}
          onQueryChange={setSearch}
          suggestions={search.trim() ? filtered.map(c => ({
            id: c.id,
            primary: c.name,
            secondary: `${c.phone}${c.email ? ' · ' + c.email : ''}`,
            meta: `${c.ticket_count} job${c.ticket_count !== 1 ? 's' : ''}`,
          })) : []}
          onSelect={item => setSearch(item.primary)}
          placeholder="Search customers…"
          width={256}
        />

        {/* Activity filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Last Activity
          </span>
          {ACTIVITY_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActivityFilter(f)}
              className="px-3 h-7 rounded-full text-xs font-semibold transition-colors"
              style={activityFilter === f
                ? { background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }
                : { background: 'transparent', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
            >
              {f}
            </button>
          ))}
          <DateRangePicker value={dateRange} onChange={setDateRange} label="Member since" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              {['Name', 'Phone', 'Email', '# Jobs', 'Last Job'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  No customers found
                </td>
              </tr>
            ) : paged.map((c, i) => {
              const lastRepairRaw = lastRepairByCustomer[c.id];
              const lastRepair = lastRepairRaw
                ? new Date(lastRepairRaw).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
                : '—';
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: i < paged.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  <td className="px-5 py-3.5 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    {c.name}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {c.phone}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {c.email || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                      style={{ background: 'hsl(var(--primary))' }}
                    >
                      {c.ticket_count}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {lastRepair}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <Pagination
        page={page}
        pageCount={Math.ceil(filtered.length / PAGE_SIZE)}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {showAdd && (
        <AddCustomerModal onSave={add} onClose={() => setShowAdd(false)} />
      )}
      {selected && (
        <CustomerDetailPanel
          customer={selected}
          lastRepair={lastRepairByCustomer[selected.id]
            ? new Date(lastRepairByCustomer[selected.id]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : null}
          canEdit={canEdit}
          onEdit={() => { setEditingCustomer(selected); setSelectedId(null); }}
          onClose={() => setSelectedId(null)}
        />
      )}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onSave={data => patch(editingCustomer.id, data)}
          onClose={() => setEditingCustomer(null)}
        />
      )}
    </div>
  );
}
