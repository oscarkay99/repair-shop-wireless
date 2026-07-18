interface PrebuiltReport {
  id: string;
  name: string;
  type: string;
  period: string;
  generated: string;
  size: string;
  format: string;
}

interface Props {
  reports: PrebuiltReport[];
}

export default function ReportHistory({ reports }: Props) {
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
      <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Generated Reports</h3>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{reports.length} reports</span>
      </div>
      <div className="divide-y divide-[hsl(var(--border))]">
        {reports.map(report => (
          <div key={report.id} className="p-4 flex items-center gap-4 hover:bg-[hsl(var(--muted))]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: report.format === 'PDF' ? '#E05A2B15' : '#25D36615' }}>
              <i className={`${report.format === 'PDF' ? 'ri-file-pdf-line' : 'ri-file-excel-line'} text-sm`} style={{ color: report.format === 'PDF' ? '#E05A2B' : '#25D366' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{report.name}</p>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                <span>{report.type}</span>
                <span>{report.period}</span>
                <span>Generated: {report.generated}</span>
                <span>{report.size}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${report.format === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                {report.format}
              </span>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--muted))] cursor-pointer">
                <i className="ri-download-line text-[hsl(var(--muted-foreground))] text-sm" />
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--muted))] cursor-pointer">
                <i className="ri-share-forward-line text-[hsl(var(--muted-foreground))] text-sm" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
