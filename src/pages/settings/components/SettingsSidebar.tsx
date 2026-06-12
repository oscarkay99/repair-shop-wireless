interface Section {
  id: string;
  label: string;
  icon: string;
}

interface SettingsSidebarProps {
  sections: Section[];
  activeSection: string;
  onSelect: (id: string) => void;
}

export default function SettingsSidebar({ sections, activeSection, onSelect }: SettingsSidebarProps) {
  return (
    <div className="w-56 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-slate-100 p-2 space-y-0.5">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeSection === s.id ? 'text-white font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
            style={activeSection === s.id ? { background: '#DC1F1F' } : {}}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className={`${s.icon} text-sm`} />
            </div>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
