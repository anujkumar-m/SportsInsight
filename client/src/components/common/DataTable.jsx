// ─── components/common/DataTable.jsx ─────────────────────
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Columns3 } from 'lucide-react';

/**
 * Reusable advanced data table with sorting, column visibility,
 * row selection, and empty state support.
 */
const DataTable = ({
  columns = [],          // [{key, label, render?, sortable?, width?}]
  data = [],             // rows
  loading = false,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  sortBy,
  sortDir,
  onSort,
  emptyText = 'No records found',
  rowKey = 'id',
  onRowClick,
}) => {
  const [hiddenCols, setHiddenCols] = useState([]);
  const [colMenuOpen, setColMenuOpen] = useState(false);

  const visibleCols = columns.filter((c) => !hiddenCols.includes(c.key));

  const handleSelectAll = (e) => {
    if (!onSelectionChange) return;
    onSelectionChange(e.target.checked ? data.map((r) => r[rowKey]) : []);
  };

  const handleSelectRow = (id) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    );
  };

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (sortBy === col.key) {
      return sortDir === 'ASC'
        ? <ChevronUp size={14} className="text-primary" />
        : <ChevronDown size={14} className="text-primary" />;
    }
    return <ChevronsUpDown size={14} className="opacity-30" />;
  };

  const Skeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((r) => (
        <tr key={r}>
          {selectable && <td className="px-4 py-3"><div className="skeleton h-4 w-4 rounded" /></td>}
          {visibleCols.map((c) => (
            <td key={c.key} className="px-4 py-3">
              <div className="skeleton h-4 rounded" style={{ width: c.width || '80%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  return (
    <div className="space-y-2">
      {/* ── Toolbar: sits entirely ABOVE the table, never overlaps ── */}
      <div className="flex items-center justify-between px-0.5">
        <div className="text-xs font-medium text-muted-foreground">
          {!loading && data.length > 0 && (
            <span>
              Showing <strong className="font-bold text-foreground">{data.length}</strong> record{data.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setColMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Toggle column visibility"
          >
            <Columns3 size={14} className="text-primary" />
            <span>Columns</span>
          </button>

          {colMenuOpen && (
            <>
              {/* Click-away backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setColMenuOpen(false)} />
              {/* Dropdown panel */}
              <div className="absolute right-0 top-9 z-50 min-w-[180px] rounded-xl border border-border bg-card p-2 shadow-xl">
                <p className="mb-1 border-b border-border px-2 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Toggle Columns
                </p>
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-secondary"
                  >
                    <input
                      type="checkbox"
                      className="cursor-pointer accent-primary"
                      checked={!hiddenCols.includes(col.key)}
                      onChange={() =>
                        setHiddenCols((prev) =>
                          prev.includes(col.key)
                            ? prev.filter((k) => k !== col.key)
                            : [...prev, col.key]
                        )
                      }
                    />
                    <span className="font-medium">{col.label || 'Actions'}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Main Table Container ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {selectable && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="cursor-pointer accent-primary"
                      checked={selectedIds.length === data.length && data.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                {visibleCols.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap ${
                      col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''
                    }`}
                    onClick={() => col.sortable && onSort?.(col.key)}
                    style={col.width ? { width: col.width } : {}}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <Skeleton />
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleCols.length + (selectable ? 1 : 0)}
                    className="py-16 text-center text-sm text-muted-foreground"
                  >
                    {emptyText}
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row[rowKey]}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors hover:bg-secondary/30 ${
                      selectedIds.includes(row[rowKey]) ? 'bg-primary/5' : ''
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="cursor-pointer accent-primary"
                          checked={selectedIds.includes(row[rowKey])}
                          onChange={() => handleSelectRow(row[rowKey])}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    {visibleCols.map((col) => (
                      <td key={col.key} className="px-4 py-3.5 text-sm text-foreground whitespace-nowrap">
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
