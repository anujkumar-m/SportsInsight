// ─── components/common/SearchFilterBar.jsx ────────────────
import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

/**
 * Reusable search + filter bar.
 * `filters` = array of { key, label, type: 'select'|'input', options?: [{value, label}] }
 */
const SearchFilterBar = ({
  search,
  onSearch,
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  placeholder = 'Search…',
  rightSlot,
}) => {
  const hasActive = Object.values(filterValues).some(Boolean);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.map((f) => (
        <div key={f.key} className="min-w-[140px]">
          {f.type === 'select' ? (
            <select
              value={filterValues[f.key] || ''}
              onChange={(e) => onFilterChange?.(f.key, e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{f.label}</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={f.type || 'text'}
              placeholder={f.label}
              value={filterValues[f.key] || ''}
              onChange={(e) => onFilterChange?.(f.key, e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>
      ))}

      {hasActive && (
        <button
          type="button"
          onClick={onClearFilters}
          className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X size={12} />
          Clear
        </button>
      )}

      {rightSlot && <div className="ml-auto flex items-center gap-2">{rightSlot}</div>}
    </div>
  );
};

export default SearchFilterBar;
