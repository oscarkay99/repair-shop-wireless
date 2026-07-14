import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useInvoices } from '@/hooks/useInvoices';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';
import { useAuth } from '@/hooks/useAuth';
import { getInvoiceItems } from '@/services/wireless/invoices';
import SearchDropdown from '@/components/shared/SearchDropdown';
import Pagination from '@/components/shared/Pagination';
import DateRangePicker, { type DateRange } from '@/components/shared/DateRangePicker';
import { Check, Share2, Printer, ChevronLeft, X, Pencil, Plus } from 'lucide-react';
import type { Invoice, InvoiceStatus } from '@/types/wireless';

const PAGE_SIZE = 10;

function fmt(n: number) {
  return `¢${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

const STATUS_OPTIONS: InvoiceStatus[] = ['unpaid', 'partial', 'paid', 'overdue', 'cancelled'];

function StatusBadge({ status }: { status: Invoice['status'] }) {
  const styles: Record<string, { bg: string; color: string }> = {
    paid:      { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
    unpaid:    { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    partial:   { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
    overdue:   { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
    cancelled: { bg: 'rgba(100,116,139,0.15)', color: '#64748b' },
  };
  const s = styles[status] ?? styles.unpaid;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1"
        style={{ color: 'hsl(var(--muted-foreground))' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full h-9 px-3 rounded-lg text-sm outline-none";
const inputStyle = { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' };

// ─── Issue Invoice Modal ─────────────────────────────────────────────────────

function IssueInvoiceModal({ onSave, onClose }: {
  onSave: (input: Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>) => Promise<unknown>;
  onClose: () => void;
}) {
  const { customers } = useWirelessCustomers();
  const { user } = useAuth();
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const customerSuggestions = useMemo(() => {
    const q = customerSearch.toLowerCase();
    if (!q) return [];
    return customers
      .filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .map(c => ({ id: c.id, primary: c.name, secondary: c.phone }));
  }, [customers, customerSearch]);

  const selectedCustomer = customers.find(c => c.id === customerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !amount) return;
    const subtotal = parseFloat(amount) || 0;
    setSaving(true);
    try {
      await onSave({
        customer_id: customerId,
        customer: selectedCustomer,
        subtotal,
        tax: 0,
        discount: 0,
        total: subtotal,
        amount_paid: 0,
        status: 'unpaid',
        due_date: dueDate || undefined,
        notes: [description, notes].filter(Boolean).join('\n') || undefined,
        created_by: user?.name,
      });
      onClose();
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Invoice</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {/* Customer search */}
          <Field label="Customer *">
            {selectedCustomer ? (
              <div className="flex items-center justify-between h-9 px-3 rounded-lg"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                <div>
                  <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{selectedCustomer.name}</span>
                  <span className="text-xs ml-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{selectedCustomer.phone}</span>
                </div>
                <button type="button" onClick={() => { setCustomerId(''); setCustomerSearch(''); }}
                  className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <SearchDropdown
                query={customerSearch}
                onQueryChange={setCustomerSearch}
                suggestions={customerSuggestions}
                onSelect={item => { setCustomerId(item.id); setCustomerSearch(item.primary); }}
                placeholder="Search by name or phone…"
                width="100%"
              />
            )}
          </Field>

          <Field label="Description">
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Screen replacement, Labour" className={inputCls} style={inputStyle} />
          </Field>

          <Field label="Amount (GH₵) *">
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00" className={inputCls} style={inputStyle} required />
          </Field>

          <Field label="Due Date">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>

          <Field label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle} />
          </Field>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !customerId || !amount}
              className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'hsl(var(--primary))' }}>
              {saving ? 'Issuing…' : 'Issue Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Edit Invoice Modal (admin only) ────────────────────────────────────────

function EditInvoiceModal({ inv, onSave, onClose }: {
  inv: Invoice;
  onSave: (data: Partial<Pick<Invoice, 'status' | 'amount_paid' | 'due_date' | 'notes'>>) => Promise<void>;
  onClose: () => void;
}) {
  const [status, setStatus]     = useState<InvoiceStatus>(inv.status);
  const [amountPaid, setAmountPaid] = useState(String(inv.amount_paid));
  const [dueDate, setDueDate]   = useState(inv.due_date ?? '');
  const [notes, setNotes]       = useState(inv.notes ?? '');
  const [saving, setSaving]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ status, amount_paid: parseFloat(amountPaid) || 0, due_date: dueDate || undefined, notes: notes || undefined });
      onClose();
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Edit Invoice</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <Field label="Status">
            <select value={status} onChange={e => setStatus(e.target.value as InvoiceStatus)}
              className={inputCls} style={inputStyle}>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Amount Paid (GH₵)">
            <input type="number" min="0" step="0.01" value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>

          <Field label="Due Date">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>

          <Field label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle} />
          </Field>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
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

// ─── Invoice Detail View ────────────────────────────────────────────────────

function InvoiceDetail({ inv, canEdit, onBack, onMarkPaid, onEdit }: {
  inv: Invoice;
  canEdit: boolean;
  onBack: () => void;
  onMarkPaid: (id: string) => void;
  onEdit: () => void;
}) {
  const items = getInvoiceItems(inv.id);
  const subtotal = items.length ? items.reduce((s, i) => s + i.total_price, 0) : inv.subtotal;
  const vat      = Math.round(subtotal * 0.15 * 100) / 100;
  const nhil     = Math.round(subtotal * 0.025 * 100) / 100;
  const getfund  = Math.round(subtotal * 0.025 * 100) / 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: 'hsl(var(--muted-foreground))' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}>
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Invoices
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {canEdit && inv.status !== 'paid' && (
            <button onClick={() => onMarkPaid(inv.id)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white"
              style={{ background: 'hsl(142 60% 40%)' }}>
              <Check className="w-3.5 h-3.5" />
              Mark Paid
            </button>
          )}
          {canEdit && (
            <button onClick={onEdit}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(350 60% 94%)', color: 'hsl(350 60% 30%)', border: '1px solid hsl(350 60% 80%)' }}>
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={async () => {
              const text = `Invoice ${inv.invoice_number} — Total: ${fmt(inv.total)}`;
              if (navigator.share) { await navigator.share({ title: inv.invoice_number, text }); }
              else { await navigator.clipboard.writeText(text); }
            }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="mx-auto max-w-2xl rounded-2xl p-8 print:shadow-none"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-xl font-bold tracking-wide" style={{ color: 'hsl(var(--primary))' }}>WIRELESS</div>
            <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Repair &amp; Service System</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{inv.invoice_number}</div>
            <div className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{fmtDate(inv.created_at)}</div>
            <div className="mt-2"><StatusBadge status={inv.status} /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>BILL TO</div>
            {inv.customer ? (
              <>
                <div className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{inv.customer.name}</div>
                {inv.customer.phone && <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{inv.customer.phone}</div>}
                {inv.customer.email && <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{inv.customer.email}</div>}
                {inv.customer.address && <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{inv.customer.address}</div>}
              </>
            ) : (
              <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>—</div>
            )}
          </div>
        </div>

        <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1px solid hsl(var(--border))' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Description', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-right'}`}
                    style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length ? items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < items.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                  <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>{item.description}</td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: 'hsl(var(--muted-foreground))' }}>{fmt(item.unit_price)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: 'hsl(var(--foreground))' }}>{fmt(item.total_price)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No line items</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ml-auto max-w-xs space-y-1.5 mb-8">
          {[
            { label: 'Subtotal',       value: subtotal },
            { label: 'VAT (15%)',      value: vat },
            { label: 'NHIL (2.5%)',    value: nhil },
            { label: 'GETFUND (2.5%)', value: getfund },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between gap-8">
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{row.label}</span>
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{fmt(row.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-8 pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
            <span className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Total</span>
            <span className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>{fmt(inv.total)}</span>
          </div>
        </div>

        <div className="text-center text-xs pt-6" style={{ borderTop: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
          Thank you for choosing WIRELESS. All repairs are backed by a 90-day warranty.
        </div>
      </div>
    </div>
  );
}

// ─── Invoice List View ──────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { setPageTitle } = usePageTitle();
  const { invoices, loading, add, markStatus, patch } = useInvoices();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showIssue, setShowIssue] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const canIssue = user?.role === 'admin';
  const canEdit  = user?.role === 'admin';

  useEffect(() => { setPage(1); }, [query, dateRange]);

  const selected = selectedId ? invoices.find(i => i.id === selectedId) ?? null : null;

  const handleMarkPaid = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (inv) markStatus(id, 'paid', inv.total);
  };

  useEffect(() => {
    if (selected) {
      setPageTitle({ title: selected.invoice_number, subtitle: 'Invoice Details', hideDefaultAction: true });
    } else {
      setPageTitle({
        title: 'Invoices',
        subtitle: `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`,
        hideDefaultAction: true,
        ...(canIssue ? { action: { label: 'New Invoice', onClick: () => setShowIssue(true) } } : {}),
      });
    }
    return () => setPageTitle({ title: 'Dashboard' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPageTitle, selected?.id, selected?.status, invoices.length, canIssue]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const from = dateRange.from ? new Date(dateRange.from + 'T00:00') : null;
    const to   = dateRange.to   ? new Date(dateRange.to   + 'T23:59:59') : null;
    return invoices.filter(inv => {
      if (q && !inv.invoice_number.toLowerCase().includes(q)
            && !(inv.customer?.name ?? '').toLowerCase().includes(q)) return false;
      if (from || to) {
        const d = new Date(inv.created_at);
        if (from && d < from) return false;
        if (to   && d > to)   return false;
      }
      return true;
    });
  }, [invoices, query, dateRange]);

  const paged = useMemo(() =>
    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  [filtered, page]);

  if (selected) {
    return (
      <>
        <InvoiceDetail
          inv={selected}
          canEdit={canEdit}
          onBack={() => setSelectedId(null)}
          onMarkPaid={handleMarkPaid}
          onEdit={() => setEditingInvoice(selected)}
        />
        {editingInvoice && (
          <EditInvoiceModal
            inv={editingInvoice}
            onSave={data => patch(editingInvoice.id, data)}
            onClose={() => setEditingInvoice(null)}
          />
        )}
      </>
    );
  }

  const paid        = invoices.filter(i => i.status === 'paid');
  const outstanding = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
  const collected   = paid.reduce((s, i) => s + i.amount_paid, 0);
  const outstandingAmt = outstanding.reduce((s, i) => s + (i.total - i.amount_paid), 0);

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Invoices</div>
          <div className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{invoices.length}</div>
        </div>
        <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Revenue Collected</div>
          <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{fmt(collected)}</div>
        </div>
        <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Outstanding</div>
          <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{fmt(outstandingAmt)}</div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <SearchDropdown
            query={query}
            onQueryChange={setQuery}
            suggestions={query.trim() ? filtered.map(inv => {
              const BADGE: Record<string, { bg: string; color: string }> = {
                paid:    { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
                unpaid:  { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
                overdue: { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
                partial: { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
              };
              const b = BADGE[inv.status] ?? BADGE.unpaid;
              return {
                id: inv.id,
                primary: inv.invoice_number,
                secondary: inv.customer?.name ?? '—',
                badge: { label: inv.status.charAt(0).toUpperCase() + inv.status.slice(1), ...b },
              };
            }) : []}
            onSelect={item => setQuery(item.primary)}
            placeholder="Search invoices…"
            width={260}
          />
          <DateRangePicker value={dateRange} onChange={setDateRange} label="Invoice date" />
          {canIssue && (
            <button
              onClick={() => setShowIssue(true)}
              className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white"
              style={{ background: 'hsl(var(--primary))' }}>
              <Plus className="w-3.5 h-3.5" />
              New Invoice
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Invoice #', 'Customer', 'Status', 'Date', 'Total', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    No invoices found.
                  </td>
                </tr>
              ) : paged.map((inv, i) => (
                <tr key={inv.id}
                  style={{ borderBottom: i < paged.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted)/0.4)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold font-mono" style={{ color: 'hsl(var(--primary))' }}>{inv.invoice_number}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{inv.customer?.name ?? '—'}</span>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{fmtDate(inv.created_at)}</td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{fmt(inv.total)}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => setSelectedId(inv.id)}
                      className="text-xs font-medium transition-colors"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        pageCount={Math.ceil(filtered.length / PAGE_SIZE)}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {showIssue && (
        <IssueInvoiceModal onSave={add} onClose={() => setShowIssue(false)} />
      )}
    </div>
  );
}
