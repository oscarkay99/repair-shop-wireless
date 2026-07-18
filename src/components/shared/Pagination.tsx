import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

function pages(page: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '...')[] = [1];
  if (page > 3) out.push('...');
  for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) out.push(i);
  if (page < total - 2) out.push('...');
  out.push(total);
  return out;
}

export default function Pagination({ page, pageCount, total, pageSize, onPageChange }: Props) {
  if (pageCount <= 1 && total === 0) return null;

  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  const outline: React.CSSProperties = {
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--muted-foreground))',
    background: 'transparent',
  };

  return (
    <div className="flex items-center justify-between pt-4 px-1">
      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
      </span>

      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40 transition-colors"
            style={outline}
            onMouseEnter={e => { if (page > 1) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pages(page, pageCount).map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs"
                style={{ color: 'hsl(var(--muted-foreground))' }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors"
                style={p === page
                  ? { background: 'hsl(var(--primary))', color: 'white', border: 'none' }
                  : outline}
                onMouseEnter={e => { if (p !== page) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                onMouseLeave={e => { if (p !== page) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === pageCount}
            className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40 transition-colors"
            style={outline}
            onMouseEnter={e => { if (page < pageCount) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
