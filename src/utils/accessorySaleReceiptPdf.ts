import { jsPDF, GState } from 'jspdf';
import type { AccessorySaleRecord } from '@/services/wireless/accessoryStore';
import { loadWirelessLogo, fitLogoBox, fmtGHS, SERVICE_TERMS_URL, loadTrackerQrCode, trackerUrlFor } from '@/utils/pdfBranding';

export interface AccessoryReceiptBrandSettings {
  business_name?: string;
  tagline?: string;
  phone?: string;
  address?: string;
  logo_url?: string | null;
}

export interface AccessorySaleReceiptPdfOptions {
  sale: AccessorySaleRecord;
  settings?: AccessoryReceiptBrandSettings;
}

const PAGE_W = 210;
const MARGIN = 14;
const RIGHT_X = PAGE_W - MARGIN;

const fmt = fmtGHS;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Handed to the customer at the point of sale — a single accessory line
 *  item, so unlike the multi-item invoice this skips the items table in
 *  favor of a simpler line-by-line layout matching the ticket receipt. */
export async function buildAccessorySaleReceiptPdf({ sale, settings }: AccessorySaleReceiptPdfOptions): Promise<jsPDF> {
  const doc = new jsPDF();
  const businessName = settings?.business_name?.trim() || 'Wireless';
  const tagline = settings?.tagline?.trim() || 'Repair & Service System';

  let logo: string | null = null;
  let logoRatio = 261 / 1280; // fallback: the bundled logo's own aspect ratio
  let logoType: string = 'PNG';
  try {
    logo = await loadWirelessLogo(settings?.logo_url);
    const props = doc.getImageProperties(logo);
    logoRatio = props.height / props.width;
    logoType = props.fileType;
  } catch { logo = null; }

  let trackerQr: string | null = null;
  try { trackerQr = await loadTrackerQrCode(trackerUrlFor()); } catch { trackerQr = null; }

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
  doc.text('SALE RECEIPT', RIGHT_X, 26, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(136);
  doc.text(`# ${sale.sale_number}`, RIGHT_X, 32, { align: 'right' });
  doc.text(`Paid via ${sale.payment_method}`, RIGHT_X, 37, { align: 'right' });

  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 45, RIGHT_X, 45);

  // ── Customer + sale meta ──
  let leftY = 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(136);
  doc.text('CUSTOMER', MARGIN, 48);
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(sale.customer_name || 'Walk-in Customer', MARGIN, leftY);

  const metaX = 126, metaW = RIGHT_X - 126, metaTop = 48;
  const metaRows: { label: string; value: string }[] = [
    { label: 'Date', value: fmtDate(sale.sold_at) },
    { label: 'Payment Status', value: sale.payment_status.charAt(0).toUpperCase() + sale.payment_status.slice(1) },
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

  // ── Item line ──
  const itemTop = Math.max(leftY, metaY) + 12;
  doc.setDrawColor(43, 43, 43);
  doc.setFillColor(43, 43, 43);
  doc.rect(MARGIN, itemTop, RIGHT_X - MARGIN, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255);
  doc.text('Item', MARGIN + 3, itemTop + 5.5);
  doc.text('Qty', 140, itemTop + 5.5, { align: 'center' });
  doc.text('Unit Price', 168, itemTop + 5.5, { align: 'right' });
  doc.text('Total', RIGHT_X - 3, itemTop + 5.5, { align: 'right' });

  const rowY = itemTop + 8;
  doc.setFillColor(250, 250, 250);
  doc.rect(MARGIN, rowY, RIGHT_X - MARGIN, 10, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30);
  doc.text(sale.product_name, MARGIN + 3, rowY + 6.5);
  doc.text(String(sale.quantity), 140, rowY + 6.5, { align: 'center' });
  doc.text(fmt(sale.unit_price), 168, rowY + 6.5, { align: 'right' });
  doc.text(fmt(sale.total), RIGHT_X - 3, rowY + 6.5, { align: 'right' });
  doc.setDrawColor(216, 216, 216);
  doc.rect(MARGIN, itemTop, RIGHT_X - MARGIN, 18, 'S');

  // ── Total ──
  let ty = rowY + 10 + 12;
  doc.setDrawColor(204, 204, 204);
  doc.line(130, ty - 9, RIGHT_X, ty - 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text('Total', 130, ty - 3);
  doc.text(fmt(sale.total), RIGHT_X, ty - 3, { align: 'right' });

  // ── Footer ──
  const noteY = ty + 12;
  doc.setDrawColor(224, 224, 224);
  doc.line(MARGIN, noteY, RIGHT_X, noteY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(153);
  const footerText = `Thank you for choosing ${businessName}.`;
  doc.text(footerText, PAGE_W / 2, noteY + 8, { align: 'center' });

  doc.setTextColor(37, 99, 235);
  doc.textWithLink('Terms and Conditions', PAGE_W / 2, noteY + 16, {
    url: SERVICE_TERMS_URL,
    align: 'center',
  });

  if (trackerQr) {
    const qrSize = 15;
    const qrX = RIGHT_X - qrSize;
    const qrY = noteY + 16 - qrSize + 2;
    doc.addImage(trackerQr, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(140);
    doc.text('Scan to track', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
  }

  return doc;
}

export async function downloadAccessorySaleReceiptPdf(opts: AccessorySaleReceiptPdfOptions) {
  const doc = await buildAccessorySaleReceiptPdf(opts);
  doc.save(`${opts.sale.sale_number}-receipt.pdf`);
}
