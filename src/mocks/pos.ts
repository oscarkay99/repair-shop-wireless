export interface PosProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  type: 'phone' | 'tablet' | 'laptop' | 'audio' | 'accessory' | 'wearable';
  imei?: boolean;
  brand: string;
}

export interface PosCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  totalSpent: number;
  purchaseCount: number;
  lastPurchase: string;
  openRepairs: number;
  tags: string[];
}

export const posProducts: PosProduct[] = [
  { id: 'p1', name: 'iPhone 15 Pro 256GB', sku: 'APL-IP15P-256', price: 12500, cost: 10200, stock: 4, category: 'Apple', brand: 'Apple', type: 'phone', imei: true },
  { id: 'p2', name: 'Samsung S24 Ultra 256GB', sku: 'SAM-S24U-256', price: 12800, cost: 10400, stock: 3, category: 'Samsung', brand: 'Samsung', type: 'phone', imei: true },
  { id: 'p3', name: 'iPhone 14 128GB', sku: 'APL-IP14-128', price: 8200, cost: 6600, stock: 6, category: 'Apple', brand: 'Apple', type: 'phone', imei: true },
  { id: 'p4', name: 'Redmi Note 13 Pro 256GB', sku: 'XMI-RN13P-256', price: 2800, cost: 2100, stock: 12, category: 'Xiaomi', brand: 'Xiaomi', type: 'phone', imei: true },
  { id: 'p5', name: 'Samsung A55 5G 128GB', sku: 'SAM-A55-128', price: 3400, cost: 2650, stock: 8, category: 'Samsung', brand: 'Samsung', type: 'phone', imei: true },
  { id: 'p6', name: 'Google Pixel 8 Pro 256GB', sku: 'GOO-PX8P-256', price: 9800, cost: 7900, stock: 2, category: 'Google', brand: 'Google', type: 'phone', imei: true },
  { id: 'p7', name: 'iPhone 15 128GB', sku: 'APL-IP15-128', price: 10200, cost: 8300, stock: 5, category: 'Apple', brand: 'Apple', type: 'phone', imei: true },
  { id: 'p8', name: 'Tecno Camon 30 Pro', sku: 'TEC-C30P-256', price: 1800, cost: 1350, stock: 15, category: 'Tecno', brand: 'Tecno', type: 'phone', imei: true },
  { id: 'p9', name: 'Apple AirPods Pro 2', sku: 'APL-APP2', price: 1800, cost: 1300, stock: 9, category: 'Accessories', brand: 'Apple', type: 'audio' },
  { id: 'p10', name: 'Samsung 25W Fast Charger', sku: 'SAM-CHG-25W', price: 120, cost: 65, stock: 30, category: 'Accessories', brand: 'Samsung', type: 'accessory' },
  { id: 'p11', name: 'Tempered Glass Screen Protector', sku: 'ACC-TG-UNI', price: 35, cost: 12, stock: 100, category: 'Accessories', brand: 'Generic', type: 'accessory' },
  { id: 'p12', name: 'Phone Case — Clear TPU', sku: 'ACC-CASE-CLR', price: 45, cost: 18, stock: 80, category: 'Accessories', brand: 'Generic', type: 'accessory' },
  { id: 'p13', name: 'Samsung Galaxy Watch 6', sku: 'SAM-GW6-44', price: 2200, cost: 1700, stock: 6, category: 'Samsung', brand: 'Samsung', type: 'wearable' },
  { id: 'p14', name: 'Apple Watch SE 2 40mm', sku: 'APL-WSE2-40', price: 3200, cost: 2550, stock: 4, category: 'Apple', brand: 'Apple', type: 'wearable' },
  { id: 'p15', name: 'USB-C to Lightning Cable 1m', sku: 'ACC-USBC-LTN', price: 80, cost: 30, stock: 60, category: 'Accessories', brand: 'Generic', type: 'accessory' },
  { id: 'p16', name: 'Xiaomi Pad 6 256GB', sku: 'XMI-PAD6-256', price: 4200, cost: 3300, stock: 3, category: 'Xiaomi', brand: 'Xiaomi', type: 'tablet', imei: true },
];

export const posCustomers: PosCustomer[] = [
  { id: 'c1', name: 'Kwame Asante', phone: '0244123456', email: 'kwame@email.com', loyaltyPoints: 1430, totalSpent: 43200, purchaseCount: 7, lastPurchase: '2026-04-20', openRepairs: 0, tags: ['VIP', 'Apple Fan'] },
  { id: 'c2', name: 'Ama Owusu', phone: '0501234567', email: 'ama@email.com', loyaltyPoints: 680, totalSpent: 18500, purchaseCount: 3, lastPurchase: '2026-04-15', openRepairs: 1, tags: ['Samsung Fan'] },
  { id: 'c3', name: 'Kofi Mensah', phone: '0271234567', email: 'kofi@email.com', loyaltyPoints: 210, totalSpent: 7800, purchaseCount: 4, lastPurchase: '2026-03-28', openRepairs: 0, tags: [] },
  { id: 'c4', name: 'Abena Frimpong', phone: '0551234567', email: 'abena@email.com', loyaltyPoints: 920, totalSpent: 26100, purchaseCount: 5, lastPurchase: '2026-04-22', openRepairs: 0, tags: ['VIP'] },
  { id: 'c5', name: 'Yaw Darko', phone: '0209876543', email: 'yaw@email.com', loyaltyPoints: 55, totalSpent: 2200, purchaseCount: 1, lastPurchase: '2026-04-10', openRepairs: 0, tags: [] },
];

export const posRecentSales = [
  { id: 'R001', customer: 'Kwame Asante', items: 'iPhone 15 Pro + AirPods Pro', total: 14300, method: 'MoMo', time: '10:42 AM' },
  { id: 'R002', customer: 'Ama Owusu', items: 'Samsung S24 Ultra', total: 12800, method: 'Cash', time: '10:15 AM' },
  { id: 'R003', customer: 'Kofi Mensah', items: 'Redmi Note 13 Pro x2', total: 5600, method: 'Card', time: '09:50 AM' },
  { id: 'R004', customer: 'Walk-in', items: 'Screen Protector x3 + Case', total: 150, method: 'Cash', time: '09:30 AM' },
];

export const upsellRules: Record<PosProduct['type'], string[]> = {
  phone: ['p9', 'p11', 'p12', 'p10', 'p15'],
  tablet: ['p10', 'p15', 'p11'],
  laptop: ['p10', 'p15'],
  audio: ['p15'],
  wearable: ['p15'],
  accessory: [],
};

export const installmentPlans = [
  { id: 'cash', label: 'Full Payment', months: 0, rate: 0 },
  { id: '3m', label: '3 Months', months: 3, rate: 0.08 },
  { id: '6m', label: '6 Months', months: 6, rate: 0.15 },
  { id: '12m', label: '12 Months', months: 12, rate: 0.25 },
];

export const tradeInConditions = [
  { id: 'mint', label: 'Mint (Like New)', multiplier: 0.70 },
  { id: 'good', label: 'Good (Minor scratches)', multiplier: 0.55 },
  { id: 'fair', label: 'Fair (Visible wear)', multiplier: 0.40 },
  { id: 'poor', label: 'Poor (Cracked/Fault)', multiplier: 0.20 },
];

export const tradeInDevices = [
  { id: 'ip15p', name: 'iPhone 15 Pro', baseValue: 8500 },
  { id: 'ip15', name: 'iPhone 15', baseValue: 6500 },
  { id: 'ip14', name: 'iPhone 14', baseValue: 4800 },
  { id: 'ip13', name: 'iPhone 13', baseValue: 3200 },
  { id: 's24u', name: 'Samsung S24 Ultra', baseValue: 8000 },
  { id: 's24', name: 'Samsung S24', baseValue: 5500 },
  { id: 's23', name: 'Samsung S23', baseValue: 3800 },
  { id: 'px8p', name: 'Google Pixel 8 Pro', baseValue: 5500 },
  { id: 'other', name: 'Other Device', baseValue: 800 },
];
