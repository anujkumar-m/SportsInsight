// ─── components/common/Pagination.jsx ─────────────────────
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page = 1, limit = 10, total = 0, onPageChange, onLimitChange }) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, parseInt(limit, 10) || 10);
  const safeTotal = Math.max(0, parseInt(total, 10) || 0);

  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));
  const start = safeTotal === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const end = Math.min(safePage * safeLimit, safeTotal);

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (safePage <= 3) return i + 1;
    if (safePage >= totalPages - 2) return totalPages - 4 + i;
    return safePage - 2 + i;
  });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3 px-1">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{start}</strong>–
          <strong className="text-foreground">{end}</strong> of{' '}
          <strong className="text-foreground">{safeTotal}</strong> results
        </span>
        <select
          value={limit}
          onChange={(e) => onLimitChange?.(Number(e.target.value))}
          className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="grid size-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`grid size-8 place-items-center rounded-lg text-xs font-medium transition-colors ${
              p === page
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:bg-secondary'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="grid size-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
