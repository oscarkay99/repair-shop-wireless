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
    try {
      const created = await createExpense(e);
      setExpenses(prev => [created, ...prev]);
      showToast('Expense recorded');
      return created;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to record expense', 'error');
      throw err;
    }
  };

  const update = async (id: string, changes: Partial<ExpenseRecord>) => {
    try {
      await updateExpense(id, changes);
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...changes } : e));
      showToast('Expense updated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update expense', 'error');
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      showToast('Expense deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete expense', 'error');
      throw err;
    }
  };

  return { expenses, loading, add, update, remove };
}
