import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const config: Record<ToastType, { icon: string; color: string; bg: string }> = {
  success: { icon: 'ri-checkbox-circle-line', color: '#25D366', bg: '#25D36618' },
  error:   { icon: 'ri-error-warning-line',   color: '#E05A2B', bg: '#E05A2B18' },
  warning: { icon: 'ri-alert-line',           color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { icon, color, bg } = config[toast.type];
  return (
    <div
      className="pointer-events-auto flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-xl border border-slate-100 min-w-[260px] max-w-[360px]"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <i className={`${icon} text-base`} style={{ color }} />
      </div>
      <p className="flex-1 text-sm font-medium text-slate-700 leading-snug">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-500 cursor-pointer transition-colors flex-shrink-0"
      >
        <i className="ri-close-line text-sm" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
