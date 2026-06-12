import { useEffect, useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { useInventory } from '@/hooks/useInventory';
import ProductDetail from './components/ProductDetail';
import AddProductModal from './components/AddProductModal';
import { useSearchParams } from 'react-router-dom';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';

const conditionConfig: Record<string, { label: string; color: string; dot: string }> = {
  'New': { label: 'New', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'Used - Excellent': { label: 'Used — Excellent', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  'Used - Good': { label: 'Used — Good', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  'Refurbished': { label: 'Refurbished', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

export default function InventoryPage() {
  const { products, add, update } = useInventory();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState<typeof products[0] | null>(null);

  useEffect(() => {
    const incomingSearch = searchParams.get('search') || '';
    const incomingSelected = searchParams.get('selected');
    if (incomingSearch) setSearch(incomingSearch);
    if (incomingSelected) setSelected(incomingSelected);
  }, [searchParams]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.color?.toLowerCase().includes(q) ||
      p.imei?.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || p.condition === filter || (filter === 'low' && p.stock <= 2) || (filter === 'out' && p.stock === 0);
    return matchSearch && matchFilter;
  });
  const { paginated, page, setPage, totalPages, total, from, to } = usePagination(filtered, 20, `${search}|${filter}`);

  const product = selected ? products.find((p) => p.id === selected) : null;

  const handleEditProduct = (item: typeof products[number]) => {
    setEditingProduct(item);
    setSelected(null);
  };

  const handleRestockProduct = async (item: typeof products[number]) => {
    const now = new Date();
    const lastRestocked = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    await update(item.id, {
      ...item,
      stock: item.stock + 1,
      lastRestocked,
    });
  };

  const totalValue = products.reduce((sum, p) => {
    const n = parseFloat(p.price.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(n) ? 0 : n * p.stock);
  }, 0);

  const computedStats = [
    { label: 'Total Parts', value: String(products.length), icon: 'ri-archive-line', accent: 'bg-[#DC1F1F]' },
    { label: 'Low Stock Items', value: String(products.filter(p => p.stock > 0 && p.stock <= 2).length), icon: 'ri-alert-line', accent: 'bg-amber-500' },
    { label: 'Out of Stock', value: String(products.filter(p => p.stock === 0).length), icon: 'ri-close-circle-line', accent: 'bg-red-500' },
    { label: 'Total Value', value: totalValue > 0 ? `GHS ${totalValue.toLocaleString()}` : 'GHS 0', icon: 'ri-money-dollar-circle-line', accent: 'bg-emerald-500' },
  ];

  return (
    <AdminLayout title="Parts & Components" subtitle="Spare parts, consumables and repair materials">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {computedStats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.accent} rounded-l-2xl`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <i className={`${s.icon} text-lg`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-sm">
          <div className="w-4 h-4 flex items-center justify-center text-slate-400">
            <i className="ri-search-line text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search parts..."
            value={search}
            onChange={(e) => {
              const next = e.target.value;
              setSearch(next);
              const nextParams = new URLSearchParams(searchParams);
              if (next) {
                nextParams.set('search', next);
              } else {
                nextParams.delete('search');
              }
              nextParams.delete('selected');
              setSearchParams(nextParams, { replace: true });
            }}
            className="bg-transparent text-sm text-slate-600 outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'New', 'Used - Excellent', 'Refurbished', 'low', 'out'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap capitalize ${
                filter === f ? 'bg-[#DC1F1F] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : f === 'out' ? 'Out of Stock' : f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
          style={{ background: '#DC1F1F' }}
        >
          <i className="ri-add-line text-sm" />
          Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Product', 'Condition', 'Price', 'Stock', 'Location', 'Supplier', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-400">
                    <i className="ri-archive-line text-3xl block mb-2 text-slate-200" />
                    No parts in stock. Add spare parts to get started.
                  </td>
                </tr>
              )}
              {paginated.map((p, i) => {
                const cond = conditionConfig[p.condition] || conditionConfig['New'];
                return (
                  <tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/20'}`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {p.id} · {p.category}{p.color ? ` · ${p.color}` : ''}{p.imei ? ` · ${p.imei}` : ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${cond.dot}`} />
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cond.color}`}>{cond.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{p.price}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                          <div
                            className={`h-full rounded-full ${p.stock === 0 ? 'bg-red-400' : p.stock <= 2 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((p.stock / 10) * 100, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${p.stock === 0 ? 'text-red-500' : p.stock <= 2 ? 'text-amber-600' : 'text-slate-600'}`}>{p.stock}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.location}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.supplier}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(p.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-all">
                          <i className="ri-eye-line text-sm" />
                        </button>
                        <button onClick={() => handleEditProduct(p)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-all">
                          <i className="ri-edit-line text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} onPageChange={setPage} />
      </div>

      {product && (
        <ProductDetail
          product={product}
          onClose={() => setSelected(null)}
          onEdit={() => handleEditProduct(product)}
          onRestock={() => handleRestockProduct(product)}
        />
      )}
      {showAdd && <AddProductModal onSave={add} onClose={() => setShowAdd(false)} />}
      {editingProduct && (
        <AddProductModal
          editProduct={editingProduct}
          onSave={(data) => update(editingProduct.id, data)}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </AdminLayout>
  );
}
