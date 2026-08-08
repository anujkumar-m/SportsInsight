import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Award, BarChart3, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { performanceService } from '../../services/performanceService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const PerformanceAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await performanceService.getAnalytics();
        setData(res.data);
      } catch (e) {
        toast.error('Failed to load performance analytics.');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading performance analytics...</div>;
  }

  const { summary, trends, topPerformers } = data || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Analytics & Intelligence"
        subtitle="Academy-wide metric trends, top performers leaderboard, and AI improvement forecasting."
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/performance')}>
            <ArrowLeft size={14} className="mr-1.5" /> Back to Records
          </Button>
        }
      />

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Total Assessments</div>
          <div className="text-3xl font-extrabold text-foreground">{summary?.total_records || 0}</div>
          <div className="text-xs text-muted-foreground">{summary?.total_athletes || 0} Athletes evaluated</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Academy Mean Score</div>
          <div className="text-3xl font-extrabold text-primary">{Math.round(summary?.avg_score || 0)} / 100</div>
          <div className="text-xs text-emerald-500 font-medium">Standardized benchmark</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Improving Trajectory</div>
          <div className="text-3xl font-extrabold text-emerald-500">{summary?.total_improved || 0}</div>
          <div className="text-xs text-muted-foreground">Positive velocity</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase">High Priority / Declining</div>
          <div className="text-3xl font-extrabold text-rose-500">{summary?.total_declining || 0}</div>
          <div className="text-xs text-rose-400 font-medium">Targeted drills required</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Performers Leaderboard */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Award size={18} className="text-amber-500" /> Top Performing Athletes Leaderboard
            </h3>
            <span className="text-xs text-muted-foreground">Ranked by AI Score</span>
          </div>

          <div className="space-y-3">
            {topPerformers?.map((item, idx) => (
              <div key={item.athlete_id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`grid size-7 place-items-center rounded-full font-bold text-xs ${
                    idx === 0 ? 'bg-amber-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-secondary text-muted-foreground'
                  }`}>
                    #{idx + 1}
                  </div>
                  {item.profile_photo ? (
                    <img src={item.profile_photo} alt="" className="size-9 rounded-full object-cover" />
                  ) : (
                    <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {item.first_name?.[0]}{item.last_name?.[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-foreground text-sm">{item.first_name} {item.last_name}</div>
                    <div className="text-xs text-muted-foreground">{item.sport_name || 'General'}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-primary">{Math.round(item.avg_score)}</div>
                  <div className="text-[10px] text-muted-foreground">Score Index</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend Snapshot */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" /> Monthly Trend Progress
          </h3>

          <div className="space-y-3">
            {trends?.map((t) => (
              <div key={t.month} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground">{t.month}</span>
                  <span className="text-primary font-bold">{Math.round(t.avg_score)} / 100 ({t.record_count} logs)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500"
                    style={{ width: `${Math.min(100, t.avg_score)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
