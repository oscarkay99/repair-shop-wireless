import { recentTransactions as seedData } from '@/mocks/expenses';

export interface ExpenseRecord {
  id: string; date: string; category: string; description: string; type?: string; status?: string;
  amount: number; vendor: string; receipt: boolean; approved: boolean;
}

let store: ExpenseRecord[] = (seedData as unknown as ExpenseRecord[]).map(e => ({ ...e }));

export async function getExpenses(): Promise<ExpenseRecord[]> { return [...store]; }
export async function createExpense(e: Omit<ExpenseRecord, 'id'>): Promise<ExpenseRecord> {
  const item = { ...e, id: `EXP-${Date.now()}` };
  store = [item, ...store];
  return item;
}

export type Expense = ExpenseRecord;
