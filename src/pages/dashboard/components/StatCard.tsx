import { useState } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  accentColor?: string;
  sub?: string;
  sparkline?: number[];
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 100; const H = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - 4 - ((v - min) / range) * (H - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaBottom = `${((data.length - 1) / (data.length - 1)) * W},${H} 0,${H}`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-3">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${areaBottom}`} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StatCard({ label, value, change, trend, icon, accentColor, sub, sparkline }: StatCardProps) {
  const [hovered, setHovered] = useState(false);
  const color = accentColor || '#EC0118';
  const isPositive = trend === 'up';
  const isNeutral  = trend === 'neutral';

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden cursor-default transition-all duration-300 flex flex-col"
      style={{
        background: 'white',
        border: '1px solid rgba(7,16,31,0.07)',
        boxShadow: hovered
          ? '0 4px 24px rgba(7,16,31,0.1), 0 1px 4px rgba(7,16,31,0.05)'
          : '0 1px 3px rgba(7,16,31,0.04), 0 6px 24px rgba(236,1,24,0.08)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}66)`, opacity: hovered ? 1 : 0.5 }} />

      {/* Corner orb */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: color, opacity: hovered ? 0.06 : 0.03 }} />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: 'rgba(10,31,74,0.38)' }}>
            {label}
          </p>
          <p className="text-[26px] font-bold leading-none mb-1" style={{ color: '#0F172A', letterSpacing: '-0.03em' }}>
            {value}
          </p>
          {sub && (
            <p className="text-[11px] mt-1" style={{ color: 'rgba(10,31,74,0.38)' }}>{sub}</p>
          )}
        </div>
        <div className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ml-3"
          style={{ background: `${color}18`, border: `1px solid ${color}22`, boxShadow: hovered ? `0 4px 12px ${color}22` : 'none' }}>
          <i className={`${icon} text-lg`} style={{ color }} />
        </div>
      </div>

      {/* Sparkline */}
      {sparkline && sparkline.length >= 2 && (
        <Sparkline data={sparkline} color={color} />
      )}

      {/* Change badge */}
      <div className="mt-auto pt-3 flex items-center gap-1.5">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{
            background: isNeutral ? 'rgba(100,116,139,0.1)' : isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color:      isNeutral ? '#64748b' : isPositive ? '#059669' : '#DC2626',
          }}>
          {!isNeutral && <i className={`${isPositive ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-[9px]`} />}
          {change}
        </div>
      </div>
    </div>
  );
}
