import { useEffect, useSyncExternalStore } from 'react';
import { getInvoices, createInvoice, patchInvoice, deleteInvoice } from '@/services/wireless/invoices';
import { recordPayment } from '@/services/wireless/payments';
import type { Invoice } from '@/types/wireless';
import type { PaymentMethod } from '@/types/sale';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

interface Store {
  invoices: Invoice[];
  loading: boolean;
}

let store: Store = { invoices: [], loading: true };
let started = false;
const listeners = new Set<() => void>();

function setStore(next: Partial<Store>) {
  store = { ...store, ...next };
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return store;
}

// Shared across every screen that reads invoices — including TopBar's
// global search (mounted once for the whole session) and Reception's own
// invoice-tab badge, which sits alongside a separately-mounted InvoicesPanel
// — instead of each mounting its own useState copy. Otherwise marking an
// invoice paid inside one already-mounted consumer left every other one
// (like that badge count) stale until a hard refresh. Mirrors the same fix
// applied to useWirelessSettings / useTechnicians / useRepairs / useInventory.
export async function reloadInvoices() {
  setStore({ loading: true });
  try {
    const invoices = await getInvoices();
    setStore({ invoices, loading: false });
  } catch (e) {
    setStore({ loading: false });
    throw e;
  }
}

export function useInvoices() {
  const { invoices, loading } = useSyncExternalStore(subscribe, getSnapshot);
  const { showToast } = useToast();

  useEffect(() => {
    if (!started) {
      started = true;
      reloadInvoices();
    }
  }, []);

  const add = async (...args: Parameters<typeof createInvoice>) => {
    try {
      const inv = await createInvoice(...args);
      setStore({ invoices: [inv, ...store.invoices] });
      showToast('Invoice created');
      return inv;
    } catch (e) {
      showToast(`Failed to create invoice: ${errMessage(e)}`, 'error');
      throw e;
    }
  };

  // Routes through the same payments ledger (record_payment RPC) as the Payments
  // page's Record Payment modal, so a "Mark Paid" click shows up in payment
  // history/revenue totals too, instead of only ever touching the invoice row.
  const markPaid = async (id: string, amount: number, method: PaymentMethod, customerName?: string) => {
    try {
      await recordPayment({ amount, method, invoiceId: id, customerName });
      setStore({
        invoices: store.invoices.map(i => {
          if (i.id !== id) return i;
          const amount_paid = i.amount_paid + amount;
          return { ...i, amount_paid, status: amount_paid >= i.total ? 'paid' : 'partial', payment_method: method };
        }),
      });
      showToast('Invoice marked paid');
    } catch (e) {
      showToast(`Failed to mark invoice paid: ${errMessage(e)}`, 'error');
      throw e;
    }
  };

  const patch = async (id: string, data: Parameters<typeof patchInvoice>[1]) => {
    try {
      await patchInvoice(id, data);
      setStore({ invoices: store.invoices.map(i => i.id === id ? { ...i, ...data } : i) });
      showToast('Invoice updated');
    } catch (e) {
      showToast(`Failed to update invoice: ${errMessage(e)}`, 'error');
      throw e;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteInvoice(id);
      setStore({ invoices: store.invoices.filter(i => i.id !== id) });
      showToast('Invoice deleted');
    } catch (e) {
      showToast(`Failed to delete invoice: ${errMessage(e)}`, 'error');
      throw e;
    }
  };

  const totals = {
    total: invoices.reduce((s, i) => s + i.total, 0),
    collected: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount_paid, 0),
    outstanding: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + (i.total - i.amount_paid), 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0),
  };

  return { invoices, loading, reload: reloadInvoices, add, markPaid, patch, remove, totals };
}
