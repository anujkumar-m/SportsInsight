import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsService } from '../../services/analyticsService';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const CoachAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    analyticsService.getCoach().then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingSkeleton rows={4} />;
  const { coachStats = [] } = data || {};
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-foreground">Coach Analytics</h1>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4">Coach Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={coachStats.map(c => ({ ...c, name: `${c.first_name} ${c.last_name}` }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="avg_performance" name="Avg Athlete Perf" fill="#6366f1" radius={[4,4,0,0]} />
            <Bar dataKey="avg_fitness"     name="Avg Athlete Fitness" fill="#22d3ee" radius={[4,4,0,0]} />
            <Bar dataKey="attendance_pct"  name="Attendance %" fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>{['Coach','Sport','Athletes','Avg Perf','Avg Fitness','Attendance %'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coachStats.map(c => (
              <tr key={c.id} className="hover:bg-secondary/30 transition">
                <td className="px-4 py-3 font-medium text-foreground">{c.first_name} {c.last_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.sport || '—'}</td>
                <td className="px-4 py-3">{c.athlete_count}</td>
                <td className="px-4 py-3 font-bold text-primary">{c.avg_performance ?? '—'}</td>
                <td className="px-4 py-3 font-bold text-cyan-500">{c.avg_fitness ?? '—'}</td>
                <td className="px-4 py-3 font-bold text-amber-500">{c.attendance_pct ?? '—'}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoachAnalytics;
