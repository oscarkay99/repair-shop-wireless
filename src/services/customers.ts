import { customers as seedData } from '@/mocks/customers';
import type { Customer } from '@/types/customer';
import { isSupabaseConfigured, supabase } from './supabase';

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  website_auth_user_id?: string | null;
  has_website_account?: boolean | null;
  source?: string | null;
  segment: string;
  ltv: string;
  orders: number;
  last_order: string;
  avg_order: string;
  warranties: number;
  repairs: number;
  since: string;
};

function normalizeCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    websiteAuthUserId: row.website_auth_user_id ?? undefined,
    hasWebsiteAccount: row.has_website_account ?? undefined,
    source: (row.source as Customer['source']) ?? undefined,
    segment: row.segment as Customer['segment'],
    ltv: row.ltv,
    orders: row.orders,
    lastOrder: row.last_order,
    avgOrder: row.avg_order,
    warranties: row.warranties,
    repairs: row.repairs,
    since: row.since,
  };
}

let store: Customer[] = seedData.map(c => ({ ...c } as unknown as Customer));

export async function getCustomers(): Promise<Customer[]> {
  if (!isSupabaseConfigured) {
    return [...store];
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data?.length) return [...store];

    store = data.map(row => normalizeCustomer(row as CustomerRow));
  } catch (error) {
    console.warn('Falling back to local customer store.', error);
  }

  return [...store];
}

export async function createCustomer(c: Omit<Customer, 'id'>): Promise<Customer> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: c.name,
        phone: c.phone,
        email: c.email,
        website_auth_user_id: c.websiteAuthUserId ?? null,
        has_website_account: c.hasWebsiteAccount ?? false,
        source: c.source ?? 'admin',
        segment: c.segment,
        ltv: c.ltv,
        orders: c.orders,
        last_order: c.lastOrder,
        avg_order: c.avgOrder,
        warranties: c.warranties,
        repairs: c.repairs,
        since: c.since,
      })
      .select()
      .single();
    if (error) throw error;
    const item = normalizeCustomer(data as CustomerRow);
    store = [item, ...store];
    return item;
  }

  const item = { ...c, id: `C${String(store.length + 1).padStart(3, '0')}` } as Customer;
  store = [item, ...store];
  return item;
}
