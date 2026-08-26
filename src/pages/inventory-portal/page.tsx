import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Plus, Search, AlertTriangle, Boxes, ShoppingBag,
  Minus, Pencil, Trash2, LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useWirelessSettings } from '@/hooks/useWirelessSettings';
import { useParts } from '@/hooks/useParts';
import { useAccessoryStore } from '@/hooks/useAccessoryStore';
import { roleColors, roleLabels } from '@/mocks/users';
import { AddPartModal } from '@/pages/inventory/page';
import AccessoriesTab from '@/pages/inventory/components/AccessoriesTab';
import Pagination from '@/components/shared/Pagination';
import BirthdayBanner from '@/components/shared/BirthdayBanner';
import CustomerBirthdayBanner from '@/components/shared/CustomerBirthdayBanner';
import type { Part } from '@/types/wireless';

type Tab = 'parts' | 'accessories';

const PAGE_SIZE = 10;

const fmtCedis = (n: number) => `¢${n.toFixed(2)}`;

export default function InventoryPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useWirelessSettings();
  const { parts, loading, add, patch, remove, adjust, adjustDefective, lowStock } = useParts();
  const { products: accessoryProducts } = useAccessoryStore();

  // Permission-based (parts:edit), not a hardcoded role id — otherwise no
  // custom role built for this same job (e.g. a differently-named
  // inventory-manager role) could ever manage anything here, only the one
  // literally id'd 'stock_manager'. Every other portal visitor gets the
  // identical view, minus the action affordances. Unit cost/supplier stay
  // admin-only either way.
  const canManage = user?.role === 'admin' || (user?.permissions ?? []).includes('parts:edit');
  const canSeeCost = user?.role === 'admin';

  const [tab, setTab] = useState<Tab>('parts');
  const [query, setQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddAccessory, setShowAddAccessory] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);
  const [page, setPage] = useState(1);

  const handleSignOut = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  const handleDelete = (p: Part) => {
    if (confirm(`Delete "${p.name}"?`)) remove(p.id);
  };

  const totalUnits = parts.reduce((s, p) => s + p.stock, 0);
  const stockValue = parts.reduce((s, p) => s + p.stock * p.selling_price, 0);
  const filtered = parts.filter(p => {
    if (lowStockOnly && p.stock >= p.min_stock) return false;
    const q = query.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.device ?? '').toLowerCase().includes(q);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedFiltered = useMemo(() =>
    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  [filtered, page]);
  useEffect(() => { setPage(1); }, [query, lowStockOnly]);

  return (
    <div className="h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      {/* Header */}
      <header className="border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={
                theme === 'dark'
                  ? settings?.logo_url_dark || settings?.logo_url || '/wireless-logo-dark.png'
                  : settings?.logo_url || '/wireless-logo-light.png'
              }
              alt={settings?.business_name || 'WIRELESS'}
              style={{ height: 34, width: 'auto', objectFit: 'contain' }}
            />
            <p className="text-[9px] tracking-widest uppercase leading-none" style={{ color: 'hsl(var(--muted-foreground))' }}>Inventory Portal</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
              style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            {canManage && (
              <button
                onClick={() => (tab === 'parts' ? setShowAdd(true) : setShowAddAccessory(true))}
                className="h-8 px-3 flex items-center gap-1.5 rounded-md text-xs font-semibold text-white cursor-pointer transition-shadow"
                style={{ background: 'hsl(var(--primary))' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px hsl(0 90% 50% / 0.5)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                <Plus className="w-3.5 h-3.5" /> {tab === 'parts' ? 'Add Part' : 'Add Accessory'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1 overflow-x-auto">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
            {([
              { id: 'parts', label: 'Repair Parts', icon: Boxes, count: parts.length },
              { id: 'accessories', label: 'Accessories', icon: ShoppingBag, count: accessoryProducts.length },
            ] as { id: Tab; label: string; icon: typeof Boxes; count: number }[]).map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  style={active
                    ? { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }
                    : { color: 'hsl(var(--muted-foreground))' }}>
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={active
                      ? { background: 'hsl(var(--primary))', color: 'white' }
                      : { background: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto w-full px-4 py-6">
          <BirthdayBanner />
          <CustomerBirthdayBanner />
          {tab === 'accessories' ? (
            <AccessoriesTab
              showAddModal={showAddAccessory}
              onCloseAddModal={() => setShowAddAccessory(false)}
              useCardLayout
              canEdit={canManage}
            />
          ) : (
            <div className="space-y-4">
              {/* KPI tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'TOTAL PARTS', value: String(parts.length), sub: 'unique SKUs' },
                  { label: 'LOW STOCK', value: String(lowStock.length), sub: `${lowStock.length} below minimum`, valueColor: lowStock.length ? '#f59e0b' : undefined },
                  { label: 'TOTAL UNITS', value: String(totalUnits), sub: 'across all parts' },
                  { label: 'STOCK VALUE', value: fmtCedis(stockValue), sub: 'at selling price', valueColor: '#22c55e' },
                ].map(card => (
                  <div key={card.label} className="rounded-2xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.label}</p>
                    <p className="text-2xl font-bold" style={{ color: card.valueColor ?? 'hsl(var(--foreground))' }}>{card.value}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Search + low stock filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search parts, SKU…"
                    className="w-full h-9 pl-9 pr-3 rounded-lg text-sm outline-none"
                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                </div>
                <button type="button" onClick={() => setLowStockOnly(v => !v)}
                  className="h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                  style={lowStockOnly
                    ? { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }
                    : { border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                  <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Only
                </button>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {filtered.length} part{filtered.length === 1 ? '' : 's'}
              </p>

              {/* Cards */}
              <div className="space-y-2">
                {loading ? (
                  <div className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
                ) : filtered.length === 0 ? (
                  <div className="py-16 text-center text-xs rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                    No parts found.
                  </div>
                ) : pagedFiltered.map(p => {
                  const isLow = p.stock < p.min_stock;
                  return (
                    <div key={p.id} className="rounded-xl p-4 flex items-center gap-4 flex-wrap"
                      style={{ background: 'hsl(var(--card))', border: `1px solid ${isLow ? 'rgba(245,158,11,0.4)' : 'hsl(var(--border))'}` }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--muted))' }}>
                        <Boxes className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {[p.sku, p.device, p.category, p.color, p.size, p.model_year].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-5 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Selling Price</p>
                          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>{fmtCedis(p.selling_price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Reorder At</p>
                          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.min_stock}</p>
                        </div>
                      </div>
                      {canManage ? (
                        <>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button type="button" onClick={() => adjust(p.id, -1)} disabled={p.stock <= 0}
                              className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30 cursor-pointer"
                              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-14 text-center">
                              <p className="text-sm font-bold" style={{ color: isLow ? '#f59e0b' : 'hsl(var(--foreground))' }}>{p.stock}</p>
                              <p className="text-[9px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>units</p>
                            </div>
                            <button type="button" onClick={() => adjust(p.id, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-white cursor-pointer"
                              style={{ background: '#22c55e' }}>
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 pl-2" style={{ borderLeft: '1px solid hsl(var(--border))' }}>
                            <button type="button" onClick={() => adjustDefective(p.id, -1)} disabled={p.defective_stock <= 0}
                              title="Fewer defective units"
                              className="w-6 h-6 flex items-center justify-center rounded-md disabled:opacity-30 cursor-pointer"
                              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <div className="w-16 text-center">
                              <p className="text-xs font-bold" style={{ color: p.defective_stock > 0 ? '#f97316' : 'hsl(var(--muted-foreground))' }}>{p.defective_stock}</p>
                              <p className="text-[8px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>defective</p>
                            </div>
                            <button type="button" onClick={() => adjustDefective(p.id, 1)}
                              title="Log a defective/returned unit"
                              className="w-6 h-6 flex items-center justify-center rounded-md cursor-pointer"
                              style={{ border: '1px solid rgba(249,115,22,0.4)', color: '#f97316' }}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setEditing(p)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer" style={{ color: 'hsl(var(--muted-foreground))' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(p)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer" style={{ color: 'hsl(var(--muted-foreground))' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: isLow ? '#f59e0b' : 'hsl(var(--foreground))' }}>{p.stock}</p>
                          <p className="text-[9px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>units</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!loading && filtered.length > 0 && (
                <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
              )}
            </div>
          )}
        </div>

        <footer className="border-t mt-6" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-4xl mx-auto px-4 py-4 text-center">
            <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>© {new Date().getFullYear()} WIRELESS · Inventory Portal</p>
          </div>
        </footer>
      </div>

      {/* User card + sign out — bottom-left, matching the sidebar's convention in every other role */}
      {user && (
        <div className="fixed bottom-4 left-4 z-40 rounded-xl p-3 flex items-center gap-2.5 max-w-[calc(100vw-2rem)]"
          style={{ background: 'hsl(220 14% 94%)', border: '1px solid hsl(220 13% 88%)' }}>
          <Link
            to="/profile"
            title="View profile"
            className="flex items-center gap-2.5 flex-1 min-w-0 rounded-lg -m-1 p-1 transition-colors cursor-pointer"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(220 13% 88%)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
              style={{ background: user.roleColor ?? (user.role ? roleColors[user.role] : undefined) ?? 'hsl(354 60% 35%)' }}
            >
              {user.avatar || user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'hsl(220 20% 12%)' }}>{user.name}</p>
              <p className="text-[10px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {user.roleName ?? (user.role ? (roleLabels[user.role] ?? user.role) : user.role)}
              </p>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showAdd && (
        <AddPartModal onSave={data => add(data)} onClose={() => setShowAdd(false)} existingParts={parts} canSeeCost={canSeeCost} />
      )}
      {editing && (
        <AddPartModal
          initial={editing}
          onSave={data => patch(editing.id, data)}
          onClose={() => setEditing(null)}
          existingParts={parts}
          canSeeCost={canSeeCost}
        />
      )}
    </div>
  );
}
