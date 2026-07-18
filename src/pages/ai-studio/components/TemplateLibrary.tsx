import { useState } from 'react';
import { promptTemplates } from '@/mocks/aiStudio';

const categories = ['All', 'Follow-ups', 'Campaigns', 'Summaries', 'Product'];

interface TemplateLibraryProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function TemplateLibrary({ selected, onSelect }: TemplateLibraryProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? promptTemplates
    : promptTemplates.filter((t) => t.category === activeCategory);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-3">Templates</p>
        <div className="space-y-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer"
              style={
                activeCategory === cat
                  ? { background: 'rgba(220,31,31,0.08)', color: '#DC1F1F', borderLeft: '2px solid #DC1F1F' }
                  : { color: 'hsl(var(--muted-foreground))' }
              }
              onMouseEnter={(e) => {
                if (activeCategory !== cat) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))';
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat) (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5">
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="w-full text-left p-3 rounded-xl transition-all cursor-pointer border"
            style={
              selected === t.id
                ? { background: 'rgba(220,31,31,0.06)', borderColor: 'rgba(220,31,31,0.20)' }
                : { borderColor: 'transparent' }
            }
            onMouseEnter={(e) => {
              if (selected !== t.id) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))';
            }}
            onMouseLeave={(e) => {
              if (selected !== t.id) (e.currentTarget as HTMLElement).style.background = '';
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <i className={`${t.icon} text-xs`} style={{ color: selected === t.id ? '#DC1F1F' : 'hsl(var(--muted-foreground))' }} />
              <span className="text-xs font-medium text-[hsl(var(--foreground))]">{t.name}</span>
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
