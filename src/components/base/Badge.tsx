import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'custom';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'text-slate-500 bg-slate-100',
  success: 'text-emerald-700 bg-emerald-50',
  warning: 'text-amber-700 bg-amber-50',
  danger:  'text-red-600 bg-red-50',
  info:    'text-cyan-700 bg-cyan-50',
  custom:  '',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
