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
  const { data, error } = await db.rpc('record_payment', {
    p_amount: input.amount,
    p_method: input.method,
    p_invoice_id: input.invoiceId ?? null,
    p_ticket_id: input.ticketId ?? null,
    p_customer_id: input.customerId ?? null,
    p_customer_name: input.customerName ?? '',
    p_reference: input.reference ?? null,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  return data as string;
}
