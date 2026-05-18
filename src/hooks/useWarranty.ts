import { useState, useEffect } from 'react';
import { warranties as seedData } from '@/mocks/warranty';
import { useToast } from '@/contexts/ToastContext';

export interface WarrantyItem {
  id: string; customer: string; device: string; purchaseDate: string;
  expiryDate: string; status: string; claimStatus?: string; serial?: string;
}

export type WarrantyReturn = WarrantyItem;

let store: WarrantyItem[] = (seedData as unknown as WarrantyItem[]).map(w => ({ ...w }));

export function useWarranty() {
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    setItems([...store]);
    setLoading(false);
  }, []);

  const addReturn = async (item: Omit<WarrantyItem, 'id'>) => {
    const created = { ...item, id: `W-${Date.now()}` };
    store = [created, ...store];
    setItems([...store]);
    showToast('Warranty return logged');
    return created;
  };

  const updateStatus = (id: string, status: string) => {
    store = store.map(w => w.id === id ? { ...w, claimStatus: status } : w);
    setItems([...store]);
  };

  const stats = {
    pendingReturns: items.filter(w => !w.claimStatus || w.claimStatus === 'pending').length,
    totalReturns: items.length,
  };

  return { items, returns: items, loading, addReturn, updateStatus, stats };
}
