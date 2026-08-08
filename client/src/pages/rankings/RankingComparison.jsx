import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { athleteService } from '../../services/athleteService';
import { rankingService } from '../../services/rankingService';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const RankingComparison = () => {
  const [athletes, setAthletes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    athleteService.getAthletes({ limit: 100 }).then(r => {
      const list = r.data.athletes || r.data || [];
      setAthletes(list);
      if (list.length >= 2) {
        setSelectedIds([list[0].id, list[1].id]);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedIds.length >= 2) {
      setLoading(true);
      rankingService.getComparison(selectedIds)
        .then(r => setComparison(r.data || []))
        .catch(() => setComparison([]))
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Ranking Formula Breakdown & Comparison"
        subtitle="Compare Performance (50%), Fitness (30%), and Consistency (20%) scores side-by-side"
      />

      {/* Select Athletes */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <label className="text-xs font-bold text-foreground block">Select Athletes to Compare (2 to 4):</label>
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
        <LoadingSkeleton rows={5} />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground">Score Component Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparison.map(c => ({ ...c, name: `${c.first_name} ${c.last_name}` }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="performance_score" name="Performance (50%)" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="fitness_score"     name="Fitness (30%)"     fill="#22d3ee" radius={[4,4,0,0]} />
              <Bar dataKey="consistency_score" name="Consistency (20%)" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RankingComparison;
