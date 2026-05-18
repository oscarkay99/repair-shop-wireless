import { customers as seedData } from '@/mocks/customers';
import type { Customer } from '@/types/customer';

let store: Customer[] = seedData.map(c => ({ ...c } as unknown as Customer));

export async function getCustomers(): Promise<Customer[]> { return [...store]; }
export async function createCustomer(c: Omit<Customer, 'id'>): Promise<Customer> {
  const item = { ...c, id: `C${String(store.length + 1).padStart(3, '0')}` } as Customer;
  store = [item, ...store];
  return item;
}
