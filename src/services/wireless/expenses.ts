import { isSupabaseConfigured, db } from '@/services/supabase';
import { recentTransactions as seedData } from '@/mocks/expenses';

export interface ExpenseRecord {
  id: string; date: string; category: string; description: string; type?: string; status?: string;
  amount: number; vendor?: string; receipt?: boolean; approved?: boolean; notes?: string;
}
export type Expense = ExpenseRecord;

let localStore: ExpenseRecord[] = (seedData as unknown as ExpenseRecord[]).map(e => ({ ...e }));

export async function getExpenses(): Promise<ExpenseRecord[]> {
  if (!isSupabaseConfigured) return [...localStore];
  try {
    const { data, error } = await db.from('expenses').select('*').order('date', { ascending: false });
    if (error) throw error;
    // Trust a successful (even empty) response completely — don't keep showing
    // seed expenses once the real table is reachable.
    localStore = (data as ExpenseRecord[] | null) ?? [];
    return localStore;
  } catch (e) {
    console.warn('[wireless/expenses] falling back to local store', e);
    return [...localStore];
  }
}

export async function createExpense(input: Omit<ExpenseRecord, 'id'>): Promise<ExpenseRecord> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await db.from('expenses').insert(input).select().single();
      if (error) throw error;
      const e = data as ExpenseRecord;
      localStore = [e, ...localStore];
      return e;
    } catch (e) {
      console.warn('[wireless/expenses] unable to create expense in Supabase', e);
    }
  }
  const e: ExpenseRecord = { ...input, id: `EXP-${Date.now()}` };
  localStore = [e, ...localStore];
  return e;
}

export async function updateExpense(id: string, patch: Partial<ExpenseRecord>): Promise<void> {
  localStore = localStore.map(e => e.id === id ? { ...e, ...patch } : e);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('expenses').update(patch).eq('id', id);
  if (error) console.warn('[wireless/expenses] update error', error);
}

export async function deleteExpense(id: string): Promise<void> {
  localStore = localStore.filter(e => e.id !== id);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('expenses').delete().eq('id', id);
  if (error) console.warn('[wireless/expenses] delete error', error);
}
