import { recentSales as seedData } from '@/mocks/sales';
import type { Sale } from '@/types/sale';

let store: Sale[] = (seedData as unknown as Sale[]).map(s => ({ ...s }));

export async function getSales(): Promise<Sale[]> { return [...store]; }
export async function createSale(s: Omit<Sale, 'id'>): Promise<Sale> {
  const item = { ...s, id: `S-${Date.now()}` } as Sale;
  store = [item, ...store];
  return item;
}
