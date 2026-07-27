import { jsPDF, GState } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice } from '@/types/wireless';
import { loadWirelessLogo, fitLogoBox, fmtGHS, SERVICE_TERMS_URL } from '@/utils/pdfBranding';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface InvoiceBrandSettings {
  business_name?: string;
  tagline?: string;
  phone?: string;
  address?: string;
  logo_url?: string | null;
}

export interface InvoicePdfOptions {
  invoice: Invoice;
  items: InvoiceLineItem[];
  taxEnabled: boolean;
  vatRate: number;
  levyRate: number;
  settings?: InvoiceBrandSettings;
}

const PAGE_W = 210;
const MARGIN = 14;
const RIGHT_X = PAGE_W - MARGIN;

const fmt = fmtGHS;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

/** Draws a rotated "PAID" stamp (border box + text) centered at cx,cy. */
function drawPaidStamp(doc: jsPDF, cx: number, cy: number) {
  const angleDeg = -8;
  const rad = (angleDeg * Math.PI) / 180;
  const hw = 15, hh = 6;
  const corners: [number, number][] = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([dx, dy]) => [
    cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  ]);
  const deltas: [number, number][] = [];
  for (let i = 1; i < corners.length; i++) {
    deltas.push([corners[i][0] - corners[i - 1][0], corners[i][1] - corners[i - 1][1]]);
  }
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.8);
  doc.lines(deltas, corners[0][0], corners[0][1], [1, 1], 'S', true);
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PAID', cx, cy, { angle: angleDeg, align: 'center', baseline: 'middle' });
}

export async function buildInvoicePdf({ invoice, items, taxEnabled, vatRate, levyRate, settings }: InvoicePdfOptions): Promise<jsPDF> {
  const doc = new jsPDF();
  const isPaid = invoice.status === 'paid';
  const businessName = settings?.business_name?.trim() || 'Wireless';
  const tagline = settings?.tagline?.trim() || 'Repair & Service System';

  const subtotal = items.length ? items.reduce((s, i) => s + i.total_price, 0) : invoice.subtotal;
  const vat = taxEnabled ? Math.round(subtotal * (vatRate / 100) * 100) / 100 : 0;
  const levy = taxEnabled ? Math.round(subtotal * (levyRate / 100) * 100) / 100 : 0;
  const balanceDue = Math.max(0, invoice.total - invoice.amount_paid);

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

  // Watermark — drawn first so header/table content layers on top of it.
  if (logo) {
    const { w: wmW, h: wmH } = fitLogoBox(logoRatio, 140, 90);
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.06 }));
    doc.addImage(logo, logoType, (PAGE_W - wmW) / 2, (297 - wmH) / 2, wmW, wmH, undefined, undefined, -25);
    doc.restoreGraphicsState();
  }

  // ── Header: logo + business block (left), title + invoice # (right) ──
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

  if (isPaid) drawPaidStamp(doc, RIGHT_X - 24, 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30);
  doc.text(isPaid ? 'RECEIPT' : 'INVOICE', RIGHT_X, 26, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(136);
  doc.text(`# ${invoice.invoice_number}`, RIGHT_X, 32, { align: 'right' });
  if (invoice.payment_method) {
    doc.text(`Paid via ${invoice.payment_method}`, RIGHT_X, 37, { align: 'right' });
  }

  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 45, RIGHT_X, 45);

  // ── Middle: Bill To (left) + Date/Due/Balance meta box (right) ──
  let leftY = 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(136);
  doc.text('BILL TO', MARGIN, 48);
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(invoice.customer?.name || '—', MARGIN, leftY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(102);
  if (invoice.customer?.phone)   { leftY += 5; doc.text(invoice.customer.phone, MARGIN, leftY); }
  if (invoice.customer?.email)   { leftY += 5; doc.text(invoice.customer.email, MARGIN, leftY); }
  if (invoice.customer?.address) { leftY += 5; doc.text(invoice.customer.address, MARGIN, leftY); }

  const metaX = 126, metaW = RIGHT_X - 126, metaTop = 48;
  const metaRows: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'Date', value: fmtDate(invoice.created_at) },
  ];
  if (invoice.due_date) metaRows.push({ label: 'Due Date', value: fmtDate(invoice.due_date) });
  metaRows.push({ label: 'Balance Due', value: fmt(balanceDue), highlight: true });

  let metaY = metaTop;
  for (const row of metaRows) {
    const rh = row.highlight ? 9 : 7;
    if (row.highlight) { doc.setFillColor(235, 242, 250); doc.rect(metaX, metaY, metaW, rh, 'F'); }
    doc.setFont('helvetica', row.highlight ? 'bold' : 'normal');
    doc.setFontSize(row.highlight ? 9 : 8);
    doc.setTextColor(row.highlight ? 30 : 136);
    doc.text(row.label, metaX + 3, metaY + rh / 2 + 1.2);
    doc.setFont('helvetica', row.highlight ? 'bold' : 'normal');
    doc.setTextColor(30);
    doc.text(row.value, metaX + metaW - 3, metaY + rh / 2 + 1.2, { align: 'right' });
    metaY += rh;
  }
  doc.setDrawColor(216, 216, 216);
  doc.rect(metaX, metaTop, metaW, metaY - metaTop, 'S');
  let dividerY = metaTop;
  doc.setDrawColor(232, 232, 232);
  for (let i = 0; i < metaRows.length - 1; i++) {
    dividerY += metaRows[i].highlight ? 9 : 7;
    doc.line(metaX, dividerY, metaX + metaW, dividerY);
  }

  // ── Items table ──
  const itemsStartY = Math.max(leftY, metaY) + 8;
  autoTable(doc, {
    startY: itemsStartY,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: items.length
      ? items.map(i => [i.description, String(i.quantity), fmt(i.unit_price), fmt(i.total_price)])
      : [['No line items', '', '', '']],
    styles: { fontSize: 9, textColor: 30 },
    headStyles: { fillColor: [43, 43, 43], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: MARGIN, right: MARGIN },
  });

  // ── Totals ──
  let ty = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  const rows: [string, number][] = [['Subtotal', subtotal]];
  if (taxEnabled) rows.push([`VAT (${vatRate}%)`, vat], [`NHIL + GETFund (${levyRate}%)`, levy]);
  doc.setFontSize(9);
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(136);
    doc.text(label, 130, ty);
    doc.setTextColor(30);
    doc.text(fmt(value), RIGHT_X, ty, { align: 'right' });
    ty += 6;
  }
  doc.setDrawColor(204, 204, 204);
  doc.line(130, ty - 3, RIGHT_X, ty - 3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text('Total', 130, ty + 3);
  doc.text(fmt(invoice.total), RIGHT_X, ty + 3, { align: 'right' });
  ty += 12;

  if (invoice.amount_paid > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(136);
    doc.text('Amount Paid', 130, ty);
    doc.setTextColor(30);
    doc.text(fmt(invoice.amount_paid), RIGHT_X, ty, { align: 'right' });
    ty += 9;
    doc.setDrawColor(204, 204, 204);
    doc.line(130, ty - 3, RIGHT_X, ty - 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text('Balance Due', 130, ty + 3);
    doc.text(fmt(balanceDue), RIGHT_X, ty + 3, { align: 'right' });
    ty += 12;
  }

  // ── Notes ──
  let noteY = ty + 4;
  if (invoice.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(136);
    doc.text('Notes:', MARGIN, noteY);
    noteY += 5;
    doc.setFontSize(9.5);
    doc.setTextColor(68);
    const wrapped = doc.splitTextToSize(invoice.notes, RIGHT_X - MARGIN);
    doc.text(wrapped, MARGIN, noteY);
    noteY += wrapped.length * 4.5;
  }

  // ── Footer ──
  doc.setDrawColor(224, 224, 224);
  doc.line(MARGIN, noteY + 6, RIGHT_X, noteY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(153);
  const footerText = invoice.warranty && invoice.warranty_days
    ? `Thank you for choosing ${businessName}. This repair is covered by a ${invoice.warranty_days}-day warranty from the date of completion, covering the specific repair performed only, it does not cover physical damage, water damage, or unrelated issues.`
    : `Thank you for choosing ${businessName}.`;
  const footerWrapped = doc.splitTextToSize(footerText, RIGHT_X - MARGIN - 20);
  doc.text(footerWrapped, PAGE_W / 2, noteY + 12, { align: 'center' });

  // Repair-service terms (warranty, liability, payment) live on the
  // customer portal — distinct from that site's own terms for using the
  // tracking tool itself. Clickable in any PDF viewer that supports links.
  const linkY = noteY + 12 + footerWrapped.length * 3.8 + 5;
  doc.setTextColor(37, 99, 235);
  doc.textWithLink('Terms and Conditions', PAGE_W / 2, linkY, {
    url: SERVICE_TERMS_URL,
    align: 'center',
  });

  return doc;
}

export async function downloadInvoicePdf(opts: InvoicePdfOptions) {
  const doc = await buildInvoicePdf(opts);
  doc.save(`${opts.invoice.invoice_number}.pdf`);
}

/** Base64-encoded PDF payload (no data-URI prefix) for emailing as an attachment. */
export async function invoicePdfBase64(opts: InvoicePdfOptions): Promise<string> {
  const doc = await buildInvoicePdf(opts);
  return doc.output('datauristring').split(',')[1];
}
