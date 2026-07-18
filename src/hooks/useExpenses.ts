import { useState, useEffect } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/services/wireless/expenses';
import type { ExpenseRecord } from '@/services/wireless/expenses';
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

  const update = async (id: string, changes: Partial<ExpenseRecord>) => {
    await updateExpense(id, changes);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...changes } : e));
    showToast('Expense updated');
  };

  const remove = async (id: string) => {
    await deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Expense deleted');
  };

  return { expenses, loading, add, update, remove };
}
