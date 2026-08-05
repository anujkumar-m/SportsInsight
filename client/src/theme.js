/** Enterprise design tokens for JS (charts, badges) */
export const COLORS = {
  brand: '#2563EB',
  primary: '#2563EB',
  secondary: '#2563EB',
  success: '#22C55E',
  accent: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  sidebar: '#0F172A',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  info: '#2563EB',
  purple: '#2563EB',
};

export const CHART_PALETTE = [
  COLORS.brand,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  '#64748B',
  '#0EA5E9',
];

export const ROLE_COLORS = {
  admin:    { primary: '#2563EB', bg: '#EFF6FF', text: '#1D4ED8' },
  coach:    { primary: '#22C55E', bg: '#F0FDF4', text: '#15803D' },
  selector: { primary: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
  athlete:  { primary: '#2563EB', bg: '#EFF6FF', text: '#1D4ED8' },
};

export const toNum = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export const yScaleFromData = (values, { pad = 0.12, minFloor = 0 } = {}) => {
  const nums = (values || []).map(toNum).filter((n) => Number.isFinite(n));
  if (!nums.length) return { min: 0, max: 100, beginAtZero: true };

  let min = Math.min(...nums);
  let max = Math.max(...nums);

  if (min === max) {
    const delta = Math.max(Math.abs(min) * 0.1, 5);
    min = Math.max(minFloor, min - delta);
    max = max + delta;
  } else {
    const range = max - min;
    const padding = Math.max(range * pad, 2);
    min = Math.max(minFloor, min - padding);
    max = max + padding;
  }

  if (max <= 100 && min >= 0) {
    min = Math.floor(min / 5) * 5;
    max = Math.min(100, Math.ceil(max / 5) * 5);
    if (min === max) max = Math.min(100, max + 5);
  }

  return { min, max, beginAtZero: min === 0 };
};
