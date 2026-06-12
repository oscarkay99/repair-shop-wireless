import { useState, useEffect, useCallback } from 'react';
import { getInvoices, createInvoice, updateInvoiceStatus, deleteInvoice } from '@/services/wireless/invoices';
import type { Invoice, InvoiceStatus } from '@/types/wireless';
import { useToast } from '@/contexts/ToastContext';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try { setInvoices(await getInvoices()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add = async (...args: Parameters<typeof createInvoice>) => {
    const inv = await createInvoice(...args);
    setInvoices(prev => [inv, ...prev]);
    showToast('Invoice created');
    return inv;
  };

  const markStatus = async (id: string, status: InvoiceStatus, amountPaid?: number) => {
    await updateInvoiceStatus(id, status, amountPaid);
    setInvoices(prev => prev.map(i =>
      i.id === id ? { ...i, status, amount_paid: amountPaid ?? i.amount_paid } : i
    ));
    showToast(`Invoice marked ${status}`);
  };

  const remove = async (id: string) => {
    await deleteInvoice(id);
    setInvoices(prev => prev.filter(i => i.id !== id));
    showToast('Invoice deleted');
  };

  const totals = {
    total: invoices.reduce((s, i) => s + i.total, 0),
    collected: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount_paid, 0),
    outstanding: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + (i.total - i.amount_paid), 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0),
  };

  return { invoices, loading, reload, add, markStatus, remove, totals };
}
