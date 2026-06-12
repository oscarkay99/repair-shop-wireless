import type { StatCard as StatCardType } from '@/types/common';

interface StatCardProps extends StatCardType {
  onClick?: () => void;
}

export function StatCard({ label, value, change, icon, accent, onClick }: StatCardProps) {
  const isPositive = change.startsWith('+');
  const isNegative = change.startsWith('-');

  return (
    <div
      className={`bg-white border border-slate-100 rounded-xl p-5 shadow-sm ${onClick ? 'cursor-pointer hover:border-slate-200 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${accent} bg-opacity-10 rounded-lg flex items-center justify-center`}>
          <i className={`${icon} text-lg text-slate-700`} />
        </div>
        <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-slate-400'}`}>
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
