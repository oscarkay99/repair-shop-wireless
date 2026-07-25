import { isSupabaseConfigured, supabase, db } from '@/services/supabase';
import type { Invoice, InvoiceItem } from '@/types/wireless';

const WIRELESS_ADMIN_API = 'https://api.wirelesscares.com/wireless-admin/v1';

// Local line-items store (used in offline / local mode, and as a read-failure fallback)
const ITEMS_SEED: InvoiceItem[] = [
  { id: 'li1', invoice_id: 'inv1', description: 'MacBook Air M2 Keyboard Replacement', quantity: 1, unit_price: 129.99, total_price: 129.99 },
  { id: 'li2', invoice_id: 'inv1', description: 'Labor - Keyboard Replacement',         quantity: 1, unit_price:  50.00, total_price:  50.00 },
  { id: 'li3', invoice_id: 'inv2', description: 'iPhone 15 Pro Screen Replacement',      quantity: 1, unit_price: 249.99, total_price: 249.99 },
  { id: 'li4', invoice_id: 'inv2', description: 'Labor - Screen Replacement',            quantity: 1, unit_price:  50.00, total_price:  50.00 },
];
let itemsStore = [...ITEMS_SEED];

export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  if (!isSupabaseConfigured) return itemsStore.filter(i => i.invoice_id === invoiceId);
  try {
    const { data, error } = await db
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('id', { ascending: true });
    if (error) throw error;
    return (data as InvoiceItem[] | null) ?? [];
  } catch (e) {
    console.warn('[wireless/invoices] falling back to local item store', e);
    return itemsStore.filter(i => i.invoice_id === invoiceId);
  }
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
    warranty: false,
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
    warranty: true,
    warranty_days: 90,
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
    // Trust a successful (even empty) response completely — don't keep showing
    // seed invoices (which reference a seed customer that isn't real) once the
    // real table is reachable.
    localStore = (data as Invoice[] | null) ?? [];
    return localStore;
  } catch (e) {
    console.warn('[wireless/invoices] falling back to local store', e);
    return [...localStore];
  }
}

/** The invoice already issued for a ticket, if any — used to avoid re-prompting
 *  "Create Invoice" once one exists for that ticket. */
export async function getInvoiceForTicket(ticketId: string): Promise<Pick<Invoice, 'id' | 'invoice_number'> | null> {
  if (!isSupabaseConfigured || !ticketId) return null;
  const { data, error } = await db
    .from('invoices')
    .select('id, invoice_number')
    .eq('ticket_id', ticketId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Pick<Invoice, 'id' | 'invoice_number'> | null;
}

export async function createInvoice(
  input: Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>,
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[] = []
): Promise<Invoice> {
  if (isSupabaseConfigured) {
    // `customer` is a hydrated join, not a real column — sending it to insert()
    // makes Postgres reject the whole row (unknown column), which used to be
    // swallowed below and silently downgraded to a fake local-only invoice.
    const { customer: _customer, ...row } = input;
    const { data, error } = await db
      .from('invoices')
      .insert(row)
      .select('*, customer:customers(id,name,phone,email,address,ticket_count,total_spent,created_at,updated_at)')
      .single();
    if (error) throw error;
    const inv = data as Invoice;
    if (items.length) {
      const { error: itemsError } = await db.from('invoice_items').insert(items.map(i => ({ ...i, invoice_id: inv.id })));
      if (itemsError) throw itemsError;
    }
    localStore = [inv, ...localStore];
    return inv;
  }
  const inv: Invoice = { ...input, id: crypto.randomUUID(), invoice_number: nextNumber(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  localStore = [inv, ...localStore];
  return inv;
}

export async function patchInvoice(id: string, data: Partial<Pick<Invoice, 'status' | 'amount_paid' | 'payment_method' | 'due_date' | 'notes' | 'discount'>>): Promise<void> {
  const patch = { ...data, updated_at: new Date().toISOString() };
  if (!isSupabaseConfigured) {
    localStore = localStore.map(i => i.id === id ? { ...i, ...patch } : i);
    return;
  }
  const { error } = await db.from('invoices').update(patch).eq('id', id);
  if (error) throw error;
  localStore = localStore.map(i => i.id === id ? { ...i, ...patch } : i);
}

export async function sendInvoiceEmail(payload: {
  to: string;
  invoiceNumber: string;
  customerName?: string;
  pdfBase64: string;
}): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Not authenticated');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${WIRELESS_ADMIN_API}/send-invoice-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to send invoice email');
}

export async function deleteInvoice(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    localStore = localStore.filter(i => i.id !== id);
    return;
  }
  const { error } = await db.from('invoices').delete().eq('id', id);
  if (error) throw error;
  localStore = localStore.filter(i => i.id !== id);
}
