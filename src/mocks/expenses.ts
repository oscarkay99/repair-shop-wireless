export const expenseCategories = [
  { id: 'rent', name: 'Rent & Utilities', budget: 8000, spent: 8000, color: '#0D1F4A' },
  { id: 'salaries', name: 'Staff Salaries', budget: 15000, spent: 15000, color: '#07101F' },
  { id: 'stock', name: 'Stock Purchases', budget: 45000, spent: 42300, color: '#F5A623' },
  { id: 'marketing', name: 'Marketing & Ads', budget: 5000, spent: 3870, color: '#E05A2B' },
  { id: 'repairs', name: 'Repair Parts', budget: 3000, spent: 2450, color: '#1552A8' },
  { id: 'delivery', name: 'Delivery & Logistics', budget: 2000, spent: 1780, color: '#0E3D8A' },
  { id: 'utilities', name: 'Internet & Phone', budget: 800, spent: 800, color: '#2D7DD2' },
  { id: 'misc', name: 'Miscellaneous', budget: 1500, spent: 890, color: '#8B9DC3' },
];

export const monthlyExpenses = [
  { month: 'Jan', revenue: 72000, expenses: 68500, profit: 3500 },
  { month: 'Feb', revenue: 68000, expenses: 64200, profit: 3800 },
  { month: 'Mar', revenue: 75000, expenses: 69800, profit: 5200 },
  { month: 'Apr', revenue: 84320, expenses: 74890, profit: 9430 },
  { month: 'May', revenue: 0, expenses: 0, profit: 0 },
  { month: 'Jun', revenue: 0, expenses: 0, profit: 0 },
];

export const recentTransactions = [
  { id: 'tx1', description: 'iPhone 15 Pro stock (10 units)', category: 'Stock Purchases', amount: 85000, type: 'expense', date: 'Apr 22, 2026', status: 'Paid' },
  { id: 'tx2', description: 'Samsung S24 Ultra stock (8 units)', category: 'Stock Purchases', amount: 68000, type: 'expense', date: 'Apr 20, 2026', status: 'Paid' },
  { id: 'tx3', description: 'TikTok ad campaign - iPhone launch', category: 'Marketing & Ads', amount: 2500, type: 'expense', date: 'Apr 18, 2026', status: 'Paid' },
  { id: 'tx4', description: 'Instagram ad campaign - budget phones', category: 'Marketing & Ads', amount: 1500, type: 'expense', date: 'Apr 17, 2026', status: 'Paid' },
  { id: 'tx5', description: 'Screen replacement parts batch', category: 'Repair Parts', amount: 1200, type: 'expense', date: 'Apr 15, 2026', status: 'Paid' },
  { id: 'tx6', description: 'Staff salaries - April', category: 'Staff Salaries', amount: 15000, type: 'expense', date: 'Apr 1, 2026', status: 'Paid' },
  { id: 'tx7', description: 'Shop rent - April', category: 'Rent & Utilities', amount: 5000, type: 'expense', date: 'Apr 1, 2026', status: 'Paid' },
  { id: 'tx8', description: 'DHL delivery fees (Kumasi batch)', category: 'Delivery & Logistics', amount: 450, type: 'expense', date: 'Apr 14, 2026', status: 'Paid' },
  { id: 'tx9', description: 'MTN Momo transaction fees', category: 'Miscellaneous', amount: 180, type: 'expense', date: 'Apr 10, 2026', status: 'Paid' },
  { id: 'tx10', description: 'Vodafone broadband - April', category: 'Internet & Phone', amount: 450, type: 'expense', date: 'Apr 5, 2026', status: 'Paid' },
];

export const expenseStats = {
  totalRevenue: 84320,
  totalExpenses: 74890,
  grossProfit: 9430,
  profitMargin: 11.2,
  ytdRevenue: 299320,
  ytdExpenses: 277390,
  ytdProfit: 21930,
  outstandingPayments: 12400,
  pendingInvoices: 8,
};