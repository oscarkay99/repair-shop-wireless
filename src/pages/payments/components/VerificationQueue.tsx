import { useState } from 'react';
import { verificationQueue } from '@/mocks/payments';

export default function VerificationQueue() {
  const [items, setItems] = useState(verificationQueue);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
      <div className="flex items-center gap-2 p-5 border-b border-[hsl(var(--border))]">
        <div className="w-5 h-5 flex items-center justify-center text-amber-500">
          <i className="ri-time-line text-sm" />
        </div>
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Verification Queue</h3>
        <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          {items.length} pending
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-50 mx-auto mb-3">
            <i className="ri-checkbox-circle-line text-xl text-emerald-500" />
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">All caught up! No pending verifications.</p>
        </div>
      ) : (
        <div className="divide-y divide-[hsl(var(--border))]">
          {items.map((item) => (
            <div key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{item.customer}</span>
                    <span className="text-xs bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-2 py-0.5 rounded-full">{item.method}</span>
                  </div>
                  <p className="text-xs font-bold text-[hsl(var(--foreground))]">{item.amount}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Ref: {item.reference}</p>
                </div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] whitespace-nowrap">{item.time}</span>
              </div>
              <div className="bg-amber-50 rounded-xl px-3 py-2 mb-3">
                <p className="text-xs text-amber-700">{item.proofNote}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(item.id, 'approve')}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all cursor-pointer whitespace-nowrap"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(item.id, 'reject')}
                  className="flex-1 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-all cursor-pointer whitespace-nowrap"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
