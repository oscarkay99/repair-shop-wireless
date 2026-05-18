import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
export function usePurchaseOrders() {
  const [orders] = useState([]);
  const { showToast } = useToast();
  const create = async (po: unknown) => { showToast('Order created'); return po; };
  return { orders, loading: false, create };
}
