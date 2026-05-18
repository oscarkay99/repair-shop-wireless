const positionConfig = {
  below_market: { label: 'Below Market', color: 'bg-emerald-100 text-emerald-700', icon: 'ri-arrow-down-line' },
  above_market: { label: 'Above Market', color: 'bg-rose-100 text-rose-700', icon: 'ri-arrow-up-line' },
  at_market:    { label: 'At Market',    color: 'bg-sky-100 text-sky-700',   icon: 'ri-subtract-line' },
};

interface Competitor { name: string; price: number; lastUpdated: string }
interface PriceProduct {
  id: string;
  device: string;
  ourPrice: number;
  marketAvg: number;
  position: string;
  demandScore: number;
  trend: string;
  suggestion: string;
  competitors: Competitor[];
}

interface Props {
  product: PriceProduct;
}

export default function PriceDetail({ product }: Props) {
  const pos = positionConfig[product.position as keyof typeof positionConfig];

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">{product.device}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Last updated: 2 hours ago</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${pos.color}`}>{pos.label}</span>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                <i className="ri-store-2-line text-emerald-600 text-sm" />
              </div>
              <span className="text-sm font-bold text-slate-800">FixHub (You)</span>
            </div>
            <span className="text-base font-bold text-emerald-600">GHS {product.ourPrice.toLocaleString()}</span>
          </div>

          {product.competitors.map((comp, i) => {
            const diff = comp.price - product.ourPrice;
            return (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                    <i className="ri-building-2-line text-slate-500 text-sm" />
                  </div>
                  <div>
                    <span className="text-sm text-slate-700">{comp.name}</span>
                    <p className="text-[10px] text-slate-400">{comp.lastUpdated}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">GHS {comp.price.toLocaleString()}</p>
                  <p className={`text-[10px] font-medium ${diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {diff > 0 ? '+' : ''}{diff.toLocaleString()} vs you
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Market Range</span>
            <span className="text-xs text-slate-500">Avg: GHS {product.marketAvg.toLocaleString()}</span>
          </div>
          <div className="relative h-3 bg-slate-100 rounded-full">
            <div className="absolute top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: '60%' }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow-sm"
              style={{ left: `${Math.min(Math.max(((product.ourPrice - 7000) / 4000) * 100, 5), 90)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400">GHS {Math.min(...product.competitors.map(c => c.price)).toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">GHS {Math.max(...product.competitors.map(c => c.price)).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <i className="ri-sparkling-2-line text-violet-600 text-sm" />
            </div>
            <div>
              <p className="text-xs font-bold text-violet-700 mb-0.5">AI Pricing Suggestion</p>
              <p className="text-xs text-slate-600">{product.suggestion}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h4 className="text-sm font-bold text-slate-800 mb-3">Market Demand Score</h4>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={product.demandScore > 80 ? '#10b981' : product.demandScore > 60 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${product.demandScore} ${100 - product.demandScore}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-slate-800">{product.demandScore}</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">
              {product.demandScore > 80 ? 'High Demand' : product.demandScore > 60 ? 'Moderate Demand' : 'Low Demand'}
            </p>
            <p className="text-xs text-slate-500">Based on search trends, competitor stock levels, and your sales velocity over the past 30 days.</p>
            <div className="flex items-center gap-1 mt-2">
              <i className={`text-xs ${product.trend === 'rising' ? 'ri-arrow-up-line text-emerald-500' : product.trend === 'falling' ? 'ri-arrow-down-line text-rose-500' : 'ri-subtract-line text-slate-400'}`} />
              <span className="text-xs text-slate-500 capitalize">{product.trend} trend</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
