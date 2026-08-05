import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
  Title as ChartTitle,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler, ChartTitle);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: { family: 'Inter', size: 12, weight: '500' },
        color: '#6B7280',
        boxWidth: 12,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: '#1F2937',
      titleColor: '#F9FAFB',
      bodyColor: '#D1D5DB',
      borderColor: '#374151',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
      ticks: { color: '#9CA3AF', font: { size: 11, family: 'Inter' } },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
      ticks: { color: '#9CA3AF', font: { size: 11, family: 'Inter' } },
      border: { display: false },
    },
  },
};

export const LineChart = ({ data, options = {}, height = 240 }) => {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: { ...defaultOptions.plugins, ...(options.plugins || {}) },
    scales: { ...defaultOptions.scales, ...(options.scales || {}) },
  };
  return (
    <div style={{ height }}>
      <Line data={data} options={mergedOptions} />
    </div>
  );
};

import { Bar } from 'react-chartjs-2';
export const BarChart = ({ data, options = {}, height = 240 }) => {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: { ...defaultOptions.plugins, ...(options.plugins || {}) },
  };
  return (
    <div style={{ height }}>
      <Bar data={data} options={mergedOptions} />
    </div>
  );
};

import { Doughnut } from 'react-chartjs-2';
export const DoughnutChart = ({ data, options = {}, height = 200 }) => {
  const mergedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { family: 'Inter', size: 12 }, color: '#6B7280', boxWidth: 12, padding: 12 },
      },
      tooltip: defaultOptions.plugins.tooltip,
    },
    cutout: '65%',
    ...options,
  };
  return (
    <div style={{ height }}>
      <Doughnut data={data} options={mergedOptions} />
    </div>
  );
};

import { Pie } from 'react-chartjs-2';
export const PieChart = ({ data, options = {}, height = 200 }) => {
  const mergedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { family: 'Inter', size: 12 }, color: '#6B7280', boxWidth: 12 },
      },
      tooltip: defaultOptions.plugins.tooltip,
    },
    ...options,
  };
  return (
    <div style={{ height }}>
      <Pie data={data} options={mergedOptions} />
    </div>
  );
};

export default LineChart;
