import { topSellingProducts } from '@/mocks/analytics';

export default function TopProductsTable() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Top Selling Products</h3>
          <p className="text-xs text-slate-400 mt-0.5">By revenue · last 6 months</p>
        </div>
        <button className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium">View inventory</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['#', 'Product', 'Category', 'Units Sold', 'Revenue', 'Margin', 'Trend'].map((h) => (
                <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topSellingProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-xs text-slate-400">
                  No sales data yet. Products will appear here once you record sales.
                </td>
              </tr>
            ) : topSellingProducts.map((p, i) => (
              <tr key={p.name} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/20'}`}>
                <td className="px-4 py-3 text-xs font-bold text-slate-300">#{i + 1}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">{p.name}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{p.category}</span>
                </td>
                <td className="px-4 py-3 text-xs font-medium text-slate-700">{p.units}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-900">{p.revenue}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-emerald-600">{p.margin}</span>
                </td>
                <td className="px-4 py-3">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-lg ${p.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                    <i className={`${p.trend === 'up' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-xs`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}