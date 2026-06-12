import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: string;
  children?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-[#DC1F1F] hover:bg-[#B81616] text-white',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
  ghost:     'bg-transparent hover:bg-slate-50 text-slate-500 border border-slate-200',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors cursor-pointer
        ${variantClasses[variant]} ${sizeClasses[size]}
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <i className="ri-loader-4-line animate-spin" />
      ) : icon ? (
        <i className={icon} />
      ) : null}
      {children}
    </button>
  );
}
