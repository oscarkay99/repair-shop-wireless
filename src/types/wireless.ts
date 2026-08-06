// ── TypeScript types for the wireless schema ──────────────────

import type { PaymentMethod } from '@/types/sale';

export type TechnicianStatus = 'available' | 'unavailable';
export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface WCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  ticket_count: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: string;
  profile_id?: string;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  status: TechnicianStatus;
  /** Date range while status is 'unavailable', ISO 'YYYY-MM-DD'. Both null/undefined once available again. */
  unavailable_from?: string | null;
  unavailable_until?: string | null;
  rating: number;
  total_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Part {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_cost: number;
  selling_price: number;
  stock: number;
  min_stock: number;
  /** Units known to be bad (customer return, DOA from supplier, pulled during
   *  a repair) — tracked separately from `stock` so a defective unit sitting
   *  on the shelf can't get mistaken for sellable/usable inventory. */
  defective_stock: number;
  supplier?: string;
  notes?: string;
  /** Which Apple product line this part is for (MacBook Air, iPhone, Apple
   *  Pencil, ...) — separate from `category` (the kind of part). */
  device?: string;
  /** Variant attributes for parts that come in multiple colors/sizes/model
   *  years (e.g. MacBook screens) — each distinct combination is its own
   *  part row so stock is tracked per variant, not lumped into one SKU. */
  color?: string;
  size?: string;
  model_year?: string;
  created_at: string;
  updated_at: string;
}

export interface AccessorySale {
  id: string;
  sale_number: string;
  customer_id?: string;
  customer_name: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: PaymentStatus;
  amount_paid: number;
  notes?: string;
  sold_by?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  part_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer?: WCustomer;
  ticket_id?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number;
  status: InvoiceStatus;
  payment_method?: PaymentMethod;
  due_date?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  /** Snapshotted at creation from the linked ticket/Settings, not a live join —
   *  so the invoice keeps showing the terms that applied when it was issued. */
  warranty: boolean;
  warranty_days?: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  invoice_id?: string;
  invoice?: Pick<Invoice, 'id' | 'invoice_number'>;
  ticket_id?: string;
  ticket?: { id: string; ticket_number: string };
  customer_id?: string;
  customer_name: string;
  reference?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface WirelessSettings {
  id: string;
  business_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  address: string;
  monthly_target: number;
  vat_rate: number;
  nhil_getfund_rate: number;
  currency: string;
  warranty_days: number;
  warranty_new_label: string;
  warranty_used_label: string;
  quote_validity_days: number;
  low_stock_threshold: number;
  repair_turnaround_target: string;
  default_delivery_fee: number;
  business_hours_mon_fri: string;
  business_hours_saturday: string;
  business_hours_sunday: string;
  primary_color: string;
  tax_enabled: boolean;
  logo_url?: string | null;
  logo_url_dark?: string | null;
  terms_and_conditions?: string;
  updated_at: string;
}
