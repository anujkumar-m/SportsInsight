import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Sparkles, Trophy, Award } from 'lucide-react';
import { comparisonService } from '../../services/comparisonService';
import { athleteService } from '../../services/athleteService';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const AthleteComparison = () => {
  const [athletes, setAthletes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    athleteService.getAthletes({ limit: 100 })
      .then(r => {
        const list = r?.athletes || r?.data?.athletes || r?.data || (Array.isArray(r) ? r : []);
        setAthletes(list);
        if (list.length >= 2) {
          setSelectedIds([list[0].id, list[1].id]);
        }
      })
      .catch(() => setAthletes([]));
  }, []);

  useEffect(() => {
    if (selectedIds.length >= 2) {
      setLoading(true);
      comparisonService.compare(selectedIds)
        .then(r => {
          const payload = r?.data?.data || r?.data || r || {};
          setComparisonData(payload);
        })
        .catch(() => setComparisonData(null))
        .finally(() => setLoading(false));
    }
  }, [selectedIds]);

  const toggleAthlete = (id) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (selectedIds.length < 4) setSelectedIds([...selectedIds, id]);
    }
  };

  const comparedAthletes = comparisonData?.athletes || [];
  const aiInsights = comparisonData?.aiInsights || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Side-by-Side Athlete Comparison"
        subtitle="Compare Performance, Fitness, Attendance, Rankings, Injury records & AI Potential Predictions"
      />

      {/* Select Athletes */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <label className="text-xs font-bold text-foreground block">Select 2 to 4 Athletes to Compare:</label>
        <div className="flex flex-wrap gap-2">
          {athletes.map(a => {
            const isSel = selectedIds.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggleAthlete(a.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition ${
                  isSel ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                }`}
              >
                {a.first_name} {a.last_name}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : comparedAthletes.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground rounded-2xl border border-border bg-card">
          Select at least 2 athletes to generate comparison.
        </div>
      ) : (
        <>
          {/* AI Potential Prediction Banner */}
          {aiInsights?.highestPotential && (
            <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Sparkles size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Future Potential Winner</span>
                  <h3 className="text-lg font-black text-foreground">{aiInsights.highestPotential.name}</h3>
                  <p className="text-xs text-muted-foreground">{aiInsights.highestPotential.reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {comparedAthletes.map((item, idx) => {
              const p = item.profile || {};
              const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Athlete #${p.id || idx + 1}`;
              return (
                <div key={p.id || idx} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center">
                      {p.first_name?.[0] || 'A'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{name}</h4>
                      <p className="text-[11px] text-muted-foreground">{p.sport || 'General'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Potential Score:</span>
                      <span className="font-bold text-primary">{item.potentialScore || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Performance:</span>
                      <span className="font-semibold text-foreground">{item.performance?.avg_perf ?? '—'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Fitness:</span>
                      <span className="font-semibold text-cyan-500">{item.fitness?.avg_fitness ?? '—'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Attendance:</span>
                      <span className="font-semibold text-amber-500">{item.attendance?.attendance_pct ?? 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Academy Rank:</span>
                      <span className="font-bold text-foreground">#{item.ranking?.rank_position || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side-by-side Metric Bar Chart */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground">Multi-Dimensional Comparative Metrics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { metric: 'Performance', ...Object.fromEntries(comparedAthletes.map(a => [a.profile?.first_name || `Ath ${a.profile?.id}`, a.performance?.avg_perf || 0])) },
                { metric: 'Fitness',     ...Object.fromEntries(comparedAthletes.map(a => [a.profile?.first_name || `Ath ${a.profile?.id}`, a.fitness?.avg_fitness || 0])) },
                { metric: 'Attendance',  ...Object.fromEntries(comparedAthletes.map(a => [a.profile?.first_name || `Ath ${a.profile?.id}`, a.attendance?.attendance_pct || 0])) },
                { metric: 'Potential',   ...Object.fromEntries(comparedAthletes.map(a => [a.profile?.first_name || `Ath ${a.profile?.id}`, a.potentialScore || 0])) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {comparedAthletes.map((a, idx) => (
                  <Bar key={a.profile?.id || idx} dataKey={a.profile?.first_name || `Ath ${a.profile?.id}`} fill={['#6366f1', '#22d3ee', '#f59e0b', '#10b981'][idx % 4]} radius={[4,4,0,0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default AthleteComparison;
