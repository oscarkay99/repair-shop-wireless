import { useState } from 'react';
export function useBudgets() {
  const [budgets] = useState<{ category: string; amount: number }[]>([]);
  const [budgetMap, setBudgetMapState] = useState<Record<string, number>>({});
  const setBudget = (category: string, amount: number) => {
    setBudgetMapState(prev => ({ ...prev, [category]: amount }));
  };
  return { budgets, loading: false, budgetMap, setBudget };
}
