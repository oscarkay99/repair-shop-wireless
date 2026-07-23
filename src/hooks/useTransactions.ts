import { useState, useEffect, useCallback } from 'react';
import { getSales, updateSalePaymentStatus, type AccessorySaleRecord } from '@/services/wireless/accessoryStore';
import { getPayments } from '@/services/wireless/payments';
import type { Transaction, TransactionStatus } from '@/types/payment';
import type { Payment } from '@/types/wireless';

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

function toTransaction(s: AccessorySaleRecord): { sortKey: number; txn: Transaction } {
  return {
    sortKey: new Date(s.sold_at).getTime(),
    txn: {
      id: s.id,
      sourceType: 'sale',
      customer: s.customer_name || 'Walk-in Customer',
      customerPhone: null,
      customerId: s.customer_id ?? null,
      amountValue: s.total,
      amount: `GH₵ ${s.total.toFixed(2)}`,
      method: s.payment_method === 'Transfer' ? 'Bank Transfer' : s.payment_method,
      status: STATUS_FROM_PAYMENT[s.payment_status] ?? 'pending',
      reference: s.sale_number,
      date: new Date(s.sold_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      product: `${s.product_name}${s.quantity > 1 ? ` ×${s.quantity}` : ''}`,
    },
  };
}

// Payments recorded through the ledger are confirmed at the moment of entry
// — there's no pending-review workflow for them like accessory sales have.
function toTransactionFromPayment(p: Payment): { sortKey: number; txn: Transaction } {
  const source = p.invoice ? `Invoice #${p.invoice.invoice_number}` : p.ticket ? `Ticket ${p.ticket.ticket_number}` : 'Standalone Payment';
  return {
    sortKey: new Date(p.created_at).getTime(),
    txn: {
      id: p.id,
      sourceType: 'payment',
      customer: p.customer_name || 'Walk-in Customer',
      customerPhone: null,
      customerId: p.customer_id ?? null,
      amountValue: p.amount,
      amount: `GH₵ ${p.amount.toFixed(2)}`,
      method: p.method,
      status: 'verified',
      reference: p.reference || p.invoice?.invoice_number || p.ticket?.ticket_number || p.id.slice(0, 8),
      date: new Date(p.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      product: source,
    },
  };
}

export function useTransactions() {
  const [sales, setSales] = useState<AccessorySaleRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [salesData, paymentsData] = await Promise.all([getSales(), getPayments()]);
      setSales(salesData);
      setPayments(paymentsData);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const verify = async (id: string, status: 'verified' | 'pending' | 'needs_review') => {
    if (!sales.some(s => s.id === id)) return; // ledger payments have no pending state to change
    const paymentStatus = PAYMENT_FROM_STATUS[status];
    await updateSalePaymentStatus(id, paymentStatus);
    setSales(prev => prev.map(s => s.id === id ? { ...s, payment_status: paymentStatus } : s));
  };

  const transactions = [...sales.map(toTransaction), ...payments.map(toTransactionFromPayment)]
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ txn }) => txn);

  return { transactions, loading, verify, reload };
}
