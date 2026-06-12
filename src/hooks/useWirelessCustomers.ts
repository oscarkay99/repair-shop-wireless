import { useState, useEffect, useCallback } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/services/wireless/customers';
import type { WCustomer } from '@/types/wireless';
import { useToast } from '@/contexts/ToastContext';

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
    const c = await createCustomer(input);
    setCustomers(prev => [c, ...prev]);
    showToast('Customer added');
    return c;
  };

  const patch = async (id: string, data: Partial<WCustomer>) => {
    await updateCustomer(id, data);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const remove = async (id: string) => {
    await deleteCustomer(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast('Customer removed');
  };

  return { customers, loading, reload, add, patch, remove };
}
