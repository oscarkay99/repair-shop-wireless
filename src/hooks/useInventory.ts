import { useEffect, useSyncExternalStore } from 'react';
import { fetchInventory, addInventoryItem, setInventoryStock, updateInventoryItem } from '@/services/inventory';
import { useToast } from '@/contexts/ToastContext';

export interface InventoryProduct {
  id: string; name: string; category: string; color?: string; condition: string;
  price: string; costPrice?: number; stock: number; location: string; supplier: string;
  lastRestocked?: string; fastMover?: boolean; imei?: string;
}

interface Store {
  products: InventoryProduct[];
  loading: boolean;
}

function mapRow(r: Awaited<ReturnType<typeof fetchInventory>>[number]): InventoryProduct {
  return {
    id: r.id, name: r.name, category: r.category, color: r.color,
    condition: r.condition, price: r.price, stock: r.stock,
    costPrice: r.cost_price, location: r.location, supplier: r.supplier,
    imei: r.imei, fastMover: r.fast_mover, lastRestocked: r.last_restocked,
  };
}

let store: Store = { products: [], loading: true };
let started = false;
const listeners = new Set<() => void>();

function setStore(next: Partial<Store>) {
  store = { ...store, ...next };
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return store;
}

// Shared across every screen that reads inventory — including TopBar's
// global search, which mounts once for the whole session — instead of each
// mounting its own useState copy. Otherwise a stock change made on one
// screen (Inventory page, POS, a ticket's Parts Used) left every other
// already-mounted consumer showing stale stock/products until a hard
// refresh. Mirrors the same fix applied to useWirelessSettings /
// useTechnicians / useRepairs.
export async function reloadInventory() {
  setStore({ loading: true });
  try {
    const products = (await fetchInventory()).map(mapRow);
    setStore({ products, loading: false });
  } catch (e) {
    setStore({ loading: false });
    throw e;
  }
}

export function useInventory() {
  const { products, loading } = useSyncExternalStore(subscribe, getSnapshot);
  const { showToast } = useToast();

  useEffect(() => {
    if (!started) {
      started = true;
      reloadInventory();
    }
  }, []);

  const add = async (p: Omit<InventoryProduct, 'id'>) => {
    const record = await addInventoryItem({
      name: p.name, category: p.category, color: p.color, condition: p.condition,
      price: p.price, stock: p.stock, location: p.location, supplier: p.supplier,
      imei: p.imei, fast_mover: p.fastMover, last_restocked: p.lastRestocked,
    });
    const mapped = mapRow(record);
    setStore({ products: [mapped, ...store.products] });
    showToast(`${p.name} added to inventory`);
    return mapped;
  };

  const updateStock = async (id: string, stock: number) => {
    await setInventoryStock(id, stock);
    setStore({ products: store.products.map(p => p.id === id ? { ...p, stock } : p) });
    showToast('Stock updated');
  };

  const update = async (id: string, updates: Partial<InventoryProduct>) => {
    await updateInventoryItem(id, {
      name: updates.name, category: updates.category, color: updates.color,
      condition: updates.condition, price: updates.price, stock: updates.stock,
      location: updates.location, supplier: updates.supplier,
    });
    setStore({ products: store.products.map(p => p.id === id ? { ...p, ...updates } : p) });
    showToast('Product updated');
  };

  return { products, loading, reload: reloadInventory, add, updateStock, update };
}
