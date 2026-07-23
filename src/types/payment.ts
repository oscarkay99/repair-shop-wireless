import type { PaymentMethod } from '@/types/sale';

export type TransactionStatus = 'verified' | 'pending' | 'needs_review' | 'failed';

export interface Transaction {
  id: string;
  sourceType: 'sale' | 'payment';
  customer: string;
  customerPhone: string | null;
  customerId: string | null;
  amountValue: number;
  amount: string;
  method: PaymentMethod;
  status: TransactionStatus;
  reference: string;
  date: string;
  product: string;
}

