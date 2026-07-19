import { useState } from 'react';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';
import AdminLayout from '@/components/feature/AdminLayout';
import PurchaseOrderDetail from './components/PurchaseOrderDetail';
import NewPOModal from './components/NewPOModal';
import AddSupplierModal from './components/AddSupplierModal';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { Supplier } from '@/hooks/useSuppliers';

const tabs = ['Purchase Orders', 'Suppliers'];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  delivered:  { label: 'Delivered',  color: '#25D366', bg: '#25D36615' },
  in_transit: { label: 'In Transit', color: '#DC1F1F', bg: 'rgba(220,31,31,0.08)' },
  pending:    { label: 'Pending',    color: '#F59E0B', bg: '#F59E0B15' },
  cancelled:  { label: 'Cancelled',  color: '#E05A2B', bg: '#E05A2B15' },
};

export default function SuppliersPage() {
  const { orders: purchaseOrders, add: addPO } = usePurchaseOrders();
  const { suppliers, add: addSupplier, update: updateSupplier, remove: removeSupplier } = useSuppliers();
  const [activeTab, setActiveTab] = useState('Purchase Orders');
  const [selectedPO, setSelectedPO] = useState<string | null>(null);
  const [showNewPO, setShowNewPO] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [confirmDeleteSupplierId, setConfirmDeleteSupplierId] = useState<string | null>(null);

  const selectedOrder = purchaseOrders.find(po => po.id === selectedPO);
  const { paginated: pagedPOs, page: poPage, setPage: setPoPage, totalPages: poTotalPages, total: poTotal, from: poFrom, to: poTo } = usePagination(purchaseOrders, 15);
  const { paginated: pagedSuppliers, page: supPage, setPage: setSupPage, totalPages: supTotalPages, total: supTotal, from: supFrom, to: supTo } = usePagination(suppliers, 9);

  const now = new Date();
  const thisMonth = now.toLocaleDateString('en-GH', { month: 'short', year: 'numeric' });
  const activeOrders = purchaseOrders.filter(po => po.status === 'pending' || po.status === 'in_transit').length;
  const pendingDeliveries = purchaseOrders.filter(po => po.status === 'in_transit').length;
  const monthSpend = purchaseOrders
    .filter(po => po.orderedDate?.includes(now.toLocaleDateString('en-GH', { month: 'short' })) && po.orderedDate?.includes(String(now.getFullYear())))
    .reduce((sum, po) => sum + po.totalValue, 0);

  const handleSaveSupplier = async (data: Omit<Supplier, 'id' | 'createdAt'>, id?: string) => {
    if (id) await updateSupplier(id, data);
    else await addSupplier(data);
  };

  return (
    <AdminLayout title="Purchase Orders" subtitle="Suppliers · Stock Orders · Delivery Tracking">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {[
          { label: 'Total Suppliers',    value: `${suppliers.length}`,                                                                                           icon: 'ri-store-2-line',            color: '#DC1F1F' },
          { label: 'Active Orders',      value: `${activeOrders}`,                                                                                                icon: 'ri-file-list-3-line',        color: '#F59E0B' },
          { label: `${thisMonth} Spend`, value: monthSpend >= 1000 ? `GHS ${(monthSpend / 1000).toFixed(1)}K` : `GHS ${Math.round(monthSpend).toLocaleString()}`, icon: 'ri-money-dollar-circle-line', color: '#E05A2B' },
          { label: 'In Transit',         value: `${pendingDeliveries}`,                                                                                           icon: 'ri-truck-line',              color: '#0F172A' },
          { label: 'Total Orders',       value: `${purchaseOrders.length}`,                                                                                       icon: 'ri-time-line',               color: '#06B6D4' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <i className={`${s.icon} text-sm`} style={{ color: s.color }} />
              </div>
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Action */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex border border-slate-200 rounded-xl p-1 bg-white">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
              style={activeTab === tab ? { background: '#DC1F1F' } : {}}>
              {tab}
            </button>
          ))}
        </div>
        {activeTab === 'Purchase Orders' ? (
          <button onClick={() => setShowNewPO(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
            style={{ background: '#DC1F1F' }}>
            <i className="ri-add-line mr-1" /> New Purchase Order
          </button>
        ) : (
          <button onClick={() => setShowAddSupplier(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
            style={{ background: '#DC1F1F' }}>
            <i className="ri-add-line mr-1" /> Add Supplier
          </button>
        )}
      </div>

      {/* Purchase Orders Tab */}
      {activeTab === 'Purchase Orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {purchaseOrders.length === 0 ? (
              <div className="py-16 text-center">
                <i className="ri-file-list-3-line text-3xl text-slate-200 block mb-2" />
                <p className="text-sm text-slate-400">No purchase orders yet.</p>
              </div>
            ) : (
              <>
              <div className="divide-y divide-slate-100">
                {pagedPOs.map(po => {
                  const st = statusConfig[po.status] ?? statusConfig.pending;
                  return (
                    <button key={po.id} onClick={() => setSelectedPO(selectedPO === po.id ? null : po.id)}
                      className={`w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50/50 transition-colors ${selectedPO === po.id ? 'bg-[rgba(220,31,31,0.04)]' : ''}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: st.bg }}>
                        <i className="ri-file-list-3-line text-sm" style={{ color: st.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-800">{po.id}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: st.color }}>{st.label}</span>
                        </div>
                        <p className="text-xs text-slate-500">{po.supplier} · {po.items.length} item{po.items.length !== 1 ? 's' : ''}</p>
                        <p className="text-[10px] text-slate-400">Ordered: {po.orderedDate} · Expected: {po.expectedDate}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-800 flex-shrink-0">GHS {po.totalValue.toLocaleString()}</p>
                    </button>
                  );
                })}
              </div>
              <Pagination page={poPage} pageCount={poTotalPages} total={poTotal} pageSize={15} onPageChange={setPoPage} />
              </>
            )}
          </div>
          <div>
            {selectedOrder ? (
              <PurchaseOrderDetail order={selectedOrder} />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <i className="ri-file-list-3-line text-3xl text-slate-200 mb-3 block" />
                <p className="text-xs text-slate-400">Select a purchase order to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'Suppliers' && (
        <>
          {suppliers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
              <i className="ri-store-2-line text-3xl text-slate-200 block mb-2" />
              <p className="text-sm text-slate-400 mb-4">No suppliers yet. Add your first one.</p>
              <button onClick={() => setShowAddSupplier(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{ background: '#DC1F1F' }}>
                <i className="ri-add-line mr-1" /> Add Supplier
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagedSuppliers.map(supplier => (
                <div key={supplier.id}
                  className={`bg-white rounded-2xl p-5 border transition-colors ${confirmDeleteSupplierId === supplier.id ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
                  {confirmDeleteSupplierId === supplier.id ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <i className="ri-delete-bin-line text-2xl text-red-400" />
                      <p className="text-sm font-semibold text-red-700">Remove {supplier.name}?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDeleteSupplierId(null)}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 cursor-pointer">
                          Cancel
                        </button>
                        <button onClick={() => { removeSupplier(supplier.id); setConfirmDeleteSupplierId(null); }}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 transition-colors text-white cursor-pointer">
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(220,31,31,0.08)' }}>
                          <i className="ri-store-2-line text-sm" style={{ color: '#DC1F1F' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{supplier.name}</p>
                          <p className="text-xs text-slate-400">{supplier.category}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setEditingSupplier(supplier)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                            <i className="ri-pencil-line text-sm" />
                          </button>
                          <button onClick={() => setConfirmDeleteSupplierId(supplier.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer transition-colors">
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <i key={i} className={i < supplier.rating ? 'ri-star-fill text-xs' : 'ri-star-line text-xs'}
                            style={{ color: i < supplier.rating ? '#F59E0B' : '#E2E8F0' }} />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="bg-slate-50 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-400">Contact</p>
                          <p className="font-semibold text-slate-700 truncate">{supplier.contact || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-400">Lead Time</p>
                          <p className="font-semibold text-slate-700">{supplier.leadTime || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-400">Orders</p>
                          <p className="font-semibold text-slate-700">{supplier.totalOrders}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-400">Payment</p>
                          <p className="font-semibold text-slate-700">{supplier.paymentTerms}</p>
                        </div>
                      </div>
                      {supplier.notes && (
                        <p className="text-[10px] text-slate-400 mb-3 line-clamp-2">{supplier.notes}</p>
                      )}
                      <button onClick={() => { setShowNewPO(true); setActiveTab('Purchase Orders'); }}
                        className="w-full py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                        style={{ background: '#DC1F1F' }}>
                        Create Purchase Order
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <Pagination page={supPage} pageCount={supTotalPages} total={supTotal} pageSize={9} onPageChange={setSupPage} />
        </>
      )}

      {showNewPO && (
        <NewPOModal
          suppliers={suppliers.map(s => ({ id: s.id, name: s.name }))}
          onSave={addPO}
          onClose={() => setShowNewPO(false)}
        />
      )}
      {(showAddSupplier || editingSupplier) && (
        <AddSupplierModal
          supplier={editingSupplier ?? undefined}
          onSave={handleSaveSupplier}
          onClose={() => { setShowAddSupplier(false); setEditingSupplier(null); }}
        />
      )}
    </AdminLayout>
  );
}
