// This section previously showed toggles defaulting to "enabled" (including
// Two-Factor Authentication) and a fake "Recent Login Activity" list with a
// working-looking "Revoke" button — none of it was wired to anything real,
// which is worse than showing nothing: an admin could reasonably believe
// 2FA was already protecting their account. Shown here as clearly
// not-yet-available instead, until real 2FA/session-tracking exists.
const settings = [
  { label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin logins' },
  { label: 'Session Timeout', desc: 'Auto-logout after inactivity' },
  { label: 'Login Notifications', desc: 'Email alert on new device login' },
  { label: 'IP Whitelist', desc: 'Restrict access to specific IP addresses' },
];

export default function SecuritySection() {
  return (
    <div className="space-y-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-1">Security Settings</h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">Not yet available. Coming in a future update.</p>
        <div className="space-y-4">
          {settings.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-[hsl(var(--border))] opacity-50">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{item.label}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{item.desc}</p>
              </div>
              <div className="relative w-11 h-6 rounded-full flex-shrink-0 bg-[hsl(var(--muted))] cursor-not-allowed">
                <div className="absolute top-1 left-1 w-4 h-4 bg-[hsl(var(--card))] rounded-full shadow" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
