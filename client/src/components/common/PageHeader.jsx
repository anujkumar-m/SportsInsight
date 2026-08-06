// ─── components/common/PageHeader.jsx ────────────────────
import React from 'react';

/**
 * Consistent page header with title, subtitle, and action slot.
 */
const PageHeader = ({ title, subtitle, actions, breadcrumb }) => (
  <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
    <div>
      {breadcrumb && (
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {breadcrumb}
        </p>
      )}
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {actions && <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">{actions}</div>}
  </div>
);

export default PageHeader;
