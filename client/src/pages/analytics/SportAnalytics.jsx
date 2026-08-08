import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { analyticsService } from '../../services/analyticsService';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const SportAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    analyticsService.getSports().then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingSkeleton rows={4} />;
  const { sportSummary = [] } = data || {};
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-foreground">Sport Analytics</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4">Athlete Count & Performance by Sport</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sportSummary}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="sport" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left"  dataKey="athlete_count"   name="Athletes"      fill="#6366f1" radius={[4,4,0,0]} />
            <Bar yAxisId="right" dataKey="avg_performance" name="Avg Perf Score" fill="#22d3ee" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>{['Sport','Athletes','Avg Performance','Avg Fitness'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sportSummary.map(s => (
              <tr key={s.id} className="hover:bg-secondary/30 transition">
                <td className="px-4 py-3 font-medium text-foreground">{s.sport}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.athlete_count}</td>
                <td className="px-4 py-3"><span className="font-bold text-primary">{s.avg_performance ?? '—'}</span></td>
                <td className="px-4 py-3"><span className="font-bold text-cyan-500">{s.avg_fitness ?? '—'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SportAnalytics;
