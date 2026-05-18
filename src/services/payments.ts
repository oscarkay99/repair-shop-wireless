import { transactions as seedData } from '@/mocks/payments';
import type { Transaction as Payment } from '@/types/payment';

let store: Payment[] = (seedData as unknown as Payment[]).map(p => ({ ...p }));

export async function getPayments(): Promise<Payment[]> { return [...store]; }
export async function createPayment(p: Omit<Payment, 'id'>): Promise<Payment> {
  const item = { ...p, id: `TXN-${Date.now()}` } as Payment;
  store = [item, ...store];
  return item;
}
export async function verifyPayment(id: string): Promise<void> {
  store = store.map(p => p.id === id ? { ...p, status: 'verified' } : p);
}
