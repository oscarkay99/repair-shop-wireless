import { useState, useEffect, useCallback } from 'react';
import { getPriceList, createPriceEntry, updatePriceEntry, deletePriceEntry } from '@/services/wireless/priceList';
import type { PriceListEntry } from '@/types/wireless';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

export function usePriceList() {
  const [priceList, setPriceList] = useState<PriceListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try { setPriceList(await getPriceList()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add = async (input: Parameters<typeof createPriceEntry>[0]) => {
    try {
      const entry = await createPriceEntry(input);
      setPriceList(prev => [entry, ...prev]);
      showToast('Price added');
      return entry;
    } catch (e) {
      showToast(errMessage(e, 'Failed to add price'), 'error');
      throw e;
    }
  };

  const patch = async (id: string, data: Partial<PriceListEntry>) => {
    try {
      await updatePriceEntry(id, data);
      setPriceList(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
      showToast('Price updated');
    } catch (e) {
      showToast(errMessage(e, 'Failed to update price'), 'error');
      throw e;
    }
  };

  const remove = async (id: string) => {
    try {
      await deletePriceEntry(id);
      setPriceList(prev => prev.filter(e => e.id !== id));
      showToast('Price removed');
    } catch (e) {
      showToast(errMessage(e, 'Failed to remove price'), 'error');
      throw e;
    }
  };

  return { priceList, loading, reload, add, patch, remove };
}
