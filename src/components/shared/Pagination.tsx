interface Props {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (p: number) => void;
}

function pageRange(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (page > 3) pages.push('…');
  const lo = Math.max(2, page - 1);
  const hi = Math.min(total - 1, page + 1);
  for (let i = lo; i <= hi; i++) pages.push(i);
  if (page < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

export default function Pagination({ page, totalPages, total, from, to, onPageChange }: Props) {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-400">
        Showing <span className="font-semibold text-slate-600">{from}–{to}</span> of <span className="font-semibold text-slate-600">{total}</span>
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <i className="ri-arrow-left-s-line text-sm" />
          </button>
          {pageRange(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-slate-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  p === page ? 'text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
                style={p === page ? { background: '#DC1F1F' } : {}}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <i className="ri-arrow-right-s-line text-sm" />
          </button>
        </div>
      )}
    </div>
  );
}
