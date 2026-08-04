import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { FixedAsset, AssetStatus } from '@/services/wireless/assets';

const ASSET_CATEGORIES = ['Equipment', 'Tools', 'Furniture & Fixtures', 'Electronics', 'Vehicles', 'Other'];

interface Props {
  asset?: FixedAsset;
  onSave: (data: Omit<FixedAsset, 'id' | 'created_at' | 'updated_at' | 'created_by'>, id?: string) => Promise<void>;
  onClose: () => void;
}

const inputCls = "w-full h-9 px-3 rounded-lg text-sm outline-none";
const inputStyle = {
  background: 'hsl(var(--muted))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--foreground))',
};

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

export default function AddAssetModal({ asset, onSave, onClose }: Props) {
  const isEdit = !!asset;
  const [name, setName]                 = useState(asset?.name ?? '');
  const [category, setCategory]         = useState(asset?.category ?? ASSET_CATEGORIES[0]);
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchase_date ?? new Date().toISOString().split('T')[0]);
  const [purchaseCost, setPurchaseCost] = useState(asset?.purchase_cost != null ? String(asset.purchase_cost) : '');
  const [currentValue, setCurrentValue] = useState(asset?.current_value != null ? String(asset.current_value) : '');
  const [status, setStatus]             = useState<AssetStatus>(asset?.status ?? 'active');
  const [location, setLocation]         = useState(asset?.location ?? '');
  const [notes, setNotes]               = useState(asset?.notes ?? '');
  const [saving, setSaving]             = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !purchaseCost) return;
    setSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          category,
          purchase_date: purchaseDate || null,
          purchase_cost: parseFloat(purchaseCost) || 0,
          current_value: currentValue ? parseFloat(currentValue) : parseFloat(purchaseCost) || 0,
          status,
          location: location.trim() || null,
          notes: notes.trim() || null,
        },
        asset?.id,
      );
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

        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {isEdit ? 'Edit Asset' : 'Add Fixed Asset'}
          </h3>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <Field label="Asset Name *">
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Screen Press Machine"
              className={inputCls} style={inputStyle} required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={category} onChange={e => setCategory(e.target.value)}
                className={inputCls} style={inputStyle}>
                {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={e => setStatus(e.target.value as AssetStatus)}
                className={inputCls} style={inputStyle}>
                <option value="active">Active</option>
                <option value="under_repair">Under Repair</option>
                <option value="disposed">Disposed</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase Cost (GH₵) *">
              <input type="number" min="0" step="0.01" value={purchaseCost}
                onChange={e => setPurchaseCost(e.target.value)}
                placeholder="0.00" className={inputCls} style={inputStyle} required />
            </Field>
            <Field label="Current Value (GH₵)">
              <input type="number" min="0" step="0.01" value={currentValue}
                onChange={e => setCurrentValue(e.target.value)}
                placeholder="Defaults to cost" className={inputCls} style={inputStyle} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase Date">
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Location">
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Main shop"
                className={inputCls} style={inputStyle} />
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Optional notes…"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle} />
          </Field>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Cancel
            </button>
            <button type="submit"
              disabled={saving || !name.trim() || !purchaseCost}
              className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'hsl(var(--primary))' }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
