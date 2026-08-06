// ─── components/common/PageHeader.jsx ────────────────────
import React from 'react';

/**
 * Consistent page header with title, subtitle, breadcrumbs, and action slot.
 */
const PageHeader = ({ title, subtitle, actions, breadcrumb }) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
    <div className="space-y-1">
      {breadcrumb && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {breadcrumb}
        </p>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {actions && (
      <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:self-end">
        {actions}
      </div>
    )}
  </div>
);

export default PageHeader;

