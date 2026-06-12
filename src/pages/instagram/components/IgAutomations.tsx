const igGradient = 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';

const automationRules = [
  {
    trigger: 'Price DM',
    keywords: ['price', 'cost', 'how much', 'GHS', '💰'],
    response: 'Sends price list, stock status and payment options',
    handled: 312,
    converted: 87,
    borderColor: '#dc2743',
    bg: '#fff0f3',
    icon: 'ri-price-tag-3-line',
  },
  {
    trigger: 'Product Availability',
    keywords: ['available', 'in stock', 'do you have', '👀'],
    response: 'Checks inventory and sends stock status with photos',
    handled: 198,
    converted: 71,
    borderColor: '#e6683c',
    bg: '#fff5f0',
    icon: 'ri-archive-line',
  },
  {
    trigger: 'Comment "PRICE"',
    keywords: ['PRICE', 'LINK', 'INFO', 'DM ME'],
    response: 'Auto-DMs anyone who comments keyword on posts',
    handled: 567,
    converted: 134,
    borderColor: '#cc2366',
    bg: '#fff0f8',
    icon: 'ri-chat-1-line',
  },
  {
    trigger: 'Story Reply',
    keywords: ['story reply', 'interested', '🔥', '😍'],
    response: 'Replies to story reactions with product details',
    handled: 234,
    converted: 89,
    borderColor: '#bc1888',
    bg: '#fdf0ff',
    icon: 'ri-slideshow-line',
  },
  {
    trigger: 'Shipping Inquiry',
    keywords: ['ship', 'deliver', 'Kumasi', 'Takoradi'],
    response: 'Sends delivery zones, fees and estimated times',
    handled: 143,
    converted: 56,
    borderColor: '#f09433',
    bg: '#fffbf0',
    icon: 'ri-truck-line',
  },
  {
    trigger: 'Trade-In DM',
    keywords: ['trade', 'swap', 'sell my', 'exchange'],
    response: 'Sends trade-in value estimate and books appointment',
    handled: 89,
    converted: 41,
    borderColor: '#DC1F1F',
    bg: 'rgba(220,31,31,0.08)',
    icon: 'ri-exchange-line',
  },
];

export default function IgAutomations() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 text-white" style={{ background: igGradient }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-xl">
            <i className="ri-robot-2-line text-xl" />
          </div>
          <div>
            <h3 className="font-bold">Instagram AI Auto-Reply Engine</h3>
            <p className="text-white/80 text-xs">Handles 71% of DMs automatically — comments, story replies & DMs</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-white/80">Active</span>
            <div className="w-10 h-5 bg-white/30 rounded-full relative">
              <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-2">
        {[
          { label: 'DMs Handled', value: '847', sub: 'this month' },
          { label: 'Comment Replies', value: '2,341', sub: 'auto-replied' },
          { label: 'Story Replies', value: '412', sub: 'converted' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs font-semibold text-slate-600">{s.label}</p>
            <p className="text-[10px] text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {automationRules.map(rule => (
          <div
            key={rule.trigger}
            className="rounded-2xl border-2 p-4"
            style={{ borderColor: rule.borderColor, background: rule.bg }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg">
                  <i className={`${rule.icon} text-sm`} style={{ color: rule.borderColor }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{rule.trigger}</p>
                  <p className="text-xs text-slate-500">{rule.response}</p>
                </div>
              </div>
              <div className="w-8 h-4 rounded-full relative flex-shrink-0 mt-1" style={{ background: igGradient }}>
                <span className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {rule.keywords.map(k => (
                <span key={k} className="text-[10px] bg-white px-2 py-0.5 rounded-full text-slate-600 border border-slate-200">{k}</span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span><strong className="text-slate-700">{rule.handled}</strong> handled</span>
              <span><strong className="text-slate-700">{rule.converted}</strong> converted</span>
              <span className="font-semibold" style={{ color: rule.borderColor }}>
                {Math.round((rule.converted / rule.handled) * 100)}% rate
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
