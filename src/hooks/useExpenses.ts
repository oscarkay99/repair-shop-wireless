import { useState, useEffect } from 'react';
import { getExpenses, createExpense } from '@/services/expenses';
import type { ExpenseRecord } from '@/services/expenses';
import { useToast } from '@/contexts/ToastContext';

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    getExpenses().then(setExpenses).finally(() => setLoading(false));
  }, []);

  const add = async (e: Omit<ExpenseRecord, 'id'>) => {
    const created = await createExpense(e);
    setExpenses(prev => [created, ...prev]);
    showToast('Expense recorded');
    return created;
  };

  const update = (id: string, changes: Partial<ExpenseRecord>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...changes } : e));
  };

  const remove = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return { expenses, loading, add, update, remove };
}
