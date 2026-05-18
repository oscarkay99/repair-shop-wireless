import { inventoryProducts as seedData } from '@/mocks/inventory';

let store = seedData.map(p => ({ ...p }));

export async function getProducts() { return [...store]; }
export async function getProductById(id: string) { return store.find(p => p.id === id) ?? null; }
