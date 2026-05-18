import { repairs as seedData } from '@/mocks/repairs';
import type { Repair, RepairStatus } from '@/types/repair';

let store: Repair[] = seedData.map(r => ({ ...r } as unknown as Repair));

export async function getRepairs(): Promise<Repair[]> {
  return [...store];
}

export async function createRepair(r: Omit<Repair, 'id'>): Promise<Repair> {
  const item = { ...r, id: `R-${String(store.length + 1).padStart(4, '0')}` } as Repair;
  store = [item, ...store];
  return item;
}

export async function updateRepairStatus(id: string, status: RepairStatus): Promise<void> {
  store = store.map(r => r.id === id ? { ...r, status } : r);
}

export async function updateRepairNotes(id: string, notes: string[]): Promise<void> {
  store = store.map(r => r.id === id ? { ...r, notes } : r);
}
