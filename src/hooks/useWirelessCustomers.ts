import { useState, useEffect, useCallback } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/services/wireless/customers';
import type { WCustomer } from '@/types/wireless';
import { useToast } from '@/contexts/ToastContext';

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong';
}

export function useWirelessCustomers() {
  const [customers, setCustomers] = useState<WCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try { setCustomers(await getCustomers()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add = async (input: Parameters<typeof createCustomer>[0]) => {
    try {
      const c = await createCustomer(input);
      setCustomers(prev => [c, ...prev]);
      showToast('Customer added');
      return c;
    } catch (e) {
      showToast(`Failed to add customer: ${errMessage(e)}`, 'error');
      throw e;
    }
  };

  const patch = async (id: string, data: Partial<WCustomer>) => {
    try {
      await updateCustomer(id, data);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    } catch (e) {
      showToast(`Failed to update customer: ${errMessage(e)}`, 'error');
      throw e;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast('Customer removed');
    } catch (e) {
      showToast(`Failed to remove customer: ${errMessage(e)}`, 'error');
      throw e;
    }
  };

  return { customers, loading, reload, add, patch, remove };
}
