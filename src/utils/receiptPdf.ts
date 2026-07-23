import { jsPDF, GState } from 'jspdf';
import type { Transaction } from '@/types/payment';
import { loadWirelessLogo } from '@/utils/pdfBranding';

const PAGE_W = 210;
const MARGIN = 14;
const RIGHT_X = PAGE_W - MARGIN;

async function buildReceiptPdf(txn: Transaction): Promise<jsPDF> {
  const doc = new jsPDF();

  let logo: string | null = null;
  try { logo = await loadWirelessLogo(); } catch { logo = null; }

  if (logo) {
    const wmW = 120;
    const wmH = wmW * (261 / 1280);
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.06 }));
    doc.addImage(logo, 'PNG', (PAGE_W - wmW) / 2, 110, wmW, wmH, undefined, undefined, -25);
    doc.restoreGraphicsState();
  }

  if (logo) doc.addImage(logo, 'PNG', MARGIN, 14, 32, 32 * (261 / 1280));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text('WIRELESS', MARGIN, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(136);
  doc.text('Repair & Service System', MARGIN, 30.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30);
  doc.text('RECEIPT', RIGHT_X, 26, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(136);
  doc.text(`# ${txn.id}`, RIGHT_X, 32, { align: 'right' });

  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 42, RIGHT_X, 42);

  const rows: [string, string][] = [
    ['Customer', txn.customer],
    ['Description', txn.product],
    ['Payment Method', txn.method],
    ['Reference', txn.reference],
    ['Date', txn.date],
  ];
  let y = 54;
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(136);
    doc.text(label, MARGIN, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30);
    doc.text(value, RIGHT_X, y, { align: 'right' });
    y += 8;
  }

  y += 4;
  doc.setDrawColor(204, 204, 204);
  doc.line(MARGIN, y, RIGHT_X, y);
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text('Total Paid', MARGIN, y);
  doc.text(txn.amount, RIGHT_X, y, { align: 'right' });

  doc.setDrawColor(224, 224, 224);
  doc.line(MARGIN, y + 14, RIGHT_X, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(153);
  doc.text('Thank you for choosing Wireless.', PAGE_W / 2, y + 20, { align: 'center' });

  return doc;
}

/** Opens the receipt in a new tab and triggers the browser's print dialog. */
export async function printReceipt(txn: Transaction) {
  const doc = await buildReceiptPdf(txn);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}
