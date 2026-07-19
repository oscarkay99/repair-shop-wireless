const automationRules = [
  {
    trigger: 'Price Inquiry',
    keywords: ['price', 'cost', 'how much', 'GHS'],
    response: 'Sends product price, stock status, and a reserve link',
    handled: 342,
    converted: 89,
    icon: 'ri-price-tag-3-line',
    color: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  {
    trigger: 'Trade-In Request',
    keywords: ['trade', 'swap', 'exchange', 'sell my'],
    response: 'Sends trade-in value estimate and books appointment',
    handled: 128,
    converted: 54,
    icon: 'ri-exchange-line',
    color: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
  },
  {
    trigger: 'Repair Inquiry',
    keywords: ['repair', 'fix', 'broken', 'screen', 'battery'],
    response: 'Sends repair price list and books a slot',
    handled: 97,
    converted: 71,
    icon: 'ri-tools-line',
    color: 'bg-sky-50 border-sky-200',
    iconColor: 'text-sky-600',
  },
  {
    trigger: 'Order Status',
    keywords: ['order', 'delivery', 'where', 'track', 'status'],
    response: 'Fetches order status and sends tracking link',
    handled: 203,
    converted: 203,
    icon: 'ri-truck-line',
    color: 'bg-cyan-50 border-cyan-200',
    iconColor: 'text-cyan-600',
  },
  {
    trigger: 'Availability Check',
    keywords: ['available', 'in stock', 'do you have'],
    response: 'Checks inventory and sends stock status with alternatives',
    handled: 189,
    converted: 67,
    icon: 'ri-archive-line',
    color: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-600',
  },
  {
    trigger: 'Installment Plan',
    keywords: ['installment', 'monthly', 'pay later', 'credit'],
    response: 'Sends payment plan options and application link',
    handled: 76,
    converted: 31,
    icon: 'ri-calendar-line',
    color: 'bg-teal-50 border-teal-200',
    iconColor: 'text-teal-600',
  },
];

export default function WaAutomations() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-[#EC0118] to-[#BD0113] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-xl">
            <i className="ri-robot-2-line text-xl" />
          </div>
          <div>
            <h3 className="font-bold">AI Auto-Reply Engine</h3>
            <p className="text-white/70 text-xs">Handles 78% of incoming messages automatically</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-white/70">Active</span>
            <div className="w-10 h-5 bg-white/30 rounded-full relative">
              <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {automationRules.map(rule => (
          <div key={rule.trigger} className={`rounded-2xl border p-4 ${rule.color}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg">
                  <i className={`${rule.icon} text-sm ${rule.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{rule.trigger}</p>
                  <p className="text-xs text-slate-500">{rule.response}</p>
                </div>
              </div>
              <div className="w-8 h-4 bg-emerald-500 rounded-full relative flex-shrink-0 mt-1">
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
              <span><strong className="text-emerald-600">{Math.round((rule.converted / rule.handled) * 100)}%</strong> rate</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
