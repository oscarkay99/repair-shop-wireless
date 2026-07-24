import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useRepairs } from '@/hooks/useRepairs';
import { recordPayment } from '@/services/wireless/payments';
import SearchDropdown, { type SearchItem } from '@/components/shared/SearchDropdown';
import type { PaymentMethod } from '@/types/sale';

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Card', 'MoMo', 'Bank Transfer'];

const METHOD_COLORS: Record<PaymentMethod, { bg: string; color: string }> = {
  Cash:            { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  Card:            { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
  MoMo:            { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  'Bank Transfer': { bg: 'hsl(var(--muted))',      color: 'hsl(var(--foreground))' },
};

type Target = 'invoice' | 'ticket' | 'standalone';

const inputCls = "w-full h-9 px-3 rounded-lg text-sm outline-none";
const inputStyle = { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' };

export default function RecordPaymentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { invoices } = useInvoices();
  const { repairs } = useRepairs();
  const [target, setTarget] = useState<Target>('invoice');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const invoiceSuggestions: SearchItem[] = query.trim()
    ? invoices
        .filter(i => i.invoice_number.toLowerCase().includes(query.toLowerCase()) || i.customer?.name.toLowerCase().includes(query.toLowerCase()))
        .map(i => ({ id: i.id, primary: i.invoice_number, secondary: i.customer?.name ?? '—', meta: `Balance: GHS ${(i.total - i.amount_paid).toFixed(2)}` }))
    : [];

  const ticketSuggestions: SearchItem[] = query.trim()
    ? repairs
        .filter(r => r.id.toLowerCase().includes(query.toLowerCase()) || r.customer.toLowerCase().includes(query.toLowerCase()))
        .map(r => ({ id: r.id, primary: r.id, secondary: r.customer, meta: r.device }))
    : [];

  const selectedInvoice = invoices.find(i => i.id === selectedId);
  const selectedTicket = repairs.find(r => r.id === selectedId);

  const canSubmit = amount.trim().length > 0 && parseFloat(amount) > 0 &&
    (target === 'standalone' ? customerName.trim().length > 0 : !!selectedId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError('');
    try {
      await recordPayment({
        amount: parseFloat(amount),
        method,
        invoiceId: target === 'invoice' ? selectedId : undefined,
        // Tickets are searched/selected by ticket_number (e.g. "TK-0002"), but the
        // payments table's ticket_id column is the ticket's real uuid — sending the
        // ticket_number there would fail (or silently mismatch) against a uuid column.
        ticketId: target === 'ticket' ? selectedTicket?.ticketDbId : undefined,
        customerName: target === 'invoice' ? selectedInvoice?.customer?.name : target === 'ticket' ? selectedTicket?.customer : customerName,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Record Payment</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target type */}
          <div className="flex rounded-lg p-0.5" style={{ background: 'hsl(var(--muted))' }}>
            {(['invoice', 'ticket', 'standalone'] as Target[]).map(t => (
              <button key={t} type="button"
                onClick={() => { setTarget(t); setSelectedId(''); setQuery(''); }}
                className="flex-1 h-8 rounded-md text-xs font-semibold capitalize transition-colors"
                style={target === t ? { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: 'hsl(var(--muted-foreground))' }}>
                {t === 'standalone' ? 'Other' : t}
              </button>
            ))}
          </div>

          {(target === 'invoice' || target === 'ticket') && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {target === 'invoice' ? 'Invoice' : 'Ticket'}
              </label>
              <SearchDropdown
                query={selectedId ? (target === 'invoice' ? selectedInvoice?.invoice_number ?? '' : selectedTicket?.id ?? '') : query}
                onQueryChange={q => { setQuery(q); setSelectedId(''); }}
                suggestions={target === 'invoice' ? invoiceSuggestions : ticketSuggestions}
                onSelect={item => { setSelectedId(item.id); setQuery(''); }}
                placeholder={target === 'invoice' ? 'Search invoice # or customer…' : 'Search ticket # or customer…'}
                width="100%"
              />
            </div>
          )}

          {target === 'standalone' && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer Name</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} className={inputCls} style={inputStyle} placeholder="Walk-in customer" />
            </div>
          )}

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Amount (GHS)</label>
            <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} style={inputStyle} placeholder="0.00" />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className="h-9 rounded-lg text-xs font-semibold transition-colors"
                  style={method === m
                    ? { background: METHOD_COLORS[m].bg, color: METHOD_COLORS[m].color, border: `1px solid ${METHOD_COLORS[m].color}55` }
                    : { color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Reference (optional)</label>
            <input value={reference} onChange={e => setReference(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. MoMo transaction ID" />
          </div>

          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              Cancel
            </button>
            <button type="submit" disabled={!canSubmit || saving}
              className="flex-1 h-9 rounded-lg text-xs font-bold text-white disabled:opacity-50"
              style={{ background: 'hsl(var(--primary))' }}>
              {saving ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
