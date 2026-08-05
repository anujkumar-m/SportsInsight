import React from 'react';

export const CardSkeleton = ({ rows = 3, height = 'h-4' }) => (
  <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1px solid #F1F5F9' }}>
    <div className="skeleton h-4 w-32" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={`skeleton ${height} w-full`} />
    ))}
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #F1F5F9' }}>
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-20" />
        <div className="skeleton h-3 w-28" />
      </div>
      <div className="skeleton w-12 h-12 rounded-xl" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
    <div className="p-5 border-b border-gray-50">
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
