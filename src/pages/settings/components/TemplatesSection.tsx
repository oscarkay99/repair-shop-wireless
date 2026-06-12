interface MessageTemplate {
  id: string;
  name: string;
  channel: string;
  message: string;
}

import { useState } from 'react';

interface TemplatesSectionProps {
  templates: MessageTemplate[];
  editingTemplate: string | null;
  onEditToggle: (id: string) => void;
  onNewTemplate: () => void;
}

export default function TemplatesSection({ templates, editingTemplate, onEditToggle, onNewTemplate }: TemplatesSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyTemplate = (id: string, message: string) => {
    navigator.clipboard.writeText(message).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Message Templates</h3>
          <p className="text-xs text-slate-400 mt-0.5">Used for WhatsApp, SMS, and automated messages</p>
        </div>
        <button onClick={onNewTemplate} className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap bg-[#DC1F1F] hover:bg-[#B81616] transition-colors duration-150">
          <i className="ri-add-line mr-1" /> New Template
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {templates.map((t) => (
          <div key={t.id} className="p-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${t.channel === 'WhatsApp' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                    {t.channel}
                  </span>
                </div>
                {editingTemplate === t.id ? (
                  <textarea
                    defaultValue={t.message}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none"
                    rows={3}
                  />
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">{t.message}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Variables: {'{name}'}, {'{product}'}, {'{amount}'}, {'{date}'}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onEditToggle(t.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                >
                  <i className={`${editingTemplate === t.id ? 'ri-check-line text-green-500' : 'ri-edit-line text-slate-400'} text-sm`} />
                </button>
                <button
                  onClick={() => copyTemplate(t.id, t.message)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  title="Copy template"
                >
                  <i className={`${copiedId === t.id ? 'ri-check-line text-green-500' : 'ri-file-copy-line text-slate-400'} text-sm`} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
