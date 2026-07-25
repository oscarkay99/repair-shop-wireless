import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Repair } from '@/types/repair';
import { useAuth } from '@/hooks/useAuth';
import { useTaxSettings } from '@/hooks/useTaxSettings';
import { createInvoice } from '@/services/wireless/invoices';
import { errMessage } from '@/utils/errors';

function fmt(n: number) {
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const inputCls = 'w-full h-9 px-3 rounded-lg text-sm outline-none';
const inputStyle = { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' };

export default function CreateTicketInvoiceModal({ repair, depositPaid, onClose, onCreated }: {
  repair: Repair;
  depositPaid: number;
  onClose: () => void;
  onCreated: (invoiceNumber: string) => void;
}) {
  const { user } = useAuth();
  const { taxEnabled, vatRate, nhilGetfundRate } = useTaxSettings();
  const [description, setDescription] = useState(`${repair.device} — ${repair.issue}`);
  const [amount, setAmount] = useState(String(repair.costNum ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const subtotal = parseFloat(amount) || 0;
  const vat = taxEnabled ? Math.round(subtotal * (vatRate / 100) * 100) / 100 : 0;
  const levy = taxEnabled ? Math.round(subtotal * (nhilGetfundRate / 100) * 100) / 100 : 0;
  const total = subtotal + vat + levy;
  // Deposit applies in full — if it exceeds the total, balanceDue floors at 0
  // and the invoice is simply born "paid" rather than showing a negative due.
  const amountPaid = depositPaid;
  const balanceDue = Math.max(0, total - amountPaid);
  const canSubmit = !!repair.customerId && subtotal > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !repair.customerId) return;
    setSaving(true);
    setError('');
    try {
      const inv = await createInvoice({
        customer_id: repair.customerId,
        ticket_id: repair.ticketDbId,
        subtotal,
        tax: vat + levy,
        discount: 0,
        total,
        amount_paid: amountPaid,
        status: amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid',
        notes: `Ticket ${repair.id}`,
        created_by: user?.id,
      }, [
        { description, quantity: 1, unit_price: subtotal, total_price: subtotal },
      ]);
      onCreated(inv.invoice_number);
      onClose();
    } catch (err) {
      setError(errMessage(err, 'Failed to create invoice'));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Create Invoice</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer</label>
            <div className={inputCls + ' flex items-center'} style={inputStyle}>{repair.customer}</div>
            {!repair.customerId && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>This ticket has no linked customer record, so an invoice can't be created for it.</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Amount (GHS)</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} style={inputStyle} />
          </div>

          <div className="rounded-lg p-3 space-y-1.5" style={{ background: 'hsl(var(--muted))' }}>
            {taxEnabled && (
              <>
                <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span>VAT ({vatRate}%) + Levy ({nhilGetfundRate}%)</span>
                  <span>{fmt(vat + levy)}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
            {depositPaid > 0 && (
              <div className="flex items-center justify-between text-xs" style={{ color: '#22c55e' }}>
                <span>Deposit already paid</span>
                <span>-{fmt(amountPaid)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs font-bold pt-1.5" style={{ color: 'hsl(var(--foreground))', borderTop: '1px solid hsl(var(--border))' }}>
              <span>Balance Due</span>
              <span>{fmt(balanceDue)}</span>
            </div>
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
              {saving ? 'Creating…' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
