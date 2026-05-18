export const analyticsKPIs = [
  { label: 'Total Revenue', value: 'GHS 399,520', change: '+18.6%', trend: 'up', icon: 'ri-money-dollar-circle-line', accent: 'bg-emerald-500', sub: '6-month total' },
  { label: 'Total Orders', value: '503', change: '+22.4%', trend: 'up', icon: 'ri-shopping-bag-3-line', accent: 'bg-blue-500', sub: 'Completed sales' },
  { label: 'Avg Order Value', value: 'GHS 5,420', change: '+4.1%', trend: 'up', icon: 'ri-bar-chart-box-line', accent: 'bg-violet-500', sub: 'Per transaction' },
  { label: 'Customer LTV', value: 'GHS 14,200', change: '+9.3%', trend: 'up', icon: 'ri-user-heart-line', accent: 'bg-amber-500', sub: 'Avg lifetime value' },
];

export const monthlyData = [
  { month: 'Nov', revenue: 48200, orders: 62, leads: 38, repairs: 8, target: 50000 },
  { month: 'Dec', revenue: 72400, orders: 88, leads: 54, repairs: 12, target: 65000 },
  { month: 'Jan', revenue: 54800, orders: 71, leads: 42, repairs: 9, target: 60000 },
  { month: 'Feb', revenue: 61200, orders: 79, leads: 48, repairs: 11, target: 65000 },
  { month: 'Mar', revenue: 78600, orders: 94, leads: 62, repairs: 14, target: 75000 },
  { month: 'Apr', revenue: 84320, orders: 109, leads: 78, repairs: 18, target: 80000 },
];

export const topSellingProducts = [
  { name: 'iPhone 15 Pro Max', category: 'Phones', units: 42, revenue: 'GHS 344,400', margin: '18%', trend: 'up' },
  { name: 'MacBook Air M2', category: 'Laptops', units: 28, revenue: 'GHS 347,200', margin: '14%', trend: 'up' },
  { name: 'Samsung Galaxy S24 Ultra', category: 'Phones', units: 34, revenue: 'GHS 231,200', margin: '16%', trend: 'up' },
  { name: 'AirPods Pro 2nd Gen', category: 'Accessories', units: 68, revenue: 'GHS 108,800', margin: '22%', trend: 'down' },
  { name: 'iPad Pro 12.9" M2', category: 'Tablets', units: 18, revenue: 'GHS 158,400', margin: '15%', trend: 'up' },
  { name: 'MacBook Pro 14" M3', category: 'Laptops', units: 11, revenue: 'GHS 203,500', margin: '12%', trend: 'up' },
];

export const customerSegmentData = [
  { segment: 'VIP', count: 24, revenue: 'GHS 182,400', avgLTV: 'GHS 7,600', pct: 8 },
  { segment: 'Repeat', count: 88, revenue: 'GHS 142,800', avgLTV: 'GHS 1,623', pct: 28 },
  { segment: 'New', count: 164, revenue: 'GHS 58,200', avgLTV: 'GHS 355', pct: 53 },
  { segment: 'At-Risk', count: 36, revenue: 'GHS 16,120', avgLTV: 'GHS 448', pct: 11 },
];

export const repairMetrics = [
  { month: 'Nov', completed: 8, revenue: 4200 },
  { month: 'Dec', completed: 12, revenue: 6800 },
  { month: 'Jan', completed: 9, revenue: 4900 },
  { month: 'Feb', completed: 11, revenue: 5800 },
  { month: 'Mar', completed: 14, revenue: 7400 },
  { month: 'Apr', completed: 18, revenue: 9200 },
];

export const salesFunnel = [
  { stage: 'Leads', value: 312, color: '#3B82F6' },
  { stage: 'Contacted', value: 248, color: '#6366F1' },
  { stage: 'Quoted', value: 148, color: '#8B5CF6' },
  { stage: 'Negotiating', value: 96, color: '#D97706' },
  { stage: 'Closed', value: 87, color: '#059669' },
];

export const stockHealthData = [
  { label: 'Healthy Stock', value: 118, pct: 83, color: 'bg-emerald-500' },
  { label: 'Low Stock', value: 15, pct: 11, color: 'bg-amber-400' },
  { label: 'Out of Stock', value: 9, pct: 6, color: 'bg-red-400' },
];