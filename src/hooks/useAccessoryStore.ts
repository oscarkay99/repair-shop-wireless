import { useState, useEffect, useCallback } from 'react';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getSales, createSale, deleteSale,
  type AccessoryProduct, type AccessorySaleRecord,
} from '@/services/wireless/accessoryStore';
import { useToast } from '@/contexts/ToastContext';

export function useAccessoryStore() {
  const [products, setProducts] = useState<AccessoryProduct[]>([]);
  const [sales, setSales]       = useState<AccessorySaleRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const { showToast } = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([getProducts(), getSales()]);
      setProducts(p);
      setSales(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const addProduct = async (input: Parameters<typeof createProduct>[0]) => {
    const p = await createProduct(input);
    setProducts(prev => [p, ...prev]);
    showToast('Product added');
    return p;
  };

  const patchProduct = async (id: string, data: Partial<AccessoryProduct>) => {
    await updateProduct(id, data);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const removeProduct = async (id: string) => {
    await deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Product removed');
  };

  const recordSale = async (input: Parameters<typeof createSale>[0]) => {
    const s = await createSale(input);
    setSales(prev => [s, ...prev]);
    showToast('Sale recorded');
    return s;
  };

  const removeSale = async (id: string) => {
    await deleteSale(id);
    setSales(prev => prev.filter(s => s.id !== id));
    showToast('Sale removed');
  };

  return { products, sales, loading, reload, addProduct, patchProduct, removeProduct, recordSale, removeSale };
}
