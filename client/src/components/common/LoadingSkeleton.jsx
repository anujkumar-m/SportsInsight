import React from 'react';
import { getRouteMeta } from '../../utils/routeMeta';

/* ─── Base Shimmer Block ─────────────────────────────────── */
const S = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

/* ─── Stat Card Skeleton ─────────────────────────────────── */
export const StatCardSkeleton = () => (
  <div className="surface-card p-5 space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-2 flex-1">
        <S className="h-3 w-24 rounded-full" />
        <S className="h-7 w-16 rounded-lg" />
      </div>
      <S className="size-10 rounded-xl shrink-0" />
    </div>
    <S className="h-3 w-28 rounded-full" />
  </div>
);

/* ─── Filter Bar Skeleton ────────────────────────────────── */
export const FilterBarSkeleton = ({ fields = 4 }) => (
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="flex flex-wrap items-center gap-3">
      <S className="h-9 flex-1 min-w-[200px] rounded-lg" />
      {Array.from({ length: fields - 1 }).map((_, i) => (
        <S key={i} className="h-9 w-36 rounded-lg" />
      ))}
      <S className="h-9 w-20 rounded-lg" />
    </div>
  </div>
);

/* ─── Table Skeleton ─────────────────────────────────────── */
export const TableSkeleton = ({ rows = 6, cols = 5 }) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
    <div className="flex items-center gap-4 border-b border-border bg-secondary/40 px-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <S key={i} className={`h-3 rounded-full ${i === 0 ? 'w-24' : i === cols - 1 ? 'w-16' : 'flex-1'}`} />
      ))}
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, ci) => (
            <S key={ci} className={`h-4 rounded-full ${ci === 0 ? 'w-32' : ci === cols - 1 ? 'w-16' : 'flex-1'} ${ri % 2 === 1 ? 'opacity-60' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/* ─── Chart Panel Skeleton ───────────────────────────────── */
export const ChartSkeleton = ({ height = 280 }) => (
  <div className="surface-card p-5 min-w-0">
    <div className="mb-4 flex items-center justify-between">
      <S className="h-4 w-44 rounded-full" />
      <S className="h-6 w-24 rounded-lg" />
    </div>
    <div className="flex items-end gap-2" style={{ height }}>
      {[55, 80, 40, 90, 65, 75, 50, 85, 60, 70].map((h, i) => (
        <S
          key={i}
          className="flex-1 rounded-t-md"
          style={{ height: `${h}%`, opacity: 0.5 + (i % 3) * 0.15 }}
        />
      ))}
    </div>
  </div>
);

/* ─── Dashboard Panel Skeleton ───────────────────────────── */
export const PanelSkeleton = () => (
  <div className="surface-card p-5 min-w-0 space-y-3">
    <div className="flex items-center justify-between mb-4">
      <S className="h-4 w-40 rounded-full" />
      <S className="h-7 w-24 rounded-lg" />
    </div>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <S className="size-8 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <S className="h-3.5 rounded-full w-full" />
          <S className="h-2.5 rounded-full w-3/4 opacity-60" />
        </div>
        <S className="h-5 w-14 rounded-full shrink-0" />
      </div>
    ))}
  </div>
);

/* ─── Profile Header Skeleton ────────────────────────────── */
export const ProfileHeaderSkeleton = () => (
  <div className="surface-card overflow-hidden">
    <S className="h-32 sm:h-40 w-full rounded-none rounded-t-xl" />
    <div className="px-5 pb-5">
      <div className="flex flex-wrap items-end gap-4 -mt-10 mb-4">
        <S className="size-20 rounded-2xl ring-4 ring-card shrink-0" />
        <div className="flex-1 min-w-[180px] space-y-2 pt-12">
          <S className="h-5 w-48 rounded-full" />
          <S className="h-3.5 w-36 rounded-full opacity-70" />
        </div>
        <div className="flex gap-2 pt-1">
          <S className="h-8 w-24 rounded-lg" />
          <S className="h-8 w-24 rounded-lg opacity-70" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {[1, 2, 3, 4].map((i) => (
          <S key={i} className="h-8 w-28 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

/* ─── Tabs Skeleton ──────────────────────────────────────── */
export const TabsSkeleton = ({ tabs = 5 }) => (
  <div className="flex gap-1 border-b border-border pb-px">
    {Array.from({ length: tabs }).map((_, i) => (
      <S key={i} className={`h-10 rounded-t-xl ${i === 0 ? 'w-28' : 'w-24'} ${i !== 0 ? 'opacity-50' : ''}`} />
    ))}
  </div>
);

/* ─── Page Header Skeleton ───────────────────────────────── */
export const PageHeaderSkeleton = () => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div className="space-y-2">
      <S className="h-3 w-32 rounded-full opacity-60" />
      <S className="h-7 w-56 rounded-lg" />
      <S className="h-3.5 w-80 rounded-full opacity-70" />
    </div>
    <div className="flex gap-2">
      <S className="h-9 w-28 rounded-xl" />
      <S className="h-9 w-28 rounded-xl opacity-60" />
    </div>
  </div>
);

/* ─── List Item Skeleton ─────────────────────────────────── */
export const ListItemSkeleton = ({ items = 5 }) => (
  <div className="surface-card overflow-hidden">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i !== items - 1 ? 'border-b border-border/60' : ''}`}>
        <S className="size-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <S className={`h-3.5 rounded-full ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`} />
          <S className="h-2.5 rounded-full w-2/5 opacity-60" />
        </div>
        <S className="h-5 w-16 rounded-full shrink-0" />
      </div>
    ))}
  </div>
);

/* ─── Form Skeleton ──────────────────────────────────────── */
export const FormSkeleton = ({ fields = 6 }) => (
  <div className="surface-card p-6 space-y-5">
    <S className="h-5 w-40 rounded-full mb-2" />
    <div className="grid gap-5 sm:grid-cols-2">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <S className="h-3 w-24 rounded-full opacity-70" />
          <S className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
    <div className="flex gap-3 pt-2">
      <S className="h-10 w-32 rounded-xl" />
      <S className="h-10 w-24 rounded-xl opacity-60" />
    </div>
  </div>
);

/* ─── Blur Overlay Container ─────────────────────────────── */
export const BlurredLoadingWrapper = ({ title, subtitle, icon, children }) => {
  const meta = title ? { title, subtitle } : getRouteMeta(typeof window !== 'undefined' ? window.location.pathname : '');
  const Icon = icon || meta.icon;

  return (
    <div className="relative w-full min-h-[350px]">
      {/* Blurred background skeleton */}
      <div className="filter blur-[3px] opacity-40 select-none pointer-events-none transition-all duration-300">
        {children}
      </div>

      {/* Floating Glassmorphic Indicator */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-border/80 bg-card/95 px-6 py-5 shadow-2xl backdrop-blur-md max-w-sm text-center animate-in fade-in zoom-in-95 duration-150">
          <div className="relative flex items-center justify-center">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              {Icon ? <Icon size={22} className="animate-pulse" /> : <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
            </div>
            <div className="absolute -inset-1 rounded-2xl border-2 border-primary/30 border-t-primary animate-spin" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              Loading {meta.title || 'Page'}...
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {meta.subtitle || 'Fetching the latest data and analytics...'}
            </p>
          </div>

          <div className="w-32 h-1 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary animate-pulse rounded-full w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Dashboard Grid Skeleton ────────────────────────────── */
export const DashboardSkeleton = ({ title, subtitle }) => (
  <BlurredLoadingWrapper title={title} subtitle={subtitle}>
    <div className="space-y-6 fade-in">
      <PageHeaderSkeleton />
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartSkeleton height={280} />
        </div>
        <PanelSkeleton />
      </div>
      <FilterBarSkeleton />
      <TableSkeleton rows={6} cols={5} />
    </div>
  </BlurredLoadingWrapper>
);

/* ─── List Page Skeleton ─────────────────────────────────── */
export const ListPageSkeleton = ({ cols = 5, title, subtitle }) => (
  <BlurredLoadingWrapper title={title} subtitle={subtitle}>
    <div className="space-y-5 fade-in">
      <PageHeaderSkeleton />
      <FilterBarSkeleton />
      <TableSkeleton rows={8} cols={cols} />
      <div className="flex items-center justify-between px-1">
        <S className="h-4 w-32 rounded-full opacity-60" />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <S key={i} className="size-8 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </BlurredLoadingWrapper>
);

/* ─── Full-page Route Loader (Suspense fallback) ─────────── */
export const RouteLoader = ({ title, subtitle }) => (
  <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 relative">
    {/* Top loading progress bar */}
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-secondary overflow-hidden">
      <div className="h-full bg-gradient-to-r from-primary via-blue-500 to-accent animate-pulse" style={{ width: '70%' }} />
    </div>
    <div className="max-w-7xl mx-auto">
      <DashboardSkeleton title={title} subtitle={subtitle} />
    </div>
  </div>
);

/* ─── Main context-aware dispatcher ─────────────────────── */
const LoadingSkeleton = ({ type = 'card', rows, cols, title, subtitle, ...props }) => {
  switch (type) {
    case 'stat':        return <StatCardSkeleton />;
    case 'filter':      return <FilterBarSkeleton {...props} />;
    case 'table':       return <TableSkeleton rows={rows} cols={cols} />;
    case 'chart':       return <ChartSkeleton {...props} />;
    case 'panel':       return <PanelSkeleton />;
    case 'profile':     return <ProfileHeaderSkeleton />;
    case 'tabs':        return <TabsSkeleton {...props} />;
    case 'list':        return <ListItemSkeleton items={rows} />;
    case 'form':        return <FormSkeleton {...props} />;
    case 'page-header': return <PageHeaderSkeleton />;
    case 'dashboard':   return <DashboardSkeleton title={title} subtitle={subtitle} />;
    case 'list-page':   return <ListPageSkeleton cols={cols} title={title} subtitle={subtitle} />;
    case 'route':       return <RouteLoader title={title} subtitle={subtitle} />;
    default:            return (
      <div className="surface-card p-5 space-y-3">
        <S className="h-4 w-32 rounded-full" />
        {Array.from({ length: rows || 3 }).map((_, i) => (
          <S key={i} className="h-4 w-full rounded-full" />
        ))}
      </div>
    );
  }
};

export default LoadingSkeleton;
