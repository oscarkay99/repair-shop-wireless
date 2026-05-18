import { inventoryProducts as seedData } from '@/mocks/inventory';

export interface InventoryRecord {
  id: string; name: string; category: string; color?: string; condition: string;
  price: string; cost_price?: number; stock: number; location: string; supplier: string;
  imei?: string; fast_mover?: boolean; last_restocked?: string;
}

let store: InventoryRecord[] = seedData.map(p => ({
  id: p.id, name: p.name, category: p.category, color: p.color, condition: p.condition,
  price: p.price, stock: p.stock, location: p.location, supplier: p.supplier,
  imei: p.imei, fast_mover: p.fastMover, last_restocked: p.lastRestocked,
} as InventoryRecord));

export async function fetchInventory(): Promise<InventoryRecord[]> { return [...store]; }
export async function addInventoryItem(item: Omit<InventoryRecord, 'id'>): Promise<InventoryRecord> {
  const record = { ...item, id: `P${String(store.length + 1).padStart(3, '0')}` };
  store = [record, ...store];
  return record;
}
export async function setInventoryStock(id: string, stock: number): Promise<void> {
  store = store.map(p => p.id === id ? { ...p, stock } : p);
}
export async function updateInventoryItem(id: string, updates: Partial<InventoryRecord>): Promise<void> {
  store = store.map(p => p.id === id ? { ...p, ...updates } : p);
}
