import { jsPDF, GState } from 'jspdf';
import type { Repair } from '@/types/repair';
import { loadWirelessLogo, fitLogoBox, fmtGHS, SERVICE_TERMS_URL, loadTrackerQrCode, trackerUrlFor } from '@/utils/pdfBranding';

export interface ReceiptBrandSettings {
  business_name?: string;
  tagline?: string;
  phone?: string;
  address?: string;
  logo_url?: string | null;
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

// All assignees are equal — no "primary" to print alone — but the meta
// column here is a fixed, right-aligned width with no wrapping, so more than
// two names would visibly clip. Truncates the same way the Kanban card does.
function fmtTechnicians(technicians: Repair['technicians']): string {
  if (!technicians.length) return 'Unassigned';
  if (technicians.length <= 2) return technicians.map(t => t.name).join(', ');
  return `${technicians.slice(0, 2).map(t => t.name).join(', ')} +${technicians.length - 2}`;
}

/** Handed to the customer at pickup — separate from the Invoice (which is
 *  about billing): this is proof of what was done, when, and what warranty
 *  (if any) applies, regardless of whether an invoice was ever issued. */
export async function buildTicketReceiptPdf({ repair, warrantyDays, settings }: TicketReceiptPdfOptions): Promise<jsPDF> {
  const doc = new jsPDF();
  const businessName = settings?.business_name?.trim() || 'Wireless';
  const tagline = settings?.tagline?.trim() || 'Repair & Service System';

  let logo: string | null = null;
  let logoRatio = 261 / 1280; // fallback: the bundled logo's own aspect ratio
  let logoType: string = 'PNG';
  try {
    logo = await loadWirelessLogo(settings?.logo_url);
    // Computed from the actual loaded image (default or an uploaded custom
    // logo) rather than assumed, so a differently-shaped upload doesn't get
    // stretched to the bundled logo's proportions.
    const props = doc.getImageProperties(logo);
    logoRatio = props.height / props.width;
    logoType = props.fileType;
  } catch { logo = null; }

  let trackerQr: string | null = null;
  try { trackerQr = await loadTrackerQrCode(trackerUrlFor(repair.publicToken)); } catch { trackerQr = null; }

  if (logo) {
    const { w: wmW, h: wmH } = fitLogoBox(logoRatio, 140, 90);
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.06 }));
    doc.addImage(logo, logoType, (PAGE_W - wmW) / 2, (297 - wmH) / 2, wmW, wmH, undefined, undefined, -25);
    doc.restoreGraphicsState();
  }

  // ── Header ──
  // The logo image already carries the business name — a redundant text
  // heading next to it just repeated it. Fit within a fixed box (like
  // object-fit: contain) so a custom logo of any shape lines up the same.
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
    { label: repair.technicians.length > 1 ? 'Technicians' : 'Technician', value: fmtTechnicians(repair.technicians) },
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
  // Every repair carries the shop's standard warranty — not conditional on
  // the ticket's own "Under Warranty" checkbox, just on a period actually
  // being configured in Settings.
  const footerText = warrantyDays
    ? `Thank you for choosing ${businessName}. This repair is covered by a ${warrantyDays}-day warranty from the date of completion, covering the specific repair performed only, it does not cover physical damage, water damage, or unrelated issues.`
    : `Thank you for choosing ${businessName}.`;
  const footerWrapped = doc.splitTextToSize(footerText, RIGHT_X - MARGIN - 20);
  doc.text(footerWrapped, PAGE_W / 2, noteY + 8, { align: 'center' });

  // Repair-service terms (warranty, liability, payment) live on the
  // customer portal — distinct from that site's own terms for using the
  // tracking tool itself. Clickable in any PDF viewer that supports links.
  const linkY = noteY + 8 + footerWrapped.length * 3.8 + 5;
  doc.setTextColor(37, 99, 235);
  doc.textWithLink('Terms and Conditions', PAGE_W / 2, linkY, {
    url: SERVICE_TERMS_URL,
    align: 'center',
  });

  // Scannable shortcut to the tracker site — sits beside the terms link
  // rather than below it, so it doesn't push the page any taller.
  if (trackerQr) {
    const qrSize = 15;
    const qrX = RIGHT_X - qrSize;
    const qrY = linkY - qrSize + 2;
    doc.addImage(trackerQr, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(140);
    doc.text('Scan to track', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
  }

  return doc;
}

export async function downloadTicketReceiptPdf(opts: TicketReceiptPdfOptions) {
  const doc = await buildTicketReceiptPdf(opts);
  doc.save(`${opts.repair.id}-receipt.pdf`);
}
