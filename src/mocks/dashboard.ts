export const dashboardStats = {
  revenue: { value: 'GHS 84,320', change: '+12.4%', trend: 'up' },
  leads: { value: '47', change: '+8', trend: 'up' },
  stockAlerts: { value: '9', change: '-2', trend: 'down' },
  pendingPayments: { value: 'GHS 12,450', change: '+3', trend: 'up' },
};

export const revenueChart = [
  { day: 'Mon', value: 8200 },
  { day: 'Tue', value: 11400 },
  { day: 'Wed', value: 9800 },
  { day: 'Thu', value: 14200 },
  { day: 'Fri', value: 16800 },
  { day: 'Sat', value: 19400 },
  { day: 'Sun', value: 12600 },
];

export const monthlyRevenue = [
  { month: 'Nov', revenue: 48200, orders: 62, target: 50000 },
  { month: 'Dec', revenue: 72400, orders: 88, target: 65000 },
  { month: 'Jan', revenue: 54800, orders: 71, target: 60000 },
  { month: 'Feb', revenue: 61200, orders: 79, target: 65000 },
  { month: 'Mar', revenue: 78600, orders: 94, target: 75000 },
  { month: 'Apr', revenue: 84320, orders: 109, target: 80000 },
];

export const categoryBreakdown = [
  { name: 'Phones', revenue: 48200, pct: 57, color: '#059669' },
  { name: 'Laptops', revenue: 24100, pct: 29, color: '#0F172A' },
  { name: 'Accessories', revenue: 8400, pct: 10, color: '#D97706' },
  { name: 'Tablets', revenue: 3620, pct: 4, color: '#6366F1' },
];

export const paymentMethods = [
  { method: 'MTN MoMo', value: 48200, pct: 57, color: '#F59E0B' },
  { method: 'Bank Transfer', value: 22100, pct: 26, color: '#3B82F6' },
  { method: 'Cash', value: 8400, pct: 10, color: '#059669' },
  { method: 'Card', value: 5620, pct: 7, color: '#8B5CF6' },
];

export const aiInsights = [
  'iPhone 14 Pro Max demand up 34% this week — consider restocking.',
  '3 leads from Instagram went cold — follow up before Friday.',
  'Kofi Mensah has GHS 2,400 outstanding — send gentle reminder.',
  'MacBook Air M2 is your fastest mover — 6 units sold in 5 days.',
  'Repair turnaround avg is 3.2 days — industry benchmark is 2.5.',
];

export const alerts = [
  { type: 'stock', message: 'Samsung Galaxy S24 — only 1 unit left', severity: 'high' },
  { type: 'payment', message: 'GHS 4,200 payment from Ama Owusu pending verification', severity: 'medium' },
  { type: 'lead', message: '5 leads uncontacted for more than 48 hours', severity: 'high' },
  { type: 'repair', message: 'Repair #R-0042 awaiting customer approval', severity: 'medium' },
];

export const recentActivity = [
  { type: 'sale', text: 'iPhone 15 sold to Kwame Asante', time: '12 min ago', amount: 'GHS 8,200' },
  { type: 'lead', text: 'New lead from WhatsApp — Abena Frimpong', time: '34 min ago' },
  { type: 'payment', text: 'MoMo payment verified — GHS 3,500', time: '1 hr ago', amount: 'GHS 3,500' },
  { type: 'repair', text: 'Repair #R-0041 marked ready for pickup', time: '2 hr ago' },
  { type: 'sale', text: 'MacBook Air M2 sold to Yaw Darko', time: '3 hr ago', amount: 'GHS 12,400' },
];

export const topProducts = [
  { name: 'iPhone 15 Pro Max', sold: 14, revenue: 'GHS 114,800', stock: 3 },
  { name: 'MacBook Air M2', sold: 9, revenue: 'GHS 111,600', stock: 5 },
  { name: 'Samsung Galaxy S24', sold: 11, revenue: 'GHS 68,200', stock: 1 },
  { name: 'AirPods Pro 2', sold: 22, revenue: 'GHS 35,200', stock: 8 },
  { name: 'iPad Pro 12.9"', sold: 6, revenue: 'GHS 52,800', stock: 4 },
];
