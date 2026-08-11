import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISSED_KEY = 'wireless_push_prompt_dismissed';

/** A small opt-in nudge, not a blocking modal — browsers only ever grant
 *  one shot at the real permission dialog per origin (a denial can't be
 *  re-prompted from JS at all), so this exists specifically to get that
 *  one shot spent on a moment the user chose, not an unexplained popup on
 *  first load. Rendered once from AuthGuard rather than per-portal page,
 *  so it shows up the same way in the admin shell, tech portal, reception,
 *  and inventory portal without needing to touch each of them. */
export default function PushNotificationPrompt() {
  const { permission, subscribing, subscribe, isSupported } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1');

  if (!isSupported || permission !== 'default' || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-80 z-[120] rounded-2xl p-4 flex items-start gap-3"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(236,1,24,0.1)' }}>
        <Bell className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>Turn on notifications</p>
        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Get notified here even when Wireless isn't open.
        </p>
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={() => subscribe().then(ok => { if (ok) dismiss(); })}
            disabled={subscribing}
            className="h-7 px-3 rounded-lg text-[11px] font-semibold text-white disabled:opacity-60"
            style={{ background: 'hsl(var(--primary))' }}
          >
            {subscribing ? 'Enabling…' : 'Enable'}
          </button>
          <button onClick={dismiss} className="h-7 px-3 rounded-lg text-[11px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Not now
          </button>
        </div>
      </div>
      <button onClick={dismiss} className="flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-label="Dismiss">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
