import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/hooks/useAuth';
import CustomerPicker from '@/components/shared/CustomerPicker';
import type { WCustomer } from '@/types/wireless';
import { useWirelessSettings } from '@/hooks/useWirelessSettings';
import { useTaxSettings } from '@/hooks/useTaxSettings';
import { useToast } from '@/contexts/ToastContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  getInvoiceItems, sendInvoiceEmail, createInvoice, patchInvoice, deleteInvoice,
  getInvoicesPage, getInvoiceTotals, type InvoiceTotals,
} from '@/services/wireless/invoices';
import { recordPayment, getPaymentsForInvoice } from '@/services/wireless/payments';
import SearchDropdown from '@/components/shared/SearchDropdown';
import Pagination from '@/components/shared/Pagination';
import DateRangePicker, { type DateRange } from '@/components/shared/DateRangePicker';
import { Check, Share2, Printer, Download, Mail, Loader2, ChevronLeft, X, Pencil, Plus, Receipt, Trash2 } from 'lucide-react';
import type { Invoice, InvoiceItem, InvoiceStatus, Payment } from '@/types/wireless';
import type { PaymentMethod } from '@/types/sale';
import { errMessage } from '@/utils/errors';
import { downloadInvoicePdf, printInvoicePdf, invoicePdfBase64 } from '@/utils/invoicePdf';
import { downloadPaymentReceiptPdf } from '@/utils/paymentReceiptPdf';
import { getTicketPublicTokenById } from '@/services/repairs';
import { SERVICE_TERMS_URL } from '@/utils/pdfBranding';

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Card', 'MoMo', 'Bank Transfer'];

const PAYMENT_METHOD_COLORS: Record<PaymentMethod, { bg: string; color: string }> = {
  Cash:            { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  Card:            { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
  MoMo:            { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  'Bank Transfer': { bg: 'hsl(var(--muted))',      color: 'hsl(var(--foreground))' },
};

function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const s = PAYMENT_METHOD_COLORS[method];
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {method}
    </span>
  );
}

const PAGE_SIZE = 10;

function fmt(n: number) {
  return `¢${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

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

interface DraftLineItem { description: string; quantity: string; unit_price: string }

export function IssueInvoiceModal({ onSave, onClose }: {
  onSave: (
    input: Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>,
    items?: { description: string; quantity: number; unit_price: number; total_price: number }[]
  ) => Promise<unknown>;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { taxEnabled, vatRate, nhilGetfundRate } = useTaxSettings();
  const { settings } = useWirelessSettings();
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<WCustomer | null>(null);
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([{ description: '', quantity: '1', unit_price: '' }]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const customerId = selectedCustomer?.id ?? '';

  const updateRow = (i: number, field: keyof DraftLineItem, value: string) => {
    setLineItems(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };
  const addRow = () => setLineItems(prev => [...prev, { description: '', quantity: '1', unit_price: '' }]);
  const removeRow = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i));

  const parsedItems = lineItems
    .map(row => ({
      description: row.description.trim(),
      quantity: parseFloat(row.quantity) || 0,
      unit_price: parseFloat(row.unit_price) || 0,
    }))
    .filter(row => row.description && row.quantity > 0 && row.unit_price >= 0)
    .map(row => ({ ...row, total_price: row.quantity * row.unit_price }));

  const subtotal = parsedItems.reduce((s, i) => s + i.total_price, 0);
  const vat = taxEnabled ? Math.round(subtotal * (vatRate / 100) * 100) / 100 : 0;
  const levy = taxEnabled ? Math.round(subtotal * (nhilGetfundRate / 100) * 100) / 100 : 0;
  const tax = vat + levy;
  const total = subtotal + tax;
  const canSubmit = !!customerId && parsedItems.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSave({
        customer_id: customerId,
        subtotal,
        tax,
        discount: 0,
        total,
        amount_paid: 0,
        status: 'unpaid',
        due_date: dueDate || undefined,
        notes: notes || undefined,
        created_by: user?.id,
        // Every repair carries the shop's standard warranty — not a per-
        // invoice toggle, so this is unconditional rather than something
        // staff can opt out of.
        warranty: true,
        warranty_days: settings?.warranty_days,
      }, parsedItems);
      onClose();
    } catch { /* error toast already shown by useInvoices */ }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Invoice</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 max-h-[75vh] overflow-y-auto">
          {/* Customer search — same picker used on tickets: search existing,
              or type a name + phone to create a brand-new customer inline
              rather than needing a ticket created first just to register them. */}
          <CustomerPicker
            value={customerSearch}
            phone={customerPhone}
            onChange={(name, phone, customer) => {
              setCustomerSearch(name);
              setCustomerPhone(phone);
              setSelectedCustomer(customer ?? null);
            }}
            required
            label="Customer"
          />

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Line Items *
            </label>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
              <div className="grid grid-cols-[1fr_56px_84px_84px_28px] gap-1.5 px-2 py-1.5"
                style={{ background: 'hsl(var(--muted))' }}>
                <span className="text-[10px] font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Description</span>
                <span className="text-[10px] font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Qty</span>
                <span className="text-[10px] font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Unit Price</span>
                <span className="text-[10px] font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Total</span>
                <span />
              </div>
              <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                {lineItems.map((row, i) => {
                  const rowTotal = (parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0);
                  return (
                    <div key={i} className="grid grid-cols-[1fr_56px_84px_84px_28px] gap-1.5 px-2 py-1.5 items-center">
                      <input type="text" value={row.description} onChange={e => updateRow(i, 'description', e.target.value)}
                        placeholder="Screen replacement" className="h-8 px-2 rounded-md text-xs outline-none" style={inputStyle} />
                      <input type="number" min="0" step="1" value={row.quantity} onChange={e => updateRow(i, 'quantity', e.target.value)}
                        className="h-8 px-2 rounded-md text-xs outline-none" style={inputStyle} />
                      <input type="number" min="0" step="0.01" value={row.unit_price} onChange={e => updateRow(i, 'unit_price', e.target.value)}
                        placeholder="0.00" className="h-8 px-2 rounded-md text-xs outline-none" style={inputStyle} />
                      <span className="text-xs font-semibold text-right pr-1" style={{ color: 'hsl(var(--foreground))' }}>{fmt(rowTotal)}</span>
                      <button type="button" onClick={() => removeRow(i)} disabled={lineItems.length === 1}
                        className="w-7 h-7 flex items-center justify-center rounded-md disabled:opacity-30"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <button type="button" onClick={addRow}
                className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                <Plus className="w-3.5 h-3.5" /> Add item
              </button>
              <div className="text-right">
                <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal: {fmt(subtotal)}</div>
                {taxEnabled && (
                  <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Tax (VAT {vatRate}% + Levy {nhilGetfundRate}%): {fmt(tax)}
                  </div>
                )}
                <div className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Total: {fmt(total)}</div>
              </div>
            </div>
          </div>

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
            <button type="submit" disabled={saving || !canSubmit}
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
  onSave: (data: Partial<Pick<Invoice, 'due_date' | 'notes'>>) => Promise<void>;
  onClose: () => void;
}) {
  const [dueDate, setDueDate]   = useState(inv.due_date ?? '');
  const [notes, setNotes]       = useState(inv.notes ?? '');
  const [saving, setSaving]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ due_date: dueDate || undefined, notes: notes || undefined });
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
          {/* Status and amount paid are consequences of recorded payments,
              not something to hand-set here — editing them directly would
              bypass the payments ledger and desync from what the Payments
              page and the customer's lifetime spend show. Use Record
              Payment (or Mark Paid) instead; this modal only edits metadata. */}
          <div className="rounded-lg px-3 py-2.5 flex items-center justify-between" style={{ background: 'hsl(var(--muted))' }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</p>
              <p className="text-sm font-semibold capitalize" style={{ color: 'hsl(var(--foreground))' }}>{inv.status}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Paid</p>
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>GH₵ {inv.amount_paid.toFixed(2)}</p>
            </div>
          </div>
          <p className="text-[10px] -mt-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Use Record Payment to change these, keeps the Payments ledger accurate.
          </p>

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

function InvoiceDetail({ inv, canEdit, canDelete, onBack, onMarkPaid, onEdit, onDelete }: {
  inv: Invoice;
  canEdit: boolean;
  canDelete: boolean;
  onBack: () => void;
  onMarkPaid: (id: string, method: PaymentMethod) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}) {
  const { settings } = useWirelessSettings();
  const taxEnabled = settings?.tax_enabled ?? true;
  const vatRate = settings?.vat_rate ?? 15;
  const levyRate = settings?.nhil_getfund_rate ?? 5;
  const [pickingMethod, setPickingMethod] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [trackerToken, setTrackerToken] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const balanceDue = Math.max(0, inv.total - inv.amount_paid);
  const isPaid = inv.status === 'paid';

  useEffect(() => {
    let cancelled = false;
    setItemsLoading(true);
    getInvoiceItems(inv.id)
      .then(data => { if (!cancelled) setItems(data); })
      .finally(() => { if (!cancelled) setItemsLoading(false); });
    return () => { cancelled = true; };
  }, [inv.id]);

  useEffect(() => {
    let cancelled = false;
    getPaymentsForInvoice(inv.id).then(data => { if (!cancelled) setPayments(data); });
    return () => { cancelled = true; };
  }, [inv.id, inv.amount_paid]);

  // Only known so the tracker QR can authenticate the scan on its own —
  // the invoice itself only carries the ticket's uuid, not its public_token.
  useEffect(() => {
    let cancelled = false;
    if (!inv.ticket_id) { setTrackerToken(null); return; }
    getTicketPublicTokenById(inv.ticket_id).then(t => { if (!cancelled) setTrackerToken(t); });
    return () => { cancelled = true; };
  }, [inv.ticket_id]);

  const handleEmailInvoice = async () => {
    if (!inv.customer?.email) return;
    setEmailStatus('sending');
    setEmailError('');
    try {
      const pdfBase64 = await invoicePdfBase64({ invoice: inv, items, taxEnabled, vatRate, levyRate, settings: settings ?? undefined, trackerToken });
      await sendInvoiceEmail({
        to: inv.customer.email,
        invoiceNumber: inv.invoice_number,
        customerName: inv.customer.name,
        pdfBase64,
      });
      setEmailStatus('sent');
      setTimeout(() => setEmailStatus('idle'), 3000);
    } catch (e) {
      setEmailError(errMessage(e, 'Failed to send email'));
      setEmailStatus('error');
    }
  };
  const subtotal = items.length ? items.reduce((s, i) => s + i.total_price, 0) : inv.subtotal;
  const vat      = taxEnabled ? Math.round(subtotal * (vatRate / 100) * 100) / 100 : 0;
  const levy     = taxEnabled ? Math.round(subtotal * (levyRate / 100) * 100) / 100 : 0;

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
        <div className="flex items-center gap-2 relative">
          {canEdit && inv.status !== 'paid' && !pickingMethod && (
            <button onClick={() => setPickingMethod(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white"
              style={{ background: 'hsl(142 60% 40%)' }}>
              <Check className="w-3.5 h-3.5" />
              Mark Paid
            </button>
          )}
          {canEdit && inv.status !== 'paid' && pickingMethod && (
            <div className="absolute top-full mt-1 right-0 z-10 flex flex-col gap-1 p-1.5 rounded-xl"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <p className="px-1.5 pt-0.5 pb-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'hsl(var(--muted-foreground))' }}>Paid via…</p>
              {PAYMENT_METHODS.map(method => (
                <button key={method}
                  onClick={() => { onMarkPaid(inv.id, method); setPickingMethod(false); }}
                  className="flex items-center justify-between gap-3 px-2.5 h-8 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                  style={{ color: 'hsl(var(--foreground))' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                  {method}
                </button>
              ))}
            </div>
          )}
          {canEdit && (
            <button onClick={onEdit}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(354 60% 94%)', color: 'hsl(354 60% 30%)', border: '1px solid hsl(354 60% 80%)' }}>
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          <button onClick={() => printInvoicePdf({ invoice: inv, items, taxEnabled, vatRate, levyRate, settings: settings ?? undefined, trackerToken })}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={() => downloadInvoicePdf({ invoice: inv, items, taxEnabled, vatRate, levyRate, settings: settings ?? undefined, trackerToken })}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          <button
            onClick={handleEmailInvoice}
            disabled={!inv.customer?.email || emailStatus === 'sending'}
            title={!inv.customer?.email ? 'This customer has no email on file' : undefined}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            {emailStatus === 'sending' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            {emailStatus === 'sent' ? 'Sent!' : emailStatus === 'error' ? 'Retry Email' : 'Email Invoice'}
          </button>
          <button
            onClick={async () => {
              const text = `Invoice ${inv.invoice_number} · Total: ${fmt(inv.total)}`;
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
          {canDelete && (
            <button
              onClick={() => { if (confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`)) onDelete(inv.id); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors"
              style={{ border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      {emailStatus === 'error' && (
        <p className="text-xs text-right" style={{ color: '#ef4444' }}>{emailError}</p>
      )}

      {/* Invoice card — fixed paper colors so it looks the same on-screen, printed, and emailed regardless of app theme */}
      <div className="relative mx-auto max-w-2xl rounded-2xl overflow-hidden print:shadow-none isolate"
        style={{ background: '#fff', border: '1px solid hsl(var(--border))' }}>

        <img src="/wireless-logo-light.png" alt="" aria-hidden="true"
          className="absolute top-1/2 left-1/2 pointer-events-none select-none"
          style={{ width: 'min(70%, 420px)', transform: 'translate(-50%, -50%) rotate(-25deg)', opacity: 0.05, filter: 'grayscale(1)', zIndex: 0 }} />

        <div className="relative p-8" style={{ zIndex: 1 }}>

          {/* Top: logo + title */}
          <div className="flex items-start justify-between gap-6 mb-6 flex-wrap">
            <div className="flex items-start gap-3">
              <img src="/wireless-logo.png" alt="" className="w-9 h-9 object-contain mt-0.5" />
              <div>
                <div className="text-xs mt-0.5" style={{ color: '#888' }}>{settings?.tagline || 'Repair & Service System'}</div>
                {settings?.address && <div className="text-[11px] mt-1.5" style={{ color: '#999' }}>{settings.address}</div>}
                {settings?.phone && <div className="text-[11px]" style={{ color: '#999' }}>{settings.phone}</div>}
              </div>
            </div>
            <div className="text-right">
              {isPaid && (
                <div className="inline-block mb-2 px-3 py-1 rounded-md text-sm font-black"
                  style={{ border: '3px solid #22c55e', color: '#22c55e', letterSpacing: '0.12em', transform: 'rotate(-8deg)' }}>
                  PAID
                </div>
              )}
              <div className="text-3xl font-extrabold" style={{ color: '#1e1e1e', letterSpacing: '0.04em' }}>
                {isPaid ? 'RECEIPT' : 'INVOICE'}
              </div>
              <div className="text-xs mt-1.5" style={{ color: '#888' }}># {inv.invoice_number}</div>
              {inv.payment_method && (
                <div className="mt-2 flex justify-end"><PaymentMethodBadge method={inv.payment_method} /></div>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0' }} />

          {/* Middle: bill to + meta table */}
          <div className="flex gap-6 my-6 items-start flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#888' }}>Bill To</div>
              {inv.customer ? (
                <>
                  <div className="text-sm font-bold" style={{ color: '#1e1e1e' }}>{inv.customer.name}</div>
                  {inv.customer.phone && <div className="text-xs mt-0.5" style={{ color: '#666' }}>{inv.customer.phone}</div>}
                  {inv.customer.email && <div className="text-xs" style={{ color: '#666' }}>{inv.customer.email}</div>}
                  {inv.customer.address && <div className="text-xs" style={{ color: '#666' }}>{inv.customer.address}</div>}
                </>
              ) : (
                <div className="text-sm" style={{ color: '#888' }}>—</div>
              )}
            </div>

            <div className="w-full sm:w-[260px] rounded-md overflow-hidden flex-shrink-0" style={{ border: '1px solid #d8d8d8' }}>
              <div className="flex items-center justify-between px-3 py-2 text-xs" style={{ borderBottom: '1px solid #e8e8e8' }}>
                <span style={{ color: '#888' }}>Date</span>
                <span style={{ color: '#1e1e1e', fontWeight: 500 }}>{fmtDate(inv.created_at)}</span>
              </div>
              {inv.due_date && (
                <div className="flex items-center justify-between px-3 py-2 text-xs" style={{ borderBottom: '1px solid #e8e8e8' }}>
                  <span style={{ color: '#888' }}>Due Date</span>
                  <span style={{ color: '#1e1e1e', fontWeight: 500 }}>{fmtDate(inv.due_date)}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-3 py-2.5" style={{ background: '#ebf2fa' }}>
                <span className="text-xs font-bold" style={{ color: '#1e1e1e' }}>Balance Due</span>
                <span className="text-sm font-extrabold" style={{ color: '#1e1e1e' }}>{fmt(balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="rounded-md overflow-hidden mb-2" style={{ border: '1px solid #e0e0e0' }}>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#2b2b2b' }}>
                  {['Description', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                    <th key={h} className={`px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white ${i === 0 ? 'text-left' : 'text-right'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itemsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-3.5 py-6 text-center text-xs" style={{ color: '#999' }}>Loading…</td>
                  </tr>
                ) : items.length ? items.map((item, i) => (
                  <tr key={item.id} style={{ background: i % 2 ? '#fafafa' : '#fff', borderBottom: i < items.length - 1 ? '1px solid #ebebeb' : 'none' }}>
                    <td className="px-3.5 py-3 text-sm" style={{ color: '#1e1e1e' }}>{item.description}</td>
                    <td className="px-3.5 py-3 text-sm text-right" style={{ color: '#666' }}>{item.quantity}</td>
                    <td className="px-3.5 py-3 text-sm text-right" style={{ color: '#666' }}>{fmt(item.unit_price)}</td>
                    <td className="px-3.5 py-3 text-sm font-bold text-right" style={{ color: '#1e1e1e' }}>{fmt(item.total_price)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-3.5 py-6 text-center text-xs" style={{ color: '#999' }}>No line items</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Totals */}
          <div className="ml-auto max-w-xs space-y-1.5 mb-6">
            {[
              { label: 'Subtotal', value: subtotal },
              ...(taxEnabled ? [
                { label: `VAT (${vatRate}%)`, value: vat },
                { label: `NHIL + GETFund (${levyRate}%)`, value: levy },
              ] : []),
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between gap-8">
                <span className="text-xs" style={{ color: '#888' }}>{row.label}</span>
                <span className="text-xs" style={{ color: '#1e1e1e' }}>{fmt(row.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-8 pt-2" style={{ borderTop: '1px solid #ccc' }}>
              <span className="text-sm font-extrabold" style={{ color: '#1e1e1e' }}>Total</span>
              <span className="text-base font-extrabold" style={{ color: '#1e1e1e' }}>{fmt(inv.total)}</span>
            </div>
            {inv.amount_paid > 0 && (
              <>
                <div className="flex items-center justify-between gap-8">
                  <span className="text-xs" style={{ color: '#888' }}>Amount Paid</span>
                  <span className="text-xs" style={{ color: '#1e1e1e' }}>{fmt(inv.amount_paid)}</span>
                </div>
                <div className="flex items-center justify-between gap-8 pt-2" style={{ borderTop: '1px solid #ccc' }}>
                  <span className="text-sm font-extrabold" style={{ color: '#1e1e1e' }}>Balance Due</span>
                  <span className="text-base font-extrabold" style={{ color: '#1e1e1e' }}>{fmt(balanceDue)}</span>
                </div>
              </>
            )}
          </div>

          {inv.notes && (
            <div className="mb-4">
              <div className="text-xs mb-1" style={{ color: '#888' }}>Notes:</div>
              <div className="text-[13px] leading-relaxed" style={{ color: '#444' }}>{inv.notes}</div>
            </div>
          )}

          <div className="text-center text-xs pt-6" style={{ borderTop: '1px solid #e0e0e0', color: '#999' }}>
            {inv.warranty && inv.warranty_days ? (
              <>
                Thank you for choosing {settings?.business_name || 'WIRELESS'}. This repair is covered by a {inv.warranty_days}-day
                warranty from the date of completion, covering the specific repair performed only, it does not cover physical
                damage, water damage, or unrelated issues.
              </>
            ) : (
              <>Thank you for choosing {settings?.business_name || 'WIRELESS'}.</>
            )}
            <div className="mt-2">
              <a href={SERVICE_TERMS_URL} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#999' }}>
                Terms and Conditions
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Payment history — a partial payment paid in installments gets its
          own receipt per installment here, not just the one invoice PDF. */}
      {payments.length > 0 && (
        <div className="mx-auto max-w-2xl rounded-2xl overflow-hidden print:hidden"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Payment History</h3>
          </div>
          <div>
            {payments.reduce<{ rows: JSX.Element[]; runningTotal: number }>((acc, p, i) => {
              const runningTotal = acc.runningTotal + p.amount;
              acc.rows.push(
                <div key={p.id} className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: i < payments.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{fmt(p.amount)} · {p.method}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {fmtDate(p.created_at)}{p.reference ? ` · ${p.reference}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadPaymentReceiptPdf({
                      payment: p,
                      settings: settings ?? undefined,
                      invoiceContext: { total: inv.total, paidAfterThisPayment: runningTotal },
                    })}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold flex-shrink-0"
                    style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                    <Receipt className="w-3.5 h-3.5" />
                    Receipt
                  </button>
                </div>
              );
              return { rows: acc.rows, runningTotal };
            }, { rows: [], runningTotal: 0 }).rows}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invoice List View ──────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { setPageTitle } = usePageTitle();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showIssue, setShowIssue] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<InvoiceTotals>({ total: 0, collected: 0, outstanding: 0, overdue: 0 });

  const perms = user?.permissions ?? [];
  const canIssue  = user?.role === 'admin' || perms.includes('invoices:create');
  const canEdit   = user?.role === 'admin' || perms.includes('invoices:edit');
  const canDelete = user?.role === 'admin' || perms.includes('invoices:delete');

  useEffect(() => { setPage(1); }, [debouncedQuery, dateRange]);

  const reloadList = () => {
    setLoading(true);
    return getInvoicesPage({ page, pageSize: PAGE_SIZE, search: debouncedQuery, dateFrom: dateRange.from || undefined, dateTo: dateRange.to || undefined })
      .then(({ invoices: rows, total: count }) => { setInvoices(rows); setTotal(count); })
      .finally(() => setLoading(false));
  };

  const reloadTotals = () => getInvoiceTotals().then(setTotals).catch(() => {});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reloadList(); }, [page, debouncedQuery, dateRange]);
  useEffect(() => { reloadTotals(); }, []);

  const add = async (...args: Parameters<typeof createInvoice>) => {
    try {
      const inv = await createInvoice(...args);
      showToast('Invoice created');
      await Promise.all([reloadList(), reloadTotals()]);
      return inv;
    } catch (e) {
      showToast(`Failed to create invoice: ${errMessage(e)}`, 'error');
      throw e;
    }
  };

  const patch = async (id: string, data: Parameters<typeof patchInvoice>[1]) => {
    try {
      await patchInvoice(id, data);
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
      showToast('Invoice updated');
      await reloadTotals();
    } catch (e) {
      showToast(`Failed to update invoice: ${errMessage(e)}`, 'error');
      throw e;
    }
  };

  const markPaid = async (id: string, amount: number, method: PaymentMethod, customerName?: string) => {
    try {
      await recordPayment({ amount, method, invoiceId: id, customerName });
      setInvoices(prev => prev.map(i => {
        if (i.id !== id) return i;
        const amount_paid = i.amount_paid + amount;
        return { ...i, amount_paid, status: amount_paid >= i.total ? 'paid' : 'partial', payment_method: method };
      }));
      showToast('Invoice marked paid');
      await reloadTotals();
    } catch (e) {
      showToast(`Failed to mark invoice paid: ${errMessage(e)}`, 'error');
      throw e;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteInvoice(id);
      setSelectedId(null);
      showToast('Invoice deleted');
      await Promise.all([reloadList(), reloadTotals()]);
    } catch (e) {
      showToast(`Failed to delete invoice: ${errMessage(e)}`, 'error');
    }
  };

  const selected = selectedId ? invoices.find(i => i.id === selectedId) ?? null : null;

  const handleMarkPaid = (id: string, method: PaymentMethod) => {
    const inv = invoices.find(i => i.id === id);
    if (inv) markPaid(id, inv.total - inv.amount_paid, method, inv.customer?.name);
  };

  useEffect(() => {
    if (selected) {
      setPageTitle({ title: selected.invoice_number, subtitle: 'Invoice Details', hideDefaultAction: true });
    } else {
      setPageTitle({
        title: 'Invoices',
        subtitle: `${total} invoice${total !== 1 ? 's' : ''}`,
        hideDefaultAction: true,
        ...(canIssue ? { action: { label: 'New Invoice', onClick: () => setShowIssue(true) } } : {}),
      });
    }
    return () => setPageTitle({ title: 'Dashboard' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPageTitle, selected?.id, selected?.status, total, canIssue]);

  const paged = invoices;

  if (selected) {
    return (
      <>
        <InvoiceDetail
          inv={selected}
          canEdit={canEdit}
          canDelete={canDelete}
          onBack={() => setSelectedId(null)}
          onMarkPaid={handleMarkPaid}
          onEdit={() => setEditingInvoice(selected)}
          onDelete={remove}
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

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Invoices</div>
          <div className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{total}</div>
        </div>
        <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Revenue Collected</div>
          <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{fmt(totals.collected)}</div>
        </div>
        <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Outstanding</div>
          <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{fmt(totals.outstanding)}</div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <SearchDropdown
            query={query}
            onQueryChange={setQuery}
            suggestions={query.trim() ? invoices.map(inv => {
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
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
        ) : (
          <div className="overflow-x-auto">
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
          </div>
        )}
      </div>

      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {showIssue && (
        <IssueInvoiceModal onSave={add} onClose={() => setShowIssue(false)} />
      )}
    </div>
  );
}
