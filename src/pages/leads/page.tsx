import { useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { useLeads } from '@/hooks/useLeads';
import type { LeadStatus } from '@/types/lead';
import LeadDetail from './components/LeadDetail';
import AddLeadModal from './components/AddLeadModal';

const statusConfig: Record<string, { label: string; color: string; border: string; bg: string }> = {
  hot: { label: 'Hot', color: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50' },
  warm: { label: 'Warm', color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' },
  cold: { label: 'Cold', color: 'text-slate-500', border: 'border-slate-200', bg: 'bg-slate-50' },
};

const sourceIcons: Record<string, string> = {
  WhatsApp: 'ri-whatsapp-line',
  Instagram: 'ri-instagram-line',
  'Walk-in': 'ri-walk-line',
  Referral: 'ri-user-shared-line',
  SMS: 'ri-message-2-line',
};

export default function LeadsPage() {
  const { leads, add, move } = useLeads();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addStatus, setAddStatus] = useState<LeadStatus>('warm');

  const columns = ['hot', 'warm', 'cold'] as const;
  const leadStats = [
    { label: 'Total Leads',  value: leads.length,                                      icon: 'ri-user-star-line',    accent: 'bg-[#DC1F1F]' },
    { label: 'Hot Leads',    value: leads.filter(l => l.status === 'hot').length,       icon: 'ri-fire-line',         accent: 'bg-red-500' },
    { label: 'Quote Ready',  value: leads.filter(l => l.quoteReady).length,             icon: 'ri-file-list-3-line',  accent: 'bg-emerald-500' },
    { label: 'Warm Leads',   value: leads.filter(l => l.status === 'warm').length,      icon: 'ri-temp-hot-line',     accent: 'bg-amber-500' },
  ];

  const lead = selected ? leads.find((l) => l.id === selected) : null;

  return (
    <AdminLayout title="Leads" subtitle="Pipeline, follow-ups, and conversion tracking">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {leadStats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.accent} rounded-l-2xl`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <i className={`${s.icon} text-lg`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-sm">
          <div className="w-4 h-4 flex items-center justify-center text-slate-400">
            <i className="ri-search-line text-sm" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="bg-transparent text-sm text-slate-600 outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'WhatsApp', 'Instagram', 'Walk-in', 'Referral'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filter === f ? 'bg-[#DC1F1F] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'All Sources' : f}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setAddStatus('warm'); setShowAdd(true); }}
          className="flex items-center gap-2 bg-[#DC1F1F] hover:bg-[#B81616] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors duration-150 cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line text-sm" />
          New Lead
        </button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const q = search.trim().toLowerCase();
          const colLeads = leads.filter((l) => {
            const matchStatus = l.status === col;
            const matchSource = filter === 'all' || l.source === filter;
            const matchSearch = !q || l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.product.toLowerCase().includes(q);
            return matchStatus && matchSource && matchSearch;
          });
          const cfg = statusConfig[col];
          return (
            <div key={col} className="flex flex-col">
              <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border ${cfg.border} ${cfg.bg}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs bg-white text-slate-500 px-2 py-0.5 rounded-full font-medium">{colLeads.length}</span>
                </div>
                <button
                  onClick={() => { setAddStatus(col); setShowAdd(true); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/50 text-slate-400 cursor-pointer transition-all"
                >
                  <i className="ri-add-line text-sm" />
                </button>
              </div>
              <div className={`flex-1 border-x border-b ${cfg.border} rounded-b-2xl p-3 space-y-3 min-h-[300px]`}>
                {colLeads.length === 0 && (
                  <div className="h-full flex items-center justify-center py-8">
                    <p className="text-[11px] text-slate-300">No leads</p>
                  </div>
                )}
                {colLeads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => setSelected(l.id)}
                    className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                          {l.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{l.name}</p>
                          <p className="text-[10px] text-slate-400">{l.phone}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 flex items-center justify-center ${l.source === 'WhatsApp' ? 'text-[#25D366]' : l.source === 'Instagram' ? 'text-pink-500' : 'text-slate-400'}`}>
                        <i className={`${sourceIcons[l.source]} text-sm`} />
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">{l.product}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{l.lastContact}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{l.assigned}</span>
                    </div>
                    {l.quoteReady && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className="w-3 h-3 flex items-center justify-center text-emerald-500">
                          <i className="ri-file-list-3-line text-xs" />
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium">Quote Ready</span>
                      </div>
                    )}
                    {/* Hover actions */}
                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`tel:${l.phone}`} onClick={(e) => e.stopPropagation()} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer transition-all">
                        <i className="ri-phone-line text-sm" />
                      </a>
                      <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-emerald-500 cursor-pointer transition-all">
                        <i className="ri-whatsapp-line text-sm" />
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); move(l.id, col === 'hot' ? 'warm' : col === 'warm' ? 'cold' : 'hot'); }}
                        title="Move to next stage"
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer transition-all"
                      >
                        <i className="ri-arrow-right-line text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {lead && <LeadDetail lead={lead} onClose={() => setSelected(null)} />}
      {showAdd && (
        <AddLeadModal
          defaultStatus={addStatus}
          onSave={add}
          onClose={() => setShowAdd(false)}
        />
      )}
    </AdminLayout>
  );
}