import { useState, useEffect, useCallback } from 'react';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getSales, createSale, deleteSale,
  type AccessoryProduct, type AccessorySaleRecord,
} from '@/services/wireless/accessoryStore';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

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
    try {
      const p = await createProduct(input);
      setProducts(prev => [p, ...prev]);
      showToast('Product added');
      return p;
    } catch (e) {
      showToast(errMessage(e, 'Failed to add product'), 'error');
      throw e;
    }
  };

  const patchProduct = async (id: string, data: Partial<AccessoryProduct>) => {
    try {
      await updateProduct(id, data);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    } catch (e) {
      showToast(errMessage(e, 'Failed to update product'), 'error');
      throw e;
    }
  };

  const removeProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('Product removed');
    } catch (e) {
      showToast(errMessage(e, 'Failed to remove product'), 'error');
      throw e;
    }
  };

  const recordSale = async (input: Parameters<typeof createSale>[0]) => {
    try {
      const s = await createSale(input);
      setSales(prev => [s, ...prev]);
      showToast('Sale recorded');
      return s;
    } catch (e) {
      showToast(errMessage(e, 'Failed to record sale'), 'error');
      throw e;
    }
  };

  const removeSale = async (id: string) => {
    try {
      await deleteSale(id);
      setSales(prev => prev.filter(s => s.id !== id));
      showToast('Sale removed');
    } catch (e) {
      showToast(errMessage(e, 'Failed to remove sale'), 'error');
      throw e;
    }
  };

  return { products, sales, loading, reload, addProduct, patchProduct, removeProduct, recordSale, removeSale };
}
