import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Sparkles, RefreshCw, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { rankingService } from '../../services/rankingService';
import { sportService } from '../../services/sportService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const RankingDashboard = () => {
  const navigate = useNavigate();

  const [rankings, setRankings] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const [rankType, setRankType] = useState('overall');
  const [sportId, setSportId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rankRes, sportRes] = await Promise.all([
        rankingService.getRankings({ rankType, sportId }).catch(() => ({ data: { rankings: [] } })),
        sportService.listSports().catch(() => ({ data: [] })),
      ]);
      setRankings(rankRes.data?.rankings || rankRes.data || []);
      setSports(sportRes.data || []);
    } catch (e) {
      toast.error('Failed to load rankings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [rankType, sportId]);

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      const res = await rankingService.calculate();
      toast.success(res.data.message || 'Rankings recalculated!');
      loadData();
    } catch (e) {
      toast.error('Failed to recalculate rankings.');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academy Leaderboard & Rankings"
        subtitle="Auto-calculated rankings using formula: 50% Performance + 30% Fitness + 20% Consistency Score"
        action={
          <Button size="sm" loading={calculating} onClick={handleRecalculate}>
            <RefreshCw size={14} className="mr-1.5" /> Recalculate Rankings
          </Button>
        }
      />

      {/* Formula Explanation & Filter Bar */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rank Category:</span>
            <div className="flex gap-1.5">
              {['overall', 'sport', 'category'].map(t => (
                <button
                  key={t}
                  onClick={() => setRankType(t)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    rankType === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <select
              value={sportId}
              onChange={(e) => setSportId(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
            >
              <option value="">All Sports</option>
              {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Formula breakdown card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-xl bg-primary/10 p-3 border border-primary/20">
            <span className="font-black text-primary text-base">50%</span>
            <p className="font-semibold text-foreground mt-0.5">Performance Score</p>
            <p className="text-[11px] text-muted-foreground">Match & Metric averages</p>
          </div>
          <div className="rounded-xl bg-cyan-500/10 p-3 border border-cyan-500/20">
            <span className="font-black text-cyan-500 text-base">30%</span>
            <p className="font-semibold text-foreground mt-0.5">Fitness Score</p>
            <p className="text-[11px] text-muted-foreground">Strength, stamina & BMI</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/20">
            <span className="font-black text-amber-500 text-base">20%</span>
            <p className="font-semibold text-foreground mt-0.5">Consistency Score</p>
            <p className="text-[11px] text-muted-foreground">Attendance & discipline</p>
          </div>
        </div>
      </div>

      {/* Rankings Leaderboard Table */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : rankings.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground rounded-2xl border border-border bg-card">
          No rankings generated yet for these filters. Click 'Recalculate Rankings' above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                {['Rank', 'Athlete', 'Sport / Category', 'Perf (50%)', 'Fitness (30%)', 'Consistency (20%)', 'Overall Score', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rankings.map((r, idx) => (
                <tr key={idx} className="hover:bg-secondary/30 transition">
                  <td className="px-4 py-3 font-black text-lg">
                    {r.rank_position === 1 ? (
                      <span className="text-amber-500 flex items-center gap-1"><Trophy size={16} /> #1</span>
                    ) : r.rank_position === 2 ? (
                      <span className="text-slate-400 flex items-center gap-1"><Medal size={16} /> #2</span>
                    ) : r.rank_position === 3 ? (
                      <span className="text-amber-700 flex items-center gap-1"><Medal size={16} /> #3</span>
                    ) : (
                      `#${r.rank_position}`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground">{r.first_name} {r.last_name}</div>
                    <div className="text-[11px] text-muted-foreground">{r.athlete_code}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{r.sport || 'General'}</div>
                    <div className="text-[10px]">{r.category || 'Open'}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">{r.performance_score || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-cyan-500">{r.fitness_score || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-amber-500">{r.consistency_score || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20">
                      {r.ranking_score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.medical_status === 'fit' ? 'success' : 'danger'}>
                      {r.medical_status || 'Active'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RankingDashboard;
