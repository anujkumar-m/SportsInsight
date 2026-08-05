import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
  Title as ChartTitle,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';
import { COLORS, toNum, yScaleFromData } from '../../theme';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler, ChartTitle
);

const deepMerge = (base, extra = {}) => {
  const out = { ...base };
  Object.keys(extra).forEach((key) => {
    if (
      extra[key] &&
      typeof extra[key] === 'object' &&
      !Array.isArray(extra[key]) &&
      base[key] &&
      typeof base[key] === 'object'
    ) {
      out[key] = deepMerge(base[key], extra[key]);
    } else {
      out[key] = extra[key];
    }
  });
  return out;
};

/** Ensure all numeric series are real numbers (MySQL decimals often arrive as strings) */
const normalizeChartData = (data) => {
  if (!data?.datasets) return data;
  return {
    ...data,
    datasets: data.datasets.map((ds) => ({
      ...ds,
      data: (ds.data || []).map((v) => (v == null || v === '' ? null : toNum(v))),
    })),
  };
};

const flattenDatasetValues = (data) => {
  if (!data?.datasets) return [];
  return data.datasets.flatMap((ds) =>
    (ds.data || []).filter((v) => v != null && v !== '').map(toNum)
  );
};

const hasChartData = (data) => {
  if (!data?.labels?.length || !data?.datasets?.length) return false;
  return flattenDatasetValues(data).length > 0;
};

const ChartEmpty = ({ height, message = 'No data available for this chart' }) => (
  <div className="empty-state" style={{ minHeight: height }}>
    <div className="empty-state-icon">
      <BarChart3 size={22} />
    </div>
    <p className="empty-state-title">Nothing to show</p>
    <p className="empty-state-desc">{message}</p>
  </div>
);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        font: { family: 'Inter', size: 12, weight: '500' },
        color: COLORS.gray500,
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: COLORS.primary,
      titleColor: '#F8FAFC',
      bodyColor: '#CBD5E1',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: 'Inter', size: 12, weight: '600' },
      bodyFont: { family: 'Inter', size: 12 },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(15,23,42,0.04)', drawBorder: false },
      ticks: { color: COLORS.gray400, font: { size: 11, family: 'Inter' }, maxRotation: 0 },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(15,23,42,0.04)', drawBorder: false },
      ticks: { color: COLORS.gray400, font: { size: 11, family: 'Inter' } },
      border: { display: false },
    },
  },
  layout: {
    padding: { top: 4, right: 8, bottom: 4, left: 4 },
  },
};

export const LineChart = ({ data, options = {}, height = 260, emptyMessage }) => {
  const normalized = normalizeChartData(data);
  if (!hasChartData(normalized)) {
    return <ChartEmpty height={height} message={emptyMessage} />;
  }

  const yScale = yScaleFromData(flattenDatasetValues(normalized));
  const mergedOptions = deepMerge(defaultOptions, {
    ...options,
    plugins: deepMerge(defaultOptions.plugins, options.plugins || {}),
    scales: deepMerge(
      {
        ...defaultOptions.scales,
        y: {
          ...defaultOptions.scales.y,
          min: yScale.min,
          max: yScale.max,
          beginAtZero: yScale.beginAtZero,
          ticks: {
            ...defaultOptions.scales.y.ticks,
            callback: (v) => (Number.isInteger(v) ? v : Number(v).toFixed(1)),
          },
        },
      },
      options.scales || {}
    ),
  });

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <Line data={normalized} options={mergedOptions} />
    </div>
  );
};

export const BarChart = ({ data, options = {}, height = 260, emptyMessage, horizontal = false }) => {
  const normalized = normalizeChartData(data);
  if (!hasChartData(normalized)) {
    return <ChartEmpty height={height} message={emptyMessage} />;
  }

  const yScale = yScaleFromData(flattenDatasetValues(normalized));
  const valueAxis = horizontal ? 'x' : 'y';
  const categoryAxis = horizontal ? 'y' : 'x';

  const mergedOptions = deepMerge(defaultOptions, {
    indexAxis: horizontal ? 'y' : 'x',
    plugins: deepMerge(defaultOptions.plugins, options.plugins || {}),
    scales: deepMerge(
      {
        ...defaultOptions.scales,
        [valueAxis]: {
          ...defaultOptions.scales.y,
          min: yScale.beginAtZero ? 0 : yScale.min,
          max: yScale.max,
          beginAtZero: true,
          ticks: {
            ...defaultOptions.scales.y.ticks,
            callback: (v) => (Number.isInteger(v) ? v : Number(v).toFixed(1)),
          },
        },
        [categoryAxis]: {
          ...defaultOptions.scales.x,
          grid: { display: false },
        },
      },
      options.scales || {}
    ),
    layout: deepMerge(defaultOptions.layout, {
      padding: { top: 8, right: 12, bottom: 16, left: 4, ...(options.layout?.padding || {}) },
    }),
  });

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <Bar data={normalized} options={mergedOptions} />
    </div>
  );
};

const percentPlugin = {
  id: 'doughnutPercent',
  afterDraw(chart) {
    if (chart.config.type !== 'doughnut' && chart.config.type !== 'pie') return;
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];
    if (!dataset || !meta?.data?.length) return;

    const total = dataset.data.reduce((a, b) => a + toNum(b), 0);
    if (total <= 0) return;

    meta.data.forEach((arc, i) => {
      const value = toNum(dataset.data[i]);
      if (value <= 0) return;
      const pct = Math.round((value / total) * 100);
      if (pct < 6) return;

      const { x, y } = arc.tooltipPosition();
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 2;
      ctx.fillText(`${pct}%`, x, y);
      ctx.restore();
    });
  },
};

ChartJS.register(percentPlugin);

const buildArcOptions = (data, options = {}) => {
  const total = flattenDatasetValues(data).reduce((a, b) => a + b, 0);

  return deepMerge(
    {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Inter', size: 11, weight: '500' },
            color: COLORS.gray500,
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 14,
            generateLabels(chart) {
              const ds = chart.data.datasets[0];
              if (!ds) return [];
              const sum = ds.data.reduce((a, b) => a + toNum(b), 0) || 1;
              return chart.data.labels.map((label, i) => {
                const value = toNum(ds.data[i]);
                const pct = Math.round((value / sum) * 100);
                const bg = Array.isArray(ds.backgroundColor)
                  ? ds.backgroundColor[i]
                  : ds.backgroundColor;
                return {
                  text: `${label} (${pct}%)`,
                  fillStyle: bg,
                  strokeStyle: '#fff',
                  lineWidth: 2,
                  hidden: false,
                  index: i,
                };
              });
            },
          },
        },
        tooltip: {
          ...defaultOptions.plugins.tooltip,
          callbacks: {
            label(ctx) {
              const value = toNum(ctx.raw);
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return ` ${ctx.label}: ${value} (${pct}%)`;
            },
          },
        },
      },
      layout: { padding: 8 },
    },
    options
  );
};

const withArcColors = (data) => {
  const normalized = normalizeChartData(data);
  if (!normalized?.datasets?.[0]) return normalized;

  const ds = normalized.datasets[0];
  const count = ds.data.length;
  const palette = Array.isArray(ds.backgroundColor) && ds.backgroundColor.length >= count
    ? ds.backgroundColor
    : [COLORS.secondary, COLORS.accent, COLORS.warning, COLORS.danger].slice(0, count);

  return {
    ...normalized,
    datasets: [{
      ...ds,
      backgroundColor: palette,
      borderColor: '#FFFFFF',
      borderWidth: 3,
      hoverOffset: 6,
      hoverBorderColor: '#FFFFFF',
    }],
  };
};

export const DoughnutChart = ({ data, options = {}, height = 240, emptyMessage }) => {
  const prepared = withArcColors(data);
  const values = flattenDatasetValues(prepared);
  if (!values.length || values.every((v) => v === 0)) {
    return <ChartEmpty height={height} message={emptyMessage || 'No ranking distribution data'} />;
  }

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <Doughnut data={prepared} options={buildArcOptions(prepared, options)} />
    </div>
  );
};

export const PieChart = ({ data, options = {}, height = 240, emptyMessage }) => {
  const prepared = withArcColors(data);
  const values = flattenDatasetValues(prepared);
  if (!values.length || values.every((v) => v === 0)) {
    return <ChartEmpty height={height} message={emptyMessage || 'No distribution data'} />;
  }

  const pieOptions = buildArcOptions(prepared, { cutout: 0, ...options });

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <Pie data={prepared} options={pieOptions} />
    </div>
  );
};

export default LineChart;
