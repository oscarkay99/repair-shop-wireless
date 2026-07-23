import { isSupabaseConfigured, db } from '@/services/supabase';

export interface RefundRecord {
  id: string;
  source_type: 'sale' | 'payment';
  source_id: string;
  amount: number;
  customer_name: string | null;
  reference: string | null;
  reason: string | null;
  created_at: string;
}

export async function getRefundsForSources(sourceIds: string[]): Promise<RefundRecord[]> {
  if (!isSupabaseConfigured || sourceIds.length === 0) return [];
  const { data, error } = await db
    .from('refunds')
    .select('*')
    .in('source_id', sourceIds);
  if (error) throw error;
  return (data as RefundRecord[] | null) ?? [];
}

export async function issueRefund(input: {
  sourceType: 'sale' | 'payment';
  sourceId: string;
  amount: number;
  customerName?: string;
  reference?: string;
  reason?: string;
}): Promise<RefundRecord> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const { data, error } = await db
    .from('refunds')
    .insert({
      source_type: input.sourceType,
      source_id: input.sourceId,
      amount: input.amount,
      customer_name: input.customerName ?? null,
      reference: input.reference ?? null,
      reason: input.reason ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as RefundRecord;
}
