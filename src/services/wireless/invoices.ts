import { isSupabaseConfigured, db } from '@/services/supabase';
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/types/wireless';

// Local line-items store (used in offline / local mode)
interface LocalItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const ITEMS_SEED: LocalItem[] = [
  { id: 'li1', invoice_id: 'inv1', description: 'MacBook Air M2 Keyboard Replacement', quantity: 1, unit_price: 129.99, total_price: 129.99 },
  { id: 'li2', invoice_id: 'inv1', description: 'Labor - Keyboard Replacement',         quantity: 1, unit_price:  50.00, total_price:  50.00 },
  { id: 'li3', invoice_id: 'inv2', description: 'iPhone 15 Pro Screen Replacement',      quantity: 1, unit_price: 249.99, total_price: 249.99 },
  { id: 'li4', invoice_id: 'inv2', description: 'Labor - Screen Replacement',            quantity: 1, unit_price:  50.00, total_price:  50.00 },
];
let itemsStore = [...ITEMS_SEED];

export function getInvoiceItems(invoiceId: string): LocalItem[] {
  return itemsStore.filter(i => i.invoice_id === invoiceId);
}

export function addInvoiceItem(invoiceId: string, item: Omit<LocalItem, 'id' | 'invoice_id'>): LocalItem {
  const li: LocalItem = { ...item, id: crypto.randomUUID(), invoice_id: invoiceId };
  itemsStore = [...itemsStore, li];
  return li;
}

const SEED: Invoice[] = [
  {
    id: 'inv1',
    invoice_number: 'INV-0001',
    customer_id: 'c2',
    customer: {
      id: 'c2',
      name: 'Michael Chen',
      phone: '+1 555-0102',
      email: 'mchen@example.com',
      address: '456 Mac Ave, San Jose, CA',
      ticket_count: 2,
      total_spent: 518.38,
      created_at: '2026-01-15T00:00:00Z',
      updated_at: '2026-06-09T00:00:00Z',
    },
    subtotal: 179.99,
    tax: 14.40,
    discount: 0,
    total: 194.39,
    amount_paid: 0,
    status: 'unpaid',
    due_date: '2026-06-16',
    created_at: '2026-06-09T08:00:00Z',
    updated_at: '2026-06-09T08:00:00Z',
  },
  {
    id: 'inv2',
    invoice_number: 'INV-0002',
    customer_id: 'c2',
    customer: {
      id: 'c2',
      name: 'Michael Chen',
      phone: '+1 555-0102',
      email: 'mchen@example.com',
      address: '456 Mac Ave, San Jose, CA',
      ticket_count: 2,
      total_spent: 518.38,
      created_at: '2026-01-15T00:00:00Z',
      updated_at: '2026-06-06T00:00:00Z',
    },
    subtotal: 299.99,
    tax: 24.00,
    discount: 0,
    total: 323.99,
    amount_paid: 323.99,
    status: 'paid',
    due_date: '2026-06-13',
    created_at: '2026-06-06T10:00:00Z',
    updated_at: '2026-06-10T14:00:00Z',
  },
];
let localStore = [...SEED];

function nextNumber(): string {
  return `INV-${String(localStore.length + 1).padStart(4, '0')}`;
}

export async function getInvoices(): Promise<Invoice[]> {
  if (!isSupabaseConfigured) return [...localStore];
  try {
    const { data, error } = await db
      .from('invoices')
      .select('*, customer:customers(id,name,phone,email,address,ticket_count,total_spent,created_at,updated_at)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (data?.length) { localStore = data as Invoice[]; }
    return localStore;
  } catch (e) {
    console.warn('[wireless/invoices] falling back to local store', e);
    return [...localStore];
  }
}

export async function createInvoice(
  input: Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>,
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[] = []
): Promise<Invoice> {
  if (isSupabaseConfigured) {
    const { data, error } = await db.from('invoices').insert(input).select().single();
    if (!error && data) {
      const inv = data as Invoice;
      if (items.length) {
        await db.from('invoice_items').insert(items.map(i => ({ ...i, invoice_id: inv.id })));
      }
      localStore = [inv, ...localStore];
      return inv;
    }
  }
  const inv: Invoice = { ...input, id: crypto.randomUUID(), invoice_number: nextNumber(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  localStore = [inv, ...localStore];
  return inv;
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus, amountPaid?: number): Promise<void> {
  const patch: Partial<Invoice> = { status, updated_at: new Date().toISOString() };
  if (amountPaid !== undefined) patch.amount_paid = amountPaid;
  localStore = localStore.map(i => i.id === id ? { ...i, ...patch } : i);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('invoices').update(patch).eq('id', id);
  if (error) console.warn('[wireless/invoices] update error', error);
}

export async function patchInvoice(id: string, data: Partial<Pick<Invoice, 'status' | 'amount_paid' | 'due_date' | 'notes' | 'discount'>>): Promise<void> {
  const patch = { ...data, updated_at: new Date().toISOString() };
  localStore = localStore.map(i => i.id === id ? { ...i, ...patch } : i);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('invoices').update(patch).eq('id', id);
  if (error) console.warn('[wireless/invoices] patch error', error);
}

export async function deleteInvoice(id: string): Promise<void> {
  localStore = localStore.filter(i => i.id !== id);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('invoices').delete().eq('id', id);
  if (error) console.warn('[wireless/invoices] delete error', error);
}
