import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice } from '@/types/wireless';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface InvoicePdfOptions {
  invoice: Invoice;
  items: InvoiceLineItem[];
  taxEnabled: boolean;
  vatRate: number;
}

function fmt(n: number) {
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

export function buildInvoicePdf({ invoice, items, taxEnabled, vatRate }: InvoicePdfOptions): jsPDF {
  const doc = new jsPDF();
  const subtotal = items.length ? items.reduce((s, i) => s + i.total_price, 0) : invoice.subtotal;
  const vat = taxEnabled ? Math.round(subtotal * (vatRate / 100) * 100) / 100 : 0;
  const nhil = taxEnabled ? Math.round(subtotal * 0.025 * 100) / 100 : 0;
  const getfund = taxEnabled ? Math.round(subtotal * 0.025 * 100) / 100 : 0;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('WIRELESS', 14, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Repair & Service System', 14, 26);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoice_number, 196, 20, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(fmtDate(invoice.created_at), 196, 26, { align: 'right' });
  doc.text(`Status: ${invoice.status}${invoice.payment_method ? ` · ${invoice.payment_method}` : ''}`, 196, 31, { align: 'right' });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('BILL TO', 14, 42);
  doc.setFontSize(10);
  doc.setTextColor(20);
  let y = 48;
  if (invoice.customer) {
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customer.name, 14, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    if (invoice.customer.phone) { doc.text(invoice.customer.phone, 14, y); y += 5; }
    if (invoice.customer.email) { doc.text(invoice.customer.email, 14, y); y += 5; }
    if (invoice.customer.address) { doc.text(invoice.customer.address, 14, y); y += 5; }
  }

  autoTable(doc, {
    startY: y + 6,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: items.length
      ? items.map(i => [i.description, String(i.quantity), fmt(i.unit_price), fmt(i.total_price)])
      : [['No line items', '', '', '']],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [236, 1, 24] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  });

  const afterTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  const rows: [string, number][] = [['Subtotal', subtotal]];
  if (taxEnabled) {
    rows.push([`VAT (${vatRate}%)`, vat], ['NHIL (2.5%)', nhil], ['GETFUND (2.5%)', getfund]);
  }
  let ty = afterTableY;
  doc.setFontSize(9);
  for (const [label, value] of rows) {
    doc.setTextColor(100);
    doc.text(label, 150, ty);
    doc.setTextColor(20);
    doc.text(fmt(value), 196, ty, { align: 'right' });
    ty += 6;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total', 150, ty + 2);
  doc.text(fmt(invoice.total), 196, ty + 2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text('Thank you for choosing WIRELESS. All repairs are backed by a 90-day warranty.', 105, 285, { align: 'center' });

  return doc;
}

export function downloadInvoicePdf(opts: InvoicePdfOptions) {
  buildInvoicePdf(opts).save(`${opts.invoice.invoice_number}.pdf`);
}

/** Base64-encoded PDF payload (no data-URI prefix) for emailing as an attachment. */
export function invoicePdfBase64(opts: InvoicePdfOptions): string {
  return buildInvoicePdf(opts).output('datauristring').split(',')[1];
}
