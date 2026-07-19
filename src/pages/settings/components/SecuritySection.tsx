import { useState } from 'react';

const defaultSettings = [
  { label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin logins', enabled: true },
  { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity', enabled: true },
  { label: 'Login Notifications', desc: 'Email alert on new device login', enabled: false },
  { label: 'IP Whitelist', desc: 'Restrict access to specific IP addresses', enabled: false },
];

const defaultSessions = [
  { device: 'Chrome on Windows', location: 'Accra, Ghana', time: 'Today, 9:42 AM', current: true },
  { device: 'Safari on iPhone', location: 'Accra, Ghana', time: 'Yesterday, 6:15 PM', current: false },
  { device: 'Chrome on MacBook', location: 'Kumasi, Ghana', time: 'Apr 20, 2026', current: false },
];

export default function SecuritySection() {
  const [settings, setSettings] = useState(defaultSettings);
  const [sessions, setSessions] = useState(defaultSessions);

  const toggleSetting = (label: string) => {
    setSettings(prev => prev.map(s => s.label === label ? { ...s, enabled: !s.enabled } : s));
  };

  const revokeSession = (idx: number) => {
    setSessions(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Security Settings</h3>
        <div className="space-y-4">
          {settings.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-[hsl(var(--border))]">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{item.label}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => toggleSetting(item.label)}
                className={`relative w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 ${item.enabled ? 'bg-[#DC1F1F]' : 'bg-[hsl(var(--muted))]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-[hsl(var(--card))] rounded-full shadow transition-all ${item.enabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Recent Login Activity</h3>
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--muted))]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(220,31,31,0.08)' }}>
                <i className="ri-computer-line text-sm" style={{ color: '#DC1F1F' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{session.device}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{session.location} · {session.time}</p>
              </div>
              {session.current ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold">Current</span>
              ) : (
                <button onClick={() => revokeSession(i)} className="text-[10px] text-red-500 hover:text-red-600 cursor-pointer transition-colors">Revoke</button>
              )}
            </div>
          ))}
          {sessions.length === 1 && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-2">No other active sessions</p>
          )}
        </div>
      </div>
    </div>
  );
}
