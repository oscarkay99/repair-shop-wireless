import { jsPDF, GState } from 'jspdf';
import type { Payment } from '@/types/wireless';
import { loadWirelessLogo, fitLogoBox, fmtGHS, SERVICE_TERMS_URL } from '@/utils/pdfBranding';

export interface PaymentReceiptBrandSettings {
  business_name?: string;
  tagline?: string;
  phone?: string;
  address?: string;
  logo_url?: string | null;
}

export interface PaymentReceiptPdfOptions {
  payment: Payment;
  settings?: PaymentReceiptBrandSettings;
  /** Only meaningful for an invoice-linked payment — omit for a ticket
   *  deposit or standalone payment, which has no running balance to show. */
  invoiceContext?: { total: number; paidAfterThisPayment: number };
}

const PAGE_W = 210;
const MARGIN = 14;
const RIGHT_X = PAGE_W - MARGIN;

const fmt = fmtGHS;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// One partial payment out of possibly several against the same invoice —
// requested during training so a customer paying in installments gets a
// receipt for each installment, not just the one invoice PDF at the end.
export async function buildPaymentReceiptPdf({ payment, settings, invoiceContext }: PaymentReceiptPdfOptions): Promise<jsPDF> {
  const doc = new jsPDF();
  const businessName = settings?.business_name?.trim() || 'Wireless';
  const tagline = settings?.tagline?.trim() || 'Repair & Service System';

  let logo: string | null = null;
  let logoRatio = 261 / 1280;
  let logoType: string = 'PNG';
  try {
    logo = await loadWirelessLogo(settings?.logo_url);
    const props = doc.getImageProperties(logo);
    logoRatio = props.height / props.width;
    logoType = props.fileType;
  } catch { logo = null; }

  if (logo) {
    const { w: wmW, h: wmH } = fitLogoBox(logoRatio, 140, 90);
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.06 }));
    doc.addImage(logo, logoType, (PAGE_W - wmW) / 2, (297 - wmH) / 2, wmW, wmH, undefined, undefined, -25);
    doc.restoreGraphicsState();
  }

  // ── Header ──
  if (logo) {
    const { w: hdrW, h: hdrH } = fitLogoBox(logoRatio, 32, 12);
    doc.addImage(logo, logoType, MARGIN, 14, hdrW, hdrH);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(136);
  let headerY = 24;
  doc.text(tagline, MARGIN, headerY);
  doc.setTextColor(153);
  doc.setFontSize(7.5);
  if (settings?.address) { headerY += 4; doc.text(settings.address, MARGIN, headerY); }
  if (settings?.phone) { headerY += 4; doc.text(settings.phone, MARGIN, headerY); }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30);
  doc.text('PAYMENT RECEIPT', RIGHT_X, 26, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(136);
  const linkedNumber = payment.invoice?.invoice_number ?? payment.ticket?.ticket_number;
  if (linkedNumber) doc.text(`For ${payment.invoice ? 'Invoice' : 'Ticket'} # ${linkedNumber}`, RIGHT_X, 32, { align: 'right' });
  doc.text(`Paid via ${payment.method}`, RIGHT_X, 37, { align: 'right' });

  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 45, RIGHT_X, 45);

  // ── Customer + payment meta ──
  let leftY = 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(136);
  doc.text('CUSTOMER', MARGIN, 48);
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(payment.customer_name || 'Walk-in Customer', MARGIN, leftY);

  const metaX = 126, metaW = RIGHT_X - 126, metaTop = 48;
  const metaRows: { label: string; value: string }[] = [
    { label: 'Date', value: fmtDate(payment.created_at) },
    ...(payment.reference ? [{ label: 'Reference', value: payment.reference }] : []),
  ];
  let metaY = metaTop;
  for (const row of metaRows) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(136);
    doc.text(row.label, metaX + 3, metaY + 4.7);
    doc.setTextColor(30);
    doc.text(row.value, metaX + metaW - 3, metaY + 4.7, { align: 'right' });
    metaY += 7;
  }
  doc.setDrawColor(216, 216, 216);
  doc.rect(metaX, metaTop, metaW, metaY - metaTop, 'S');
  let dividerY = metaTop;
  doc.setDrawColor(232, 232, 232);
  for (let i = 0; i < metaRows.length - 1; i++) {
    dividerY += 7;
    doc.line(metaX, dividerY, metaX + metaW, dividerY);
  }

  // ── Amount ──
  const amtTop = Math.max(leftY, metaY) + 12;
  doc.setDrawColor(43, 43, 43);
  doc.setFillColor(43, 43, 43);
  doc.rect(MARGIN, amtTop, RIGHT_X - MARGIN, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255);
  doc.text('Amount Received', MARGIN + 3, amtTop + 5.5);

  const rowY = amtTop + 8;
  doc.setFillColor(250, 250, 250);
  doc.rect(MARGIN, rowY, RIGHT_X - MARGIN, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text(fmt(payment.amount), MARGIN + 3, rowY + 8);
  doc.setDrawColor(216, 216, 216);
  doc.rect(MARGIN, amtTop, RIGHT_X - MARGIN, 20, 'S');

  // ── Running balance (invoice-linked payments only) ──
  let ty = rowY + 12 + 12;
  if (invoiceContext) {
    const remaining = Math.max(0, invoiceContext.total - invoiceContext.paidAfterThisPayment);
    doc.setDrawColor(204, 204, 204);
    doc.line(MARGIN, ty - 9, RIGHT_X, ty - 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text('Invoice Total', MARGIN, ty - 3);
    doc.text(fmt(invoiceContext.total), RIGHT_X, ty - 3, { align: 'right' });
    ty += 6;
    doc.text('Paid to Date', MARGIN, ty - 3);
    doc.text(fmt(invoiceContext.paidAfterThisPayment), RIGHT_X, ty - 3, { align: 'right' });
    ty += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(remaining > 0 ? 200 : 34, remaining > 0 ? 100 : 150, remaining > 0 ? 40 : 60);
    doc.text(remaining > 0 ? 'Balance Remaining' : 'Paid in Full', MARGIN, ty - 3);
    if (remaining > 0) doc.text(fmt(remaining), RIGHT_X, ty - 3, { align: 'right' });
    ty += 10;
  }

  // ── Footer ──
  const noteY = ty + 4;
  doc.setDrawColor(224, 224, 224);
  doc.line(MARGIN, noteY, RIGHT_X, noteY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(153);
  doc.text(`Thank you for choosing ${businessName}.`, PAGE_W / 2, noteY + 8, { align: 'center' });

  doc.setTextColor(37, 99, 235);
  doc.textWithLink('Terms and Conditions', PAGE_W / 2, noteY + 16, {
    url: SERVICE_TERMS_URL,
    align: 'center',
  });

  return doc;
}

export async function downloadPaymentReceiptPdf(opts: PaymentReceiptPdfOptions) {
  const doc = await buildPaymentReceiptPdf(opts);
  const label = opts.payment.invoice?.invoice_number ?? opts.payment.ticket?.ticket_number ?? opts.payment.id.slice(0, 8);
  doc.save(`${label}-payment-${new Date(opts.payment.created_at).toISOString().slice(0, 10)}.pdf`);
}
