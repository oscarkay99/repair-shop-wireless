import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useParts } from '@/hooks/useParts';
import { addTicketPart } from '@/services/wireless/ticketParts';
import { errMessage } from '@/utils/errors';

const inputCls = 'w-full h-9 px-3 rounded-lg text-sm outline-none';
const inputStyle = { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' };

export default function AddTicketPartModal({ ticketDbId, onClose, onAdded }: {
  ticketDbId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { parts, loading: partsLoading } = useParts();
  const [search, setSearch] = useState('');
  const [partId, setPartId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [parts, search]);

  const selected = parts.find(p => p.id === partId) ?? null;
  const qty = parseInt(quantity, 10) || 0;
  const canSubmit = !!selected && qty > 0;
  const exceedsStock = !!selected && qty > selected.stock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selected) return;
    setSaving(true);
    setError('');
    try {
      await addTicketPart({
        ticketDbId,
        partId: selected.id,
        partName: selected.name,
        quantity: qty,
        unitCost: selected.unit_cost,
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(errMessage(err, 'Failed to add part'));
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
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Part Used</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Part</label>
            <input
              type="text"
              value={selected ? selected.name : search}
              onChange={e => { setSearch(e.target.value); setPartId(''); }}
              placeholder="Search inventory parts…"
              className={inputCls}
              style={inputStyle}
            />
            {!selected && search.trim() && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg" style={{ border: '1px solid hsl(var(--border))' }}>
                {partsLoading ? (
                  <div className="px-3 py-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
                ) : filtered.length === 0 ? (
                  <div className="px-3 py-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No matching parts.</div>
                ) : filtered.slice(0, 8).map(p => (
                  <button key={p.id} type="button"
                    onClick={() => { setPartId(p.id); setSearch(''); }}
                    className="w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[hsl(var(--muted))]"
                    style={{ color: 'hsl(var(--foreground))' }}>
                    <span>{p.name} <span style={{ color: 'hsl(var(--muted-foreground))' }}>({p.sku})</span></span>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>{p.stock} in stock</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
              <p className="text-[11px] mt-1" style={{ color: exceedsStock ? '#ef4444' : 'hsl(var(--muted-foreground))' }}>
                {selected.stock} currently in stock{exceedsStock ? ' — this will take stock to 0' : ''}
              </p>
            </div>
          )}

          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="w-full h-10 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'hsl(var(--primary))' }}>
            {saving ? 'Adding…' : 'Add Part'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
