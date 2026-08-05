import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = '#2563EB',
  bgColor,
  change,
  changeType = 'neutral',
  suffix = '',
  prefix = '',
  delay = 0,
}) => {
  const bg = bgColor || `${color}14`;

  const ChangeIcon = changeType === 'up' ? TrendingUp : changeType === 'down' ? TrendingDown : Minus;
  const changeColor = changeType === 'up' ? '#10B981' : changeType === 'down' ? '#EF4444' : '#6B7280';

  return (
    <div
      className="bg-white rounded-2xl p-5 card-hover stat-card"
      style={{
        border: '1px solid #F1F5F9',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{title}</p>
          <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <ChangeIcon size={13} style={{ color: changeColor }} />
              <span className="text-xs font-medium" style={{ color: changeColor }}>
                {change > 0 ? '+' : ''}{change}% this month
              </span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: bg }}
        >
          {Icon && <Icon size={22} style={{ color }} />}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
