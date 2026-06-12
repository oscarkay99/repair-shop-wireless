import { useState } from 'react';
import type { PurchaseOrder, POItem } from '@/services/purchaseOrders';

interface Supplier { id: string; name: string }

interface Props {
  suppliers: Supplier[];
  onSave: (po: Omit<PurchaseOrder, 'id'>) => Promise<void>;
  onClose: () => void;
}

const EMPTY_ITEM = (): POItem => ({ name: '', qty: 1, unitCost: 0, total: 0 });

export default function NewPOModal({ suppliers, onSave, onClose }: Props) {
  const [supplier, setSupplier] = useState(suppliers[0]?.name ?? '');
  const [expectedDate, setExpectedDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Prepaid');
  const [items, setItems] = useState<POItem[]>([EMPTY_ITEM(), EMPTY_ITEM(), EMPTY_ITEM()]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const updateItem = (index: number, field: keyof POItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      updated.total = updated.qty * updated.unitCost;
      return updated;
    }));
  };

  const totalValue = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async () => {
    const validItems = items.filter(item => item.name.trim() && item.qty > 0);
    if (!supplier || !expectedDate || validItems.length === 0) return;
    setSaving(true);
    try {
      await onSave({
        supplier,
        items: validItems,
        totalValue: validItems.reduce((sum, item) => sum + item.total, 0),
        status: 'pending',
        orderedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        expectedDate: new Date(expectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        deliveredDate: null,
        paymentTerms,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">New Purchase Order</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-slate-400" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Supplier</label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Expected Delivery</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {['Prepaid', 'Net 7', 'Net 14', 'Net 30'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Items</label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(i, 'name', e.target.value)}
                    placeholder="Product name"
                    className="col-span-1 px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                  <input
                    type="number"
                    value={item.qty || ''}
                    onChange={(e) => updateItem(i, 'qty', parseInt(e.target.value) || 0)}
                    placeholder="Qty"
                    min="0"
                    className="px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                  <input
                    type="number"
                    value={item.unitCost || ''}
                    onChange={(e) => updateItem(i, 'unitCost', parseFloat(e.target.value) || 0)}
                    placeholder="Unit cost (GHS)"
                    min="0"
                    className="px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              ))}
            </div>
            {totalValue > 0 && (
              <p className="text-xs text-slate-500 mt-2 text-right">
                Total: <span className="font-semibold text-slate-800">GHS {totalValue.toLocaleString()}</span>
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || !supplier || !expectedDate}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap disabled:opacity-50"
            style={{ background: '#DC1F1F' }}
          >
            {saving ? 'Submitting…' : 'Submit Purchase Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
