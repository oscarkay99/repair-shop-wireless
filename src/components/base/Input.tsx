import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export function Input({ label, error, icon, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-600">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <i className={`${icon} absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm`} />
        )}
        <input
          id={inputId}
          className={`w-full bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400
            focus:outline-none focus:border-[#DC1F1F] focus:bg-white transition-all
            ${error ? 'border-red-400' : 'border-slate-200'}
            ${icon ? 'pl-9 pr-3' : 'px-3'} py-2.5 ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
