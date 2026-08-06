import { isSupabaseConfigured, db } from '@/services/supabase';
import type { Payment } from '@/types/wireless';
import type { PaymentMethod } from '@/types/sale';

export async function getPayments(): Promise<Payment[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db
    .from('payments')
    .select('*, invoice:invoices(id,invoice_number), ticket:tickets(id,ticket_number)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Payment[] | null) ?? [];
}

/** Payments recorded directly against a ticket (e.g. a deposit paid before work begins). */
export async function getPaymentsForTicket(ticketId: string): Promise<Payment[]> {
  if (!isSupabaseConfigured || !ticketId) return [];
  const { data, error } = await db
    .from('payments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Payment[] | null) ?? [];
}

/** Every payment recorded against one invoice — a partial payment made in
 *  three installments shows up here as three rows, oldest first, each
 *  individually receipt-able. */
export async function getPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
  if (!isSupabaseConfigured || !invoiceId) return [];
  const { data, error } = await db
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as Payment[] | null) ?? [];
}

/**
 * Payments joined down to the technician(s) assigned on their ticket, for
 * per-technician revenue rollups. A payment tied to a multi-technician
 * ticket contributes to each assignee — same "everyone assigned shares the
 * credit" convention already used for job/workload counts on the
 * Technicians page.
 */
export async function getPaymentsWithTechnicians(): Promise<{ amount: number; created_at: string; technicianIds: string[] }[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db
    .from('payments')
    .select('amount, created_at, ticket:tickets(ticket_technicians(technician_id))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as { amount: number; created_at: string; ticket: { ticket_technicians: { technician_id: string }[] } | null }[])
    .map(p => ({
      amount: p.amount,
      created_at: p.created_at,
      technicianIds: p.ticket?.ticket_technicians?.map(tt => tt.technician_id) ?? [],
    }));
}

export async function recordPayment(input: {
  amount: number;
  method: PaymentMethod;
  invoiceId?: string;
  ticketId?: string;
  customerId?: string;
  customerName?: string;
  reference?: string;
  notes?: string;
}): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  // A fresh token per call — split payments intentionally share every other
  // field (amount, method, reference) across calls in the same submission,
  // so the server can no longer tell those apart from a duplicate retry by
  // field-matching alone. This is the actual identity of "this one call."
  const { data, error } = await db.rpc('record_payment', {
    p_amount: input.amount,
    p_method: input.method,
    p_invoice_id: input.invoiceId ?? null,
    p_ticket_id: input.ticketId ?? null,
    p_customer_id: input.customerId ?? null,
    p_customer_name: input.customerName ?? '',
    p_reference: input.reference ?? null,
    p_notes: input.notes ?? null,
    p_client_token: crypto.randomUUID(),
  });
  if (error) throw error;
  return data as string;
}
