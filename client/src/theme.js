/** Design tokens for JS (charts, badges) — mirrors CSS variables */
export const COLORS = {
  brand: '#4F6BED',
  primary: '#4F6BED',
  secondary: '#4F6BED',
  success: '#2DB88A',
  accent: '#2DB88A',
  warning: '#E5A012',
  danger: '#E5484D',
  sidebar: '#1B2540',
  bg: '#F7F8FB',
  card: '#FFFFFF',
  text: '#2A3348',
  muted: '#6B7A90',
  border: '#E4E8F0',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  info: '#3B82C4',
  purple: '#4F6BED',
};

export const CHART_PALETTE = [
  COLORS.brand,
  COLORS.success,
  COLORS.warning,
  COLORS.info,
  COLORS.danger,
];

export const ROLE_COLORS = {
  admin: { primary: '#4F6BED', bg: '#EEF1FF', text: '#3B4FC4' },
  coach: { primary: '#2DB88A', bg: '#E8F8F2', text: '#1E8A66' },
  selector: { primary: '#E5A012', bg: '#FFF6E0', text: '#A87400' },
  athlete: { primary: '#4F6BED', bg: '#EEF1FF', text: '#3B4FC4' },
};

export const ROLE_LABELS = {
  admin: 'Academy Administrator',
  coach: 'Head Coach',
  selector: 'State Selector',
  athlete: 'Athlete',
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
