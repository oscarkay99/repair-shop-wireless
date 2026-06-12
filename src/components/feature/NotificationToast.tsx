import { useEffect, useState } from 'react';
import type { Notification } from '@/hooks/useNotifications';

interface Props {
  toasts: Notification[];
  onDismiss: (id: string) => void;
}

const typeConfig = {
  sale:    { icon: 'ri-shopping-bag-3-fill', bg: '#10B981', label: 'Sale'    },
  lead:    { icon: 'ri-user-star-fill',      bg: '#F59E0B', label: 'Lead'    },
  payment: { icon: 'ri-bank-card-fill',      bg: '#06B6D4', label: 'Payment' },
  repair:  { icon: 'ri-tools-fill',          bg: '#DC1F1F', label: 'Repair'  },
  alert:   { icon: 'ri-alert-fill',          bg: '#EF4444', label: 'Alert'   },
};

function Toast({ notif, onDismiss }: { notif: Notification; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const cfg = typeConfig[notif.type];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex items-start gap-3 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 w-80 transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
        <i className={`${cfg.icon} text-white text-sm`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-xs font-bold text-slate-800">{notif.title}</p>
          <button onClick={onDismiss} className="w-4 h-4 flex items-center justify-center cursor-pointer">
            <i className="ri-close-line text-slate-400 text-xs" />
          </button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
        {notif.amount && (
          <p className="text-sm font-bold text-emerald-600 mt-1">GHS {notif.amount.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

export default function NotificationToast({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast notif={toast} onDismiss={() => onDismiss(toast.id)} />
        </div>
      ))}
    </div>
  );
}
