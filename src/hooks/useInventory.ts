import { useState, useEffect } from 'react';
import { fetchInventory, addInventoryItem, setInventoryStock, updateInventoryItem } from '@/services/inventory';
import { useToast } from '@/contexts/ToastContext';

export interface InventoryProduct {
  id: string; name: string; category: string; color?: string; condition: string;
  price: string; costPrice?: number; stock: number; location: string; supplier: string;
  lastRestocked?: string; fastMover?: boolean; imei?: string;
}

export function useInventory() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchInventory().then(data => setProducts(data.map(r => ({
      id: r.id, name: r.name, category: r.category, color: r.color,
      condition: r.condition, price: r.price, stock: r.stock,
      costPrice: r.cost_price, location: r.location, supplier: r.supplier,
      imei: r.imei, fastMover: r.fast_mover, lastRestocked: r.last_restocked,
    })))).finally(() => setLoading(false));
  }, []);

  const add = async (p: Omit<InventoryProduct, 'id'>) => {
    const record = await addInventoryItem({
      name: p.name, category: p.category, color: p.color, condition: p.condition,
      price: p.price, stock: p.stock, location: p.location, supplier: p.supplier,
      imei: p.imei, fast_mover: p.fastMover, last_restocked: p.lastRestocked,
    });
    const mapped: InventoryProduct = {
      id: record.id, name: record.name, category: record.category, color: record.color,
      condition: record.condition, price: record.price, stock: record.stock,
      costPrice: record.cost_price, location: record.location, supplier: record.supplier,
      imei: record.imei, fastMover: record.fast_mover, lastRestocked: record.last_restocked,
    };
    setProducts(prev => [mapped, ...prev]);
    showToast(`${p.name} added to inventory`);
    return mapped;
  };

  const updateStock = async (id: string, stock: number) => {
    await setInventoryStock(id, stock);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock } : p));
    showToast('Stock updated');
  };

  const update = async (id: string, updates: Partial<InventoryProduct>) => {
    await updateInventoryItem(id, {
      name: updates.name, category: updates.category, color: updates.color,
      condition: updates.condition, price: updates.price, stock: updates.stock,
      location: updates.location, supplier: updates.supplier,
    });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    showToast('Product updated');
  };

  return { products, loading, add, updateStock, update };
}
