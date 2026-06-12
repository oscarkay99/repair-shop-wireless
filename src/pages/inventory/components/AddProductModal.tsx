import { useState } from 'react';
import type { InventoryProduct } from '@/hooks/useInventory';

interface Props {
  onSave: (p: Omit<InventoryProduct, 'id'>) => unknown;
  onClose: () => void;
  editProduct?: InventoryProduct | null;
}

const categories = ['Phones', 'Laptops', 'Tablets', 'Accessories', 'Wearables'];
const conditions = ['New', 'Used - Excellent', 'Used - Good', 'Refurbished'];

export default function AddProductModal({ onSave, onClose, editProduct }: Props) {
  const isEditing = !!editProduct;

  const [form, setForm] = useState({
    name: editProduct?.name ?? '',
    category: editProduct?.category ?? 'Phones',
    color: editProduct?.color ?? '',
    condition: editProduct?.condition ?? 'New',
    price: editProduct?.price ?? '',
    costPrice: editProduct?.costPrice !== undefined ? String(editProduct.costPrice) : '',
    stock: editProduct?.stock ?? 1,
    imei: editProduct?.imei ?? '',
    location: editProduct?.location ?? '',
    supplier: editProduct?.supplier ?? '',
  });
  const [stockInput, setStockInput] = useState(String(editProduct?.stock ?? 1));

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    const costPriceNum = parseFloat(form.costPrice);
    onSave({ ...form, costPrice: isNaN(costPriceNum) ? undefined : costPriceNum });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,16,31,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 24px 80px rgba(7,16,31,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(7,16,31,0.07)' }}>
          <h3 className="text-[14px] font-bold" style={{ color: '#0F172A' }}>{isEditing ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ background: 'rgba(220,31,31,0.08)' }}>
            <i className="ri-close-line text-sm" style={{ color: 'rgba(7,16,31,0.5)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Product Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="iPhone 16 Pro Max 256GB" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none cursor-pointer"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Condition</label>
              <select value={form.condition} onChange={e => set('condition', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none cursor-pointer"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}>
                {conditions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Device Color</label>
            <input value={form.color} onChange={e => set('color', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="Natural Titanium, Black, Silver" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Cost Price (GHS)</label>
              <input type="number" min="0" step="0.01" value={form.costPrice} onChange={e => set('costPrice', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="What you paid" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Selling Price *</label>
              <input required value={form.price} onChange={e => set('price', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="GHS 8,200" />
            </div>
          </div>
          {form.costPrice && form.price && (() => {
            const cost = parseFloat(form.costPrice);
            const sell = parseFloat(form.price.replace(/[^0-9.]/g, ''));
            const margin = sell > 0 && !isNaN(cost) ? Math.round(((sell - cost) / sell) * 100) : null;
            return margin !== null ? (
              <p className="text-[10px] mt-0.5" style={{ color: margin >= 20 ? '#25D366' : margin >= 10 ? '#F59E0B' : '#E05A2B' }}>
                Margin: {margin}% · Profit per unit: GHS {Math.round(sell - cost).toLocaleString()}
              </p>
            ) : null;
          })()}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Stock Qty</label>
            <input
              type="number" min={0} value={stockInput}
              onChange={e => {
                setStockInput(e.target.value);
                const n = parseInt(e.target.value, 10);
                if (!isNaN(n) && n >= 0) set('stock', n);
              }}
              onBlur={() => {
                const n = parseInt(stockInput, 10);
                const valid = !isNaN(n) && n >= 0 ? n : 0;
                setStockInput(String(valid));
                set('stock', valid);
              }}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>IMEI / Serial Number</label>
            <input value={form.imei} onChange={e => set('imei', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="358123456789012 or C02XYZ123456" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="Shelf A2" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Supplier</label>
              <input value={form.supplier} onChange={e => set('supplier', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="Supplier name" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: 'rgba(220,31,31,0.08)', color: 'rgba(7,16,31,0.6)' }}>
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer"
              style={{ background: '#DC1F1F' }}>
              {isEditing ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
