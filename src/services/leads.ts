import { leads as seedData } from '@/mocks/leads';
import type { Lead } from '@/types/lead';

let store: Lead[] = (seedData as unknown as Lead[]).map(l => ({ ...l }));

export async function getLeads(): Promise<Lead[]> { return [...store]; }
export async function createLead(l: Omit<Lead, 'id'>): Promise<Lead> {
  const item = { ...l, id: `L${String(store.length + 1).padStart(3, '0')}` } as Lead;
  store = [item, ...store];
  return item;
}
export async function updateLeadStatus(id: string, status: Lead['status']): Promise<void> {
  store = store.map(l => l.id === id ? { ...l, status } : l);
}
