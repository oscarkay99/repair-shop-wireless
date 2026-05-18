export const paymentStats = {
  totalCollected: { value: 'GHS 84,320', change: '+12.4%' },
  pendingVerification: { value: 'GHS 12,450', count: 7 },
  outstandingBalance: { value: 'GHS 8,200', count: 4 },
  reconciliationQueue: { value: 3, label: 'items' },
};

export const transactions = [
  { id: 'TXN-001', customer: 'Kwame Asante', amount: 'GHS 8,200', method: 'MoMo', status: 'verified', reference: 'MM-2024-8821', date: 'Apr 22, 2026', product: 'iPhone 15 Pro Max' },
  { id: 'TXN-002', customer: 'Ama Owusu', amount: 'GHS 4,200', method: 'MoMo', status: 'pending', reference: 'MM-2024-8822', date: 'Apr 22, 2026', product: 'Samsung Galaxy S24' },
  { id: 'TXN-003', customer: 'Yaw Darko', amount: 'GHS 12,400', method: 'Bank Transfer', status: 'verified', reference: 'BT-2024-0091', date: 'Apr 21, 2026', product: 'MacBook Air M2' },
  { id: 'TXN-004', customer: 'Abena Frimpong', amount: 'GHS 1,600', method: 'Cash', status: 'verified', reference: 'CASH-0044', date: 'Apr 21, 2026', product: 'AirPods Pro 2' },
  { id: 'TXN-005', customer: 'Kofi Mensah', amount: 'GHS 3,500', method: 'MoMo', status: 'needs_review', reference: 'MM-2024-8819', date: 'Apr 20, 2026', product: 'iPad Pro 12.9"' },
  { id: 'TXN-006', customer: 'Akosua Boateng', amount: 'GHS 6,800', method: 'Card', status: 'verified', reference: 'CARD-2024-0012', date: 'Apr 20, 2026', product: 'Samsung Galaxy S24 Ultra' },
  { id: 'TXN-007', customer: 'Nana Adjei', amount: 'GHS 2,200', method: 'MoMo', status: 'failed', reference: 'MM-2024-8815', date: 'Apr 19, 2026', product: 'Apple Watch Series 9' },
  { id: 'TXN-008', customer: 'Efua Mensah', amount: 'GHS 9,800', method: 'Bank Transfer', status: 'pending', reference: 'BT-2024-0088', date: 'Apr 19, 2026', product: 'MacBook Pro 14"' },
];

export const verificationQueue = [
  { id: 'VQ-001', customer: 'Ama Owusu', amount: 'GHS 4,200', method: 'MoMo', reference: 'MM-2024-8822', proofNote: 'Screenshot submitted via WhatsApp', time: '2 hours ago' },
  { id: 'VQ-002', customer: 'Efua Mensah', amount: 'GHS 9,800', method: 'Bank Transfer', reference: 'BT-2024-0088', proofNote: 'Bank receipt uploaded', time: '4 hours ago' },
  { id: 'VQ-003', customer: 'Kofi Mensah', amount: 'GHS 3,500', method: 'MoMo', reference: 'MM-2024-8819', proofNote: 'Needs manual check — amount mismatch', time: '1 day ago' },
];
