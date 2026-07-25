import { useState } from 'react';
import { usePriceList } from '@/hooks/usePriceList';
import type { PriceListEntry } from '@/types/wireless';

function EntryModal({ entry, onClose, onSave }: {
  entry: PriceListEntry | null;
  onClose: () => void;
  onSave: (data: { device_model: string; issue: string; price: number }) => Promise<unknown>;
}) {
  const [deviceModel, setDeviceModel] = useState(entry?.device_model ?? '');
  const [issue, setIssue] = useState(entry?.issue ?? '');
  const [price, setPrice] = useState(String(entry?.price ?? ''));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!deviceModel.trim() || !issue.trim()) { setError('Device model and issue are required'); return; }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) { setError('Enter a valid price'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ device_model: deviceModel.trim(), issue: issue.trim(), price: priceNum });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground mb-5">{entry ? 'Edit Price' : 'Add Price'}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Device Model</label>
            <input
              type="text"
              value={deviceModel}
              onChange={e => setDeviceModel(e.target.value)}
              placeholder="e.g. iPhone 16"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Issue</label>
            <input
              type="text"
              value={issue}
              onChange={e => setIssue(e.target.value)}
              placeholder="e.g. Screen Replacement"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Price (GHS)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-border text-sm text-muted-foreground rounded-lg hover:bg-background transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PriceListSection() {
  const { priceList, loading, add, patch, remove } = usePriceList();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<PriceListEntry | null>(null);

  const handleDelete = (entry: PriceListEntry) => {
    if (!confirm(`Remove the price for ${entry.device_model} — ${entry.issue}?`)) return;
    remove(entry.id);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground">Price List</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Device + issue combinations here auto-suggest a repair cost when creating a ticket
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Price
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
        ) : priceList.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">No prices set yet</div>
        ) : (
          <div className="space-y-2">
            {priceList.map(entry => (
              <div key={entry.id} className="flex items-center gap-4 p-3 rounded-xl bg-background/50 hover:bg-background transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{entry.device_model}</p>
                  <p className="text-xs text-muted-foreground truncate">{entry.issue}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">GHS {entry.price.toFixed(2)}</p>
                <button
                  onClick={() => setEditing(entry)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Edit price"
                >
                  <i className="ri-edit-line" />
                </button>
                <button
                  onClick={() => handleDelete(entry)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete price"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <EntryModal entry={null} onClose={() => setShowAdd(false)} onSave={data => add(data)} />}
      {editing && <EntryModal entry={editing} onClose={() => setEditing(null)} onSave={data => patch(editing.id, data)} />}
    </div>
  );
}
