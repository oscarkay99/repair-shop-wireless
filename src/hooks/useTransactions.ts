import { useState, useEffect, useCallback } from 'react';
import { getSales, updateSalePaymentStatus, type AccessorySaleRecord } from '@/services/wireless/accessoryStore';
import type { Transaction, TransactionStatus } from '@/types/payment';

const STATUS_FROM_PAYMENT: Record<AccessorySaleRecord['payment_status'], TransactionStatus> = {
  paid: 'verified',
  partial: 'pending',
  unpaid: 'needs_review',
};
const PAYMENT_FROM_STATUS: Record<'verified' | 'pending' | 'needs_review', AccessorySaleRecord['payment_status']> = {
  verified: 'paid',
  pending: 'partial',
  needs_review: 'unpaid',
};

function toTransaction(s: AccessorySaleRecord): Transaction {
  return {
    id: s.id,
    customer: s.customer_name || 'Walk-in Customer',
    customerPhone: null,
    customerId: s.customer_id ?? null,
    amount: `GH₵ ${s.total.toFixed(2)}`,
    method: s.payment_method === 'Transfer' ? 'Bank Transfer' : s.payment_method,
    status: STATUS_FROM_PAYMENT[s.payment_status] ?? 'pending',
    reference: s.sale_number,
    date: new Date(s.sold_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    product: `${s.product_name}${s.quantity > 1 ? ` ×${s.quantity}` : ''}`,
  };
}

export function useTransactions() {
  const [sales, setSales] = useState<AccessorySaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try { setSales(await getSales()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const verify = async (id: string, status: 'verified' | 'pending' | 'needs_review') => {
    const paymentStatus = PAYMENT_FROM_STATUS[status];
    await updateSalePaymentStatus(id, paymentStatus);
    setSales(prev => prev.map(s => s.id === id ? { ...s, payment_status: paymentStatus } : s));
  };

  return { transactions: sales.map(toTransaction), loading, verify, reload };
}
