import { isSupabaseConfigured, db } from '@/services/supabase';
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/types/wireless';

const SEED: Invoice[] = [
  { id: 'inv1', invoice_number: 'INV-2026-0001', ticket_id: 'tk4', customer_id: 'c3', subtotal: 450, tax: 0, discount: 0, total: 450, amount_paid: 450, status: 'paid',    due_date: '2026-06-15', created_at: '2026-06-09T08:00:00Z', updated_at: '2026-06-10T16:00:00Z' },
  { id: 'inv2', invoice_number: 'INV-2026-0002', ticket_id: 'tk5', customer_id: 'c4', subtotal: 120, tax: 0, discount: 0, total: 120, amount_paid: 120, status: 'paid',    due_date: '2026-06-14', created_at: '2026-06-08T09:00:00Z', updated_at: '2026-06-10T16:00:00Z' },
  { id: 'inv3', invoice_number: 'INV-2026-0003', ticket_id: 'tk3', customer_id: 'c2', subtotal: 85,  tax: 0, discount: 0, total: 85,  amount_paid: 0,   status: 'unpaid',  due_date: '2026-06-18', created_at: '2026-06-11T11:00:00Z', updated_at: '2026-06-11T11:00:00Z' },
  { id: 'inv4', invoice_number: 'INV-2026-0004', ticket_id: 'tk2', customer_id: 'c1', subtotal: 320, tax: 0, discount: 0, total: 320, amount_paid: 100, status: 'partial', due_date: '2026-06-20', created_at: '2026-06-10T10:00:00Z', updated_at: '2026-06-11T14:00:00Z' },
  { id: 'inv5', invoice_number: 'INV-2026-0005', customer_id: 'c5', subtotal: 200, tax: 0, discount: 0, total: 200, amount_paid: 0, status: 'overdue',  due_date: '2026-06-05', created_at: '2026-06-01T09:00:00Z', updated_at: '2026-06-01T09:00:00Z' },
];
let localStore = [...SEED];

function nextNumber(): string {
  return `INV-${new Date().getFullYear()}-${String(localStore.length + 1).padStart(4, '0')}`;
}

export async function getInvoices(): Promise<Invoice[]> {
  if (!isSupabaseConfigured) return [...localStore];
  try {
    const { data, error } = await db
      .from('invoices')
      .select('*, customer:customers(name,phone), ticket:tickets(ticket_number,device,issue)')
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

export async function deleteInvoice(id: string): Promise<void> {
  localStore = localStore.filter(i => i.id !== id);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('invoices').delete().eq('id', id);
  if (error) console.warn('[wireless/invoices] delete error', error);
}
