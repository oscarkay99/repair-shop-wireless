import type { Repair } from '@/types/repair';
import { hasConfirmedDiagnosisPayment } from '@/services/repairs';
import {
  createInvoice, getInvoiceForTicket, getInvoiceItems,
  updateInvoiceAmounts, updateInvoiceItem,
} from '@/services/wireless/invoices';

export interface AutoInvoiceContext {
  depositPaid: number;
  taxEnabled: boolean;
  vatRate: number;
  nhilGetfundRate: number;
  warrantyDays?: number;
}

// Auto-invoices a ticket the moment it reaches a billable terminal state,
// replacing the old "staff remembers to click Create Invoice" flow. Idempotent
// by design (safe to call more than once for the same status) — it always
// checks for an existing invoice on the ticket first:
//   - none yet -> create one
//   - one exists -> re-total it (covers a diagnosis-only job that gets
//     reopened into a full repair later and reaches 'ready' a second time;
//     the customer gets one updated invoice, not a second bill)
export async function ensureTicketInvoice(repair: Repair, ctx: AutoInvoiceContext): Promise<string | null> {
  if (!repair.ticketDbId || !repair.customerId) return null;

  const isDiagnosisOnly = repair.status === 'diagnosis_only_closed';
  const isCancelled = repair.status === 'cancelled';
  const isReady = repair.status === 'ready';

  if (!isDiagnosisOnly && !isCancelled && !isReady) return null;
  // A cancelled job only gets invoiced if a diagnosis fee was actually paid —
  // nothing changed hands otherwise, so there's nothing to bill.
  if (isCancelled && !hasConfirmedDiagnosisPayment(repair)) return null;

  const subtotal = isDiagnosisOnly || isCancelled ? (repair.diagnosisFee ?? 0) : (repair.costNum ?? 0);
  if (subtotal <= 0) return null;

  const vat = ctx.taxEnabled ? Math.round(subtotal * (ctx.vatRate / 100) * 100) / 100 : 0;
  const levy = ctx.taxEnabled ? Math.round(subtotal * (ctx.nhilGetfundRate / 100) * 100) / 100 : 0;
  const tax = vat + levy;
  const total = subtotal + tax;
  const description = isDiagnosisOnly || isCancelled
    ? `Diagnosis fee — ${repair.device} — ${repair.issue}`
    : `${repair.device} — ${repair.issue}`;

  const existing = await getInvoiceForTicket(repair.ticketDbId);
  if (!existing) {
    const amountPaid = Math.min(ctx.depositPaid, total);
    const status = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';
    const inv = await createInvoice({
      customer_id: repair.customerId,
      ticket_id: repair.ticketDbId,
      subtotal,
      tax,
      discount: 0,
      total,
      amount_paid: amountPaid,
      status,
      notes: `Ticket ${repair.id}`,
      warranty: !isDiagnosisOnly && !isCancelled,
      warranty_days: ctx.warrantyDays,
    }, [
      { description, quantity: 1, unit_price: subtotal, total_price: subtotal },
    ]);
    return inv.invoice_number;
  }

  // Re-totaling an existing invoice (e.g. a diagnosis-only job reopened into
  // a full repair) must never touch amount_paid/status from here — a payment
  // may already have been recorded directly against this invoice through the
  // normal Payments flow, and overwriting it with the ticket-level deposit
  // figure would silently erase that.
  const status = existing.amount_paid >= total ? 'paid' : existing.amount_paid > 0 ? 'partial' : 'unpaid';
  await updateInvoiceAmounts(existing.id, { subtotal, tax, total, status });
  const items = await getInvoiceItems(existing.id);
  if (items.length > 0) {
    await updateInvoiceItem(items[0].id, { description, unit_price: subtotal, total_price: subtotal });
  }
  return existing.invoice_number;
}
