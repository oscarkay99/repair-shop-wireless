import { useState, useEffect } from 'react';
import { getPayments } from '@/services/payments';
import type { Transaction as Payment } from '@/types/payment';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayments().then(setTransactions).finally(() => setLoading(false));
  }, []);

  return { transactions, loading };
}
