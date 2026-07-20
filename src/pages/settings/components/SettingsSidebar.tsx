interface Section {
  id: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

interface SettingsSidebarProps {
  sections: Section[];
  activeSection: string;
  onSelect: (id: string) => void;
}

export default function SettingsSidebar({ sections, activeSection, onSelect }: SettingsSidebarProps) {
  return (
    <>
      {/* Mobile: horizontal scrollable pill bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden" style={{ scrollbarWidth: 'none' }}>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`flex items-center gap-2 px-3.5 h-9 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeSection === s.id ? 'text-white' : 'text-muted-foreground border border-border'
            }`}
            style={activeSection === s.id ? { background: '#EC0118' } : {}}
          >
            <i className={`${s.icon} text-sm`} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden lg:block w-56 flex-shrink-0">
        <div className="bg-card rounded-2xl border border-border p-2 space-y-0.5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeSection === s.id ? 'text-white font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-background'
              }`}
              style={activeSection === s.id ? { background: '#EC0118' } : {}}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`${s.icon} text-sm`} />
              </div>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
