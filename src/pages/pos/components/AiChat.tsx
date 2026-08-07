import { useState, useRef, useEffect } from 'react';
import { productMetrics, getTodaySummary, customerIntelligence, bundleInsights } from '@/mocks/posIntelligence';
import { posProducts } from '@/mocks/pos';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function formatGHS(n: number) {
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Smart local fallback — answers common POS questions without an API call
function localAnswer(query: string): string | null {
  const q = query.toLowerCase();

  if (q.includes('top sell') || q.includes('best sell') || q.includes('most sold')) {
    const top = productMetrics.sort((a, b) => b.unitsSold30d - a.unitsSold30d).slice(0, 3);
    const names = top.map(m => {
      const p = posProducts.find(x => x.id === m.productId);
      return `${p?.name ?? m.productId} (${m.unitsSold30d} units)`;
    });
    return `Top 3 sellers in the last 30 days:\n1. ${names[0]}\n2. ${names[1]}\n3. ${names[2]}`;
  }

  if (q.includes('push') || q.includes('promote') || q.includes('today')) {
    const hot = productMetrics.filter(m => m.velocity === 'hot' && m.daysOfStock <= 10);
    const slow = productMetrics.filter(m => m.velocity === 'slow');
    const hotNames = hot.map(m => posProducts.find(x => x.id === m.productId)?.name).filter(Boolean).slice(0, 2);
    const slowNames = slow.map(m => posProducts.find(x => x.id === m.productId)?.name).filter(Boolean).slice(0, 2);
    return `Push today:\n🔥 Fast-moving (running low): ${hotNames.join(', ') || 'None critical'}\n🐢 Promote slow movers: ${slowNames.join(', ') || 'All good'}\n\nFocus on selling accessories with every phone. They carry 60%+ margin.`;
  }

  if (q.includes('slow') || q.includes('not selling') || q.includes('dead stock')) {
    const slow = productMetrics.filter(m => m.velocity === 'slow').slice(0, 4);
    const names = slow.map(m => {
      const p = posProducts.find(x => x.id === m.productId);
      return `${p?.name} (${m.daysOfStock}d stock, ${m.unitsSold30d} sold)`;
    });
    if (names.length === 0) return 'All products are moving at healthy velocity right now.';
    return `Slow-moving products:\n${names.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n\nTip: Bundle them with fast sellers or offer a 5–10% promo this weekend.`;
  }

  if (q.includes('reorder') || q.includes('stock') || q.includes('running out') || q.includes('low stock')) {
    const alerts = productMetrics.filter(m => m.reorderAlert);
    if (alerts.length === 0) return 'No urgent reorder alerts. All critical products have more than 7 days of stock.';
    const names = alerts.map(m => {
      const p = posProducts.find(x => x.id === m.productId);
      return `${p?.name}: ${m.daysOfStock}d left`;
    });
    return `Reorder now:\n${names.join('\n')}\n\nOrder before stock hits zero. Lead time from suppliers is usually 2–3 days.`;
  }

  if (q.includes('revenue') || q.includes('money') || q.includes('made today') || q.includes('sales today')) {
    const s = getTodaySummary();
    const trend = s.growthPct >= 0 ? `+${s.growthPct}%` : `${s.growthPct}%`;
    return `Today so far:\n💰 Revenue: ${formatGHS(s.revenue)}\n📦 Transactions: ${s.transactions}\n📊 Avg order: ${formatGHS(s.avgOrder)}\n📈 vs yesterday: ${trend}`;
  }

  if (q.includes('peak') || q.includes('busy') || q.includes('hour') || q.includes('time')) {
    return 'Peak selling hours are 11am–1pm and 4pm–6pm. Run flash promotions at 10am to capture early shoppers, and push premium items in the evening when customers have more time to decide.';
  }

  if (q.includes('bundle') || q.includes('together') || q.includes('combo')) {
    const top = bundleInsights.slice(0, 3);
    const combos = top.map(b => {
      const pA = posProducts.find(p => p.id === b.productA);
      const pB = posProducts.find(p => p.id === b.productB);
      return `${pA?.name ?? b.productA} + ${pB?.name ?? b.productB} (${b.liftScore}x lift)`;
    });
    return `Most frequently bought together:\n${combos.join('\n')}\n\nSuggest these combos at checkout. Customers who buy in bundles spend 20–30% more.`;
  }

  if (q.includes('vip') || q.includes('best customer') || q.includes('loyal')) {
    const top = customerIntelligence.sort((a, b) => b.vipScore - a.vipScore).slice(0, 3);
    const names = ['Kwame Asante', 'Ama Owusu', 'Kofi Mensah', 'Abena Frimpong', 'Yaw Darko'];
    const result = top.map(ci => {
      const idx = parseInt(ci.customerId.replace('c', '')) - 1;
      return `${names[idx]}: VIP score ${ci.vipScore}, ${formatGHS(ci.totalSpent)} spent`;
    });
    return `Top customers by loyalty:\n${result.join('\n')}\n\nOffer them early access to new arrivals or a personal discount to keep them coming back.`;
  }

  if (q.includes('margin') || q.includes('profit') || q.includes('markup')) {
    const high = productMetrics.sort((a, b) => b.profit30d - a.profit30d).slice(0, 3);
    const names = high.map(m => {
      const p = posProducts.find(x => x.id === m.productId);
      const mgn = Math.round(((p!.price - p!.cost) / p!.price) * 100);
      return `${p?.name} (${mgn}% margin, ${formatGHS(m.profit30d)} profit/30d)`;
    });
    return `Highest margin products:\n${names.join('\n')}\n\nAccessories like screen protectors (65%+ margin) are your most profitable category per unit.`;
  }

  if (q.includes('fraud') || q.includes('suspicious') || q.includes('anomaly')) {
    return 'Anomaly detection is active during checkout. Flags trigger when:\n• Discount exceeds 15% on premium phones\n• Effective margin drops below 8%\n• Transaction outside 8am–8pm\n\nAll flagged transactions require manager approval.';
  }

  if (q.includes('forecast') || q.includes('predict') || q.includes('next week')) {
    const hot = productMetrics.filter(m => m.velocity === 'hot').slice(0, 2);
    const names = hot.map(m => {
      const p = posProducts.find(x => x.id === m.productId);
      const forecast = Math.round(m.avgDailySales * 7 * 1.1);
      return `${p?.name}: ~${forecast} units`;
    });
    return `7-day demand forecast:\n${names.join('\n')}\n\nWeekend demand typically runs 40% higher. Stock up accessories by Friday.`;
  }

  return null;
}

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your AI sales assistant. Ask me anything: "What should I push today?", "Which items are running low?", "Who are my best customers?"' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    'What should I push today?',
    'Show me top sellers',
    "What's today's revenue?",
    'Which items are slow?',
  ];

  async function send(text: string) {
    const q = text.trim();
    if (!q) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    // Try local smart answer first (instant, no API cost)
    const local = localAnswer(q);
    if (local) {
      await new Promise(r => setTimeout(r, 400)); // feel responsive
      setMessages(prev => [...prev, { role: 'assistant', content: local }]);
      setLoading(false);
      return;
    }

    await new Promise(r => setTimeout(r, 500));
    setMessages(prev => [...prev, { role: 'assistant', content: "I don't have a specific answer for that, but you can check the Analytics or Reports tabs for detailed insights." }]);

    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl cursor-pointer transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #EC0118, #6366f1)' }}
        title="AI Sales Assistant"
      >
        {open ? <i className="ri-close-line text-xl" /> : <i className="ri-sparkling-2-line text-xl" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ height: 440 }}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #EC0118, #6366f1)' }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <i className="ri-sparkling-2-line text-white text-sm" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">AI Sales Assistant</p>
              <p className="text-[10px] text-white/70">Powered by Wireless Intelligence</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-[#EC0118] text-white rounded-tr-sm'
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {quickPrompts.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-[10px] bg-[rgba(236,1,24,0.06)] text-[#EC0118] border border-[rgba(236,1,24,0.15)] px-2 py-1 rounded-full hover:bg-[rgba(236,1,24,0.1)] cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-slate-100 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Ask anything…"
              className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#EC0118]/30"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-[#EC0118] text-white flex items-center justify-center disabled:opacity-40 cursor-pointer hover:bg-[#BD0113] flex-shrink-0"
            >
              <i className="ri-send-plane-fill text-sm" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
