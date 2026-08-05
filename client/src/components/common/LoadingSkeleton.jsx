import React from 'react';

export const CardSkeleton = ({ rows = 3, height = 'h-4' }) => (
  <div className="card p-5 space-y-3">
    <div className="skeleton h-4 w-32" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={`skeleton ${height} w-full`} />
    ))}
  </div>
);

export const StatCardSkeleton = () => (
  <div className="card stat-card">
    <div className="flex items-start justify-between">
      <div className="skeleton w-10 h-10 rounded-xl" />
      <div className="skeleton h-6 w-12 rounded-lg" />
    </div>
    <div className="space-y-2">
      <div className="skeleton h-7 w-20" />
      <div className="skeleton h-3 w-28" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="card overflow-hidden">
    <div className="p-5 border-b border-border">
      <div className="skeleton h-5 w-40" />
    </div>
    <div className="divide-y divide-gray-50">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={`skeleton h-4 flex-1 ${j === 0 ? 'max-w-8' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const LoadingSkeleton = ({ type = 'card', ...props }) => {
  switch (type) {
    case 'stat': return <StatCardSkeleton {...props} />;
    case 'table': return <TableSkeleton {...props} />;
    default: return <CardSkeleton {...props} />;
  }
};

export default LoadingSkeleton;
