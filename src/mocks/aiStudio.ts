export const promptTemplates = [
  { id: 't1', category: 'Follow-ups', name: 'Warm Lead Re-engagement', description: 'Re-engage a warm lead who hasn\'t responded in 48 hours', icon: 'ri-message-3-line' },
  { id: 't2', category: 'Follow-ups', name: 'Post-Purchase Thank You', description: 'Send a warm thank you with warranty activation reminder', icon: 'ri-heart-line' },
  { id: 't3', category: 'Follow-ups', name: 'Repair Status Update', description: 'Notify customer of repair progress with ETA', icon: 'ri-tools-line' },
  { id: 't4', category: 'Campaigns', name: 'WhatsApp Promo Blast', description: 'Create a compelling WhatsApp broadcast for a product promo', icon: 'ri-whatsapp-line' },
  { id: 't5', category: 'Campaigns', name: 'Instagram Caption Generator', description: 'Generate engaging captions for product posts', icon: 'ri-instagram-line' },
  { id: 't6', category: 'Campaigns', name: 'Flash Sale Announcement', description: 'Urgent, conversion-focused flash sale message', icon: 'ri-flashlight-line' },
  { id: 't7', category: 'Summaries', name: 'Daily Sales Summary', description: 'Summarize today\'s sales, leads, and key metrics', icon: 'ri-bar-chart-line' },
  { id: 't8', category: 'Summaries', name: 'Customer Conversation Summary', description: 'Summarize a customer chat for CRM notes', icon: 'ri-chat-3-line' },
  { id: 't9', category: 'Product', name: 'Product Description Writer', description: 'Write a premium product description for the storefront', icon: 'ri-file-text-line' },
  { id: 't10', category: 'Product', name: 'Condition Report Generator', description: 'Generate a detailed condition report for used/refurbished items', icon: 'ri-shield-check-line' },
];

export const recentGenerations = [
  { id: 'g1', template: 'Warm Lead Re-engagement', preview: 'Hi Kwame! Just checking in — we still have that iPhone 15 Pro Max you were interested in...', time: '10 min ago' },
  { id: 'g2', template: 'WhatsApp Promo Blast', preview: '🔥 FLASH DEAL: MacBook Air M2 now GHS 12,400 — only 5 units left! Authentic, sealed, 12-month warranty...', time: '1 hr ago' },
  { id: 'g3', template: 'Product Description Writer', preview: 'Experience the pinnacle of mobile photography with the iPhone 15 Pro Max. Crafted from aerospace-grade titanium...', time: '3 hr ago' },
  { id: 'g4', template: 'Daily Sales Summary', preview: 'Today\'s Performance: 6 sales totaling GHS 42,800. Top product: iPhone 15 Pro Max (3 units). 12 new leads...', time: 'Yesterday' },
];

export const automationIdeas = [
  { title: 'Auto Follow-up Sequence', description: 'Automatically send follow-up messages to leads after 24h, 48h, and 72h of no response', status: 'available' },
  { title: 'Low Stock Alert', description: 'Notify the team on WhatsApp when any product drops below 2 units', status: 'available' },
  { title: 'Payment Reminder', description: 'Send gentle payment reminders to customers with outstanding balances', status: 'available' },
  { title: 'Repair Status Updates', description: 'Auto-notify customers when their repair status changes', status: 'coming_soon' },
  { title: 'Birthday Offers', description: 'Send personalized birthday discount messages to VIP customers', status: 'coming_soon' },
];
