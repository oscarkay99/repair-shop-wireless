import { jsPDF, GState } from 'jspdf';
import type { Repair } from '@/types/repair';
import { loadWirelessLogo, fmtGHS } from '@/utils/pdfBranding';

export interface ReceiptBrandSettings {
  business_name?: string;
  tagline?: string;
  phone?: string;
  address?: string;
}

export interface TicketReceiptPdfOptions {
  repair: Repair;
  warrantyDays?: number;
  settings?: ReceiptBrandSettings;
}

const PAGE_W = 210;
const MARGIN = 14;
const RIGHT_X = PAGE_W - MARGIN;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

/** Handed to the customer at pickup — separate from the Invoice (which is
 *  about billing): this is proof of what was done, when, and what warranty
 *  (if any) applies, regardless of whether an invoice was ever issued. */
export async function buildTicketReceiptPdf({ repair, warrantyDays, settings }: TicketReceiptPdfOptions): Promise<jsPDF> {
  const doc = new jsPDF();
  const businessName = settings?.business_name?.trim() || 'Wireless';
  const tagline = settings?.tagline?.trim() || 'Repair & Service System';

  let logo: string | null = null;
  try { logo = await loadWirelessLogo(); } catch { logo = null; }

  if (logo) {
    const wmW = 140;
    const wmH = wmW * (261 / 1280);
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.06 }));
    doc.addImage(logo, 'PNG', (PAGE_W - wmW) / 2, (297 - wmH) / 2, wmW, wmH, undefined, undefined, -25);
    doc.restoreGraphicsState();
  }

  // ── Header ──
  if (logo) doc.addImage(logo, 'PNG', MARGIN, 14, 32, 32 * (261 / 1280));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(businessName.toUpperCase(), MARGIN, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(136);
  let headerY = 30.5;
  doc.text(tagline, MARGIN, headerY);
  doc.setTextColor(153);
  doc.setFontSize(7.5);
  if (settings?.address) { headerY += 4; doc.text(settings.address, MARGIN, headerY); }
  if (settings?.phone) { headerY += 4; doc.text(settings.phone, MARGIN, headerY); }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30);
  doc.text('PICKUP RECEIPT', RIGHT_X, 26, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(136);
  doc.text(`# ${repair.id}`, RIGHT_X, 32, { align: 'right' });

  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 45, RIGHT_X, 45);

  // ── Customer + job details ──
  let leftY = 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(136);
  doc.text('CUSTOMER', MARGIN, 48);
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(repair.customer || '—', MARGIN, leftY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(102);
  if (repair.customerPhone) { leftY += 5; doc.text(repair.customerPhone, MARGIN, leftY); }
  if (repair.customerEmail) { leftY += 5; doc.text(repair.customerEmail, MARGIN, leftY); }

  const metaX = 126, metaW = RIGHT_X - 126, metaTop = 48;
  const metaRows: { label: string; value: string }[] = [
    { label: 'Device', value: repair.device || '—' },
    { label: 'Issue', value: repair.issue || '—' },
    { label: 'Technician', value: repair.technician || 'Unassigned' },
    { label: 'Completed', value: repair.completedDate ? fmtDate(repair.completedDate) : '—' },
    { label: 'Cost', value: repair.cost || 'TBD' },
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

  // ── Footer: warranty terms, same wording as the invoice ──
  const noteY = Math.max(leftY, metaY) + 20;
  doc.setDrawColor(224, 224, 224);
  doc.line(MARGIN, noteY, RIGHT_X, noteY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(153);
  const footerText = repair.warranty && warrantyDays
    ? `Thank you for choosing ${businessName}. This repair is covered by a ${warrantyDays}-day warranty from the date of completion, covering the specific repair performed only — it does not cover physical damage, water damage, or unrelated issues.`
    : `Thank you for choosing ${businessName}.`;
  const footerWrapped = doc.splitTextToSize(footerText, RIGHT_X - MARGIN - 20);
  doc.text(footerWrapped, PAGE_W / 2, noteY + 8, { align: 'center' });

  return doc;
}

export async function downloadTicketReceiptPdf(opts: TicketReceiptPdfOptions) {
  const doc = await buildTicketReceiptPdf(opts);
  doc.save(`${opts.repair.id}-receipt.pdf`);
}
