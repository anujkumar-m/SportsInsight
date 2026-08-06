import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export function StatCard({ label, value, icon: Icon, delta, tone = 'primary' }) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-destructive/10 text-destructive',
    info: 'bg-info/15 text-info',
  }[tone];

  return (
    <div className="surface-card p-5 transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="size-5" />
        </span>
      </div>
      {delta !== undefined && (
        <p
          className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
            delta >= 0 ? 'text-success' : 'text-destructive'
          }`}
        >
          {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {Math.abs(delta)}% vs last cycle
        </p>
      )}
    </div>
  );
}

export function Panel({ title, description, action, children, className = '' }) {
  return (
    <section className={`surface-card p-5 ${className}`}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function ScoreBar({ value, tone = 'primary' }) {
  const bg = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning' }[tone];
  const num = Number(value) || 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${bg}`} style={{ width: `${Math.min(100, num)}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{num}</span>
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    Selected: 'bg-success/15 text-success',
    Shortlisted: 'bg-info/15 text-info',
    'In Training': 'bg-primary/10 text-primary',
    Recovering: 'bg-warning/15 text-warning',
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${map[status] || 'bg-secondary text-muted-foreground'}`}
    >
      {status}
    </span>
  );
}
