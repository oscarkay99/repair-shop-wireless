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

// Auto-invoices a ticket the moment it has something billable, replacing the
// old "staff remembers to click Create Invoice" flow. Idempotent by design
// (safe to call more than once for the same status) — it always checks for
// an existing invoice on the ticket first:
//   - none yet -> create one
//   - one exists -> re-total it (covers a diagnosis fee invoiced at intake
//     that later grows into the full repair cost once the job reaches
//     'ready', or a diagnosis-only job reopened into a full repair; the
//     customer gets one updated invoice, not a second bill)
export async function ensureTicketInvoice(repair: Repair, ctx: AutoInvoiceContext): Promise<string | null> {
  if (!repair.ticketDbId || !repair.customerId) return null;

  const isDiagnosisOnly = repair.status === 'diagnosis_only_closed';
  const isCancelled = repair.status === 'cancelled';
  const isReady = repair.status === 'ready';
  const isAtIntake = !isDiagnosisOnly && !isCancelled && !isReady;
  // A diagnosis fee is charged and paid the moment the ticket is created —
  // invoice it immediately rather than waiting for the job to reach a
  // terminal state, so there's always an invoice to track the ticket by
  // from day one, not just ones that eventually reach Ready.
  const isAtIntakeWithPaidDiagnosis = isAtIntake && hasConfirmedDiagnosisPayment(repair);
  // Straight repair never has a diagnosis fee (no diagnosis stage at all) —
  // nothing's actually been paid yet, but it still gets an unpaid invoice
  // for the quoted cost immediately, same tracking-from-day-one reasoning.
  const isAtIntakeStraightRepair = isAtIntake && repair.jobType === 'straight_repair';

  if (!isDiagnosisOnly && !isCancelled && !isReady && !isAtIntakeWithPaidDiagnosis && !isAtIntakeStraightRepair) return null;
  // A cancelled job only gets invoiced if a diagnosis fee was actually paid —
  // nothing changed hands otherwise, so there's nothing to bill.
  if (isCancelled && !hasConfirmedDiagnosisPayment(repair)) return null;

  // Everything except the finished repair (or a straight repair, which has
  // no separate diagnosis fee to bill instead) bills just the diagnosis fee.
  const billDiagnosisFeeOnly = !isReady && !isAtIntakeStraightRepair;
  const subtotal = billDiagnosisFeeOnly ? (repair.diagnosisFee ?? 0) : (repair.costNum ?? 0);
  if (subtotal <= 0) return null;

  const vat = ctx.taxEnabled ? Math.round(subtotal * (ctx.vatRate / 100) * 100) / 100 : 0;
  const levy = ctx.taxEnabled ? Math.round(subtotal * (ctx.nhilGetfundRate / 100) * 100) / 100 : 0;
  const tax = vat + levy;
  const total = subtotal + tax;
  const description = billDiagnosisFeeOnly
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
      warranty: isReady, // only the finished repair itself carries warranty
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
