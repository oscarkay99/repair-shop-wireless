export const warranties = [
  { id: 'W001', customer: 'Kwame Asante', phone: '+233 24 123 4567', device: 'iPhone 15 Pro 256GB', imei: '352099001761481', purchaseDate: 'Jan 15, 2026', expiryDate: 'Jan 15, 2027', type: 'New', duration: '12 months', status: 'active', daysLeft: 267, saleId: 'S-2026-001', cost: 12500 },
  { id: 'W002', customer: 'Ama Owusu', phone: '+233 20 987 6543', device: 'Samsung S24 Ultra 256GB', imei: '352099001761482', purchaseDate: 'Feb 10, 2026', expiryDate: 'Feb 10, 2027', type: 'New', duration: '12 months', status: 'active', daysLeft: 293, saleId: 'S-2026-018', cost: 12800 },
  { id: 'W003', customer: 'Kofi Mensah', phone: '+233 24 777 8888', device: 'iPhone 14 128GB', imei: '352099001761483', purchaseDate: 'Oct 5, 2025', expiryDate: 'Jan 5, 2026', type: 'Used', duration: '3 months', status: 'expired', daysLeft: 0, saleId: 'S-2025-089', cost: 7200 },
  { id: 'W004', customer: 'Yaw Darko', phone: '+233 54 456 7890', device: 'Google Pixel 8 Pro', imei: '352099001761484', purchaseDate: 'Mar 20, 2026', expiryDate: 'Jun 20, 2026', type: 'Used', duration: '3 months', status: 'expiring_soon', daysLeft: 58, saleId: 'S-2026-034', cost: 8900 },
  { id: 'W005', customer: 'Abena Frimpong', phone: '+233 27 333 4444', device: 'Redmi Note 13 Pro', imei: '352099001761485', purchaseDate: 'Apr 20, 2026', expiryDate: 'Apr 20, 2027', type: 'New', duration: '12 months', status: 'active', daysLeft: 362, saleId: 'S-2026-067', cost: 2800 },
  { id: 'W006', customer: 'Akosua Boateng', phone: '+233 20 555 6666', device: 'Samsung A55 5G', imei: '352099001761486', purchaseDate: 'Jan 30, 2026', expiryDate: 'Apr 30, 2026', type: 'New', duration: '3 months', status: 'expiring_soon', daysLeft: 7, saleId: 'S-2026-012', cost: 3400 },
];

export const returns = [
  { id: 'RET-001', customer: 'Nana Adjei', phone: '+233 54 222 3333', device: 'iPhone 13 128GB', reason: 'Screen flickering after 2 weeks', requestDate: 'Apr 20, 2026', status: 'approved', resolution: 'Exchange', refundAmount: 0, warrantyId: 'W-OLD-012' },
  { id: 'RET-002', customer: 'Efua Mensah', phone: '+233 27 999 0000', device: 'Samsung S23 FE', reason: 'Battery draining too fast', requestDate: 'Apr 18, 2026', status: 'pending', resolution: 'Under Review', refundAmount: 0, warrantyId: 'W-OLD-008' },
  { id: 'RET-003', customer: 'Daniel Osei', phone: '+233 24 888 9999', device: 'Redmi Note 12', reason: 'Customer changed mind', requestDate: 'Apr 15, 2026', status: 'rejected', resolution: 'No warranty coverage for change of mind', refundAmount: 0, warrantyId: null },
  { id: 'RET-004', customer: 'Sarah Mensah', phone: '+233 20 111 2222', device: 'iPhone 14 Pro', reason: 'Speaker not working', requestDate: 'Apr 10, 2026', status: 'completed', resolution: 'Full Refund', refundAmount: 9800, warrantyId: 'W-OLD-005' },
];

export const warrantyStats = {
  totalActive: 234,
  expiringSoon: 18,
  expired: 89,
  totalReturns: 12,
  pendingReturns: 3,
  refundsThisMonth: 2,
  refundValue: 19600,
};