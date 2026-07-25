import { useState, useEffect } from 'react';
import { getCustomers, createCustomer } from '@/services/customers';
import type { Customer } from '@/types/customer';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    getCustomers().then(setCustomers).finally(() => setLoading(false));
  }, []);

  const add = async (c: Omit<Customer, 'id'>) => {
    try {
      const created = await createCustomer(c);
      setCustomers(prev => [created, ...prev]);
      showToast(`${c.name} added`);
      return created;
    } catch (e) {
      showToast(`Failed to add customer: ${errMessage(e)}`, 'error');
      throw e;
    }
  };

  return { customers, loading, add };
}
