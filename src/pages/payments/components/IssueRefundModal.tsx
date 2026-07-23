import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { issueRefund } from '@/services/wireless/refunds';
import type { Transaction } from '@/types/payment';

export default function IssueRefundModal({ txn, onClose, onIssued }: {
  txn: Transaction;
  onClose: () => void;
  onIssued: () => void;
}) {
  const [amount, setAmount] = useState(String(txn.amountValue));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    setError('');
    try {
      await issueRefund({
        sourceType: txn.sourceType,
        sourceId: txn.id,
        amount: amt,
        customerName: txn.customer,
        reference: txn.reference,
        reason: reason.trim() || undefined,
      });
      onIssued();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log refund');
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
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Issue Refund</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{txn.customer} · {txn.reference}</p>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Refund Amount (GH₵)
            </label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Reason
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="e.g. Customer returned item"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} />
          </div>

          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

          <p className="text-[11px] leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
            This logs the refund for your records. It does not automatically reverse the invoice, stock, or ledger balance.
          </p>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-9 rounded-lg text-xs font-bold text-white disabled:opacity-50"
              style={{ background: '#DC2626' }}>
              {saving ? 'Logging…' : 'Log Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
