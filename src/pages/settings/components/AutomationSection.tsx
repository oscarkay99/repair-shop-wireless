interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: boolean;
  runs: number;
}

interface AutomationSectionProps {
  automations: AutomationRule[];
  onToggle: (id: string) => void;
  onNewRule: () => void;
}

export default function AutomationSection({ automations, onToggle, onNewRule }: AutomationSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Automation Rules</h3>
          <p className="text-xs text-slate-400 mt-0.5">{automations.filter(a => a.status).length} of {automations.length} rules active</p>
        </div>
        <button onClick={onNewRule} className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap bg-[#DC1F1F] hover:bg-[#B81616] transition-colors duration-150">
          <i className="ri-add-line mr-1" /> New Rule
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {automations.map((rule) => (
          <div key={rule.id} className="p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: rule.status ? 'rgba(220,31,31,0.08)' : '#F1F5F9' }}>
              <i className="ri-robot-2-line text-sm" style={{ color: rule.status ? '#DC1F1F' : '#94A3B8' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-slate-800">{rule.name}</p>
                <span className="text-[10px] text-slate-400">{rule.runs} runs</span>
              </div>
              <p className="text-xs text-slate-500 mb-0.5"><span className="font-medium text-slate-600">Trigger:</span> {rule.trigger}</p>
              <p className="text-xs text-slate-500"><span className="font-medium text-slate-600">Action:</span> {rule.action}</p>
            </div>
            <button onClick={() => onToggle(rule.id)} className={`relative w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 ${rule.status ? 'bg-[#DC1F1F]' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${rule.status ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
