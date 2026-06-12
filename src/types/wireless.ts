// ── TypeScript types for the wireless schema ──────────────────

export type TicketStatus = 'pending' | 'in_progress' | 'waiting_parts' | 'ready' | 'completed' | 'cancelled';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TechnicianStatus = 'available' | 'busy' | 'off_duty';
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
  supplier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer?: WCustomer;
  device: string;
  brand: string;
  model: string;
  serial_imei?: string;
  color?: string;
  issue: string;
  diagnosis?: string;
  status: TicketStatus;
  priority: TicketPriority;
  technician_id?: string;
  technician?: Technician;
  estimated_cost?: number;
  final_cost?: number;
  deposit_paid: number;
  warranty_days: number;
  received_at: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id?: string;
  author_name: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface TicketPart {
  id: string;
  ticket_id: string;
  part_id?: string;
  part?: Part;
  part_name: string;
  quantity: number;
  unit_cost: number;
  created_at: string;
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
  ticket_id?: string;
  ticket?: Pick<Ticket, 'ticket_number' | 'device' | 'issue'>;
  customer_id: string;
  customer?: WCustomer;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number;
  status: InvoiceStatus;
  due_date?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
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
  currency: string;
  warranty_days: number;
  updated_at: string;
}
