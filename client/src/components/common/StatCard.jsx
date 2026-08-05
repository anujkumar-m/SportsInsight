import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { COLORS } from '../../theme';

/** Tiny inline sparkline (SVG) — no chart lib dependency */
const Sparkline = ({ data = [], color = COLORS.brand }) => {
  if (!data.length) return null;
  const w = 72;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="opacity-80">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
};

/**
 * Enterprise KPI card: icon, title, value, trend %, optional sparkline.
 */
const StatCard = ({
  title,
  value,
  icon: Icon,
  color = COLORS.brand,
  bgColor,
  change,
  changeType = 'neutral',
  suffix = '',
  prefix = '',
  sparkline,
  delay = 0,
}) => {
  const bg = bgColor || `${color}14`;
  const ChangeIcon = changeType === 'up' ? TrendingUp : changeType === 'down' ? TrendingDown : Minus;
  const changeColor =
    changeType === 'up' ? COLORS.success : changeType === 'down' ? COLORS.danger : COLORS.muted;
  const changeBg =
    changeType === 'up' ? '#F0FDF4' : changeType === 'down' ? '#FEF2F2' : '#F3F4F6';

  const displayValue =
    value === null || value === undefined || value === ''
      ? '—'
      : typeof value === 'number'
        ? value.toLocaleString()
        : value;

  return (
    <div
      className="card card-hover stat-card fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: bg }}
          aria-hidden
        >
          {Icon && <Icon size={20} strokeWidth={2} style={{ color }} />}
        </div>
        {change !== undefined && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md"
            style={{ background: changeBg }}
          >
            <ChangeIcon size={12} style={{ color: changeColor }} />
            <span className="text-xs font-semibold" style={{ color: changeColor }}>
              {change > 0 ? '+' : ''}{change}%
            </span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 mt-auto">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1 truncate">
            {title}
          </p>
          <p className="page-title !text-[28px] sm:!text-[32px] leading-none truncate">
            {prefix}{displayValue}{suffix}
          </p>
        </div>
        {sparkline?.length > 0 && (
          <Sparkline data={sparkline} color={color} />
        )}
      </div>
    </div>
  );
};

export default StatCard;
