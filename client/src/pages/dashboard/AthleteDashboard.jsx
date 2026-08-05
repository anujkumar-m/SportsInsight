import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Activity, MessageSquare, Flame, Medal } from 'lucide-react';
import dashboardAPI from '../../services/dashboard.service';
import StatCard from '../../components/common/StatCard';
import { LineChart } from '../../components/charts/Charts';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ChartCard from '../../components/ui/ChartCard';
import Card, { CardHeader } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { COLORS, toNum } from '../../theme';

const AthleteDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    dashboardAPI.getAthleteDashboard()
      .then((res) => setData(res?.data || res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="page-shell">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <LoadingSkeleton key={i} type="stat" />)}
        </div>
      </div>
    );
  }

  const {
    athlete = {},
    attendancePercentage,
    ranking,
    latestFitness,
    avgPerformance,
    performanceHistory = [],
    coachRemarks = [],
  } = data;

  const perfData = {
    labels: performanceHistory.map((d) =>
      new Date(d.record_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      label: 'Performance Score',
      data: performanceHistory.map((d) => toNum(d.performance_score)),
      borderColor: COLORS.brand,
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.35,
      pointRadius: 3,
    }],
  };

  return (
    <div className="page-shell">
      <Card className="!bg-sidebar text-white border-0 overflow-hidden relative" padding>
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="section-title !text-white mb-1">Welcome back, {user?.firstName}</h2>
            <p className="text-small text-slate-300">
              {athlete.sport_name} · {athlete.category_name}
              {athlete.coach_first && ` · Coach: ${athlete.coach_first} ${athlete.coach_last}`}
            </p>
          </div>
          {ranking?.rank_position <= 3 ? (
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-2 rounded-xl">
              <Medal className="text-warning" size={22} />
              <div>
                <p className="text-xs text-slate-300 uppercase tracking-wide">Rank</p>
                <p className="font-bold text-white leading-none">#{ranking.rank_position}</p>
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 bg-white/10 rounded-xl border border-white/15 flex items-center justify-center">
              <Flame size={22} className="text-warning" />
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Avg Performance" value={toNum(avgPerformance).toFixed(1)} icon={Activity} color={COLORS.brand} delay={0} />
        <StatCard title="Overall Fitness" value={toNum(latestFitness?.overall_fitness_score).toFixed(1)} icon={Activity} color={COLORS.success} delay={40} />
        <StatCard title="Attendance" value={attendancePercentage ?? 0} suffix="%" icon={Calendar} color={COLORS.brand} delay={80} />
        <StatCard title="Academy Rank" value={ranking?.rank_position ? `#${ranking.rank_position}` : 'N/A'} icon={Trophy} color={COLORS.warning} delay={120} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <ChartCard title="My Performance Growth" badge="History" className="lg:col-span-2 fade-in-1">
          <LineChart data={perfData} height={260} emptyMessage="No performance data recorded yet." />
        </ChartCard>

        <Card className="fade-in-2 flex flex-col min-h-[320px]" hover>
          <CardHeader title="Recent Feedback" action={<MessageSquare size={18} className="text-muted" />} />
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[280px]">
            {coachRemarks.length === 0 ? (
              <EmptyState title="No feedback yet" minHeight={140} />
            ) : coachRemarks.map((remark, idx) => (
              <div key={idx} className="bg-surface rounded-xl p-4 border border-border">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={remark.remark_type === 'fitness' ? 'green' : 'blue'}>
                      {remark.remark_type}
                    </Badge>
                    <span className="text-xs text-muted">
                      {new Date(remark.remark_date).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-small font-bold bg-card px-2 py-0.5 rounded border border-border">
                    {toNum(remark.rating).toFixed(1)}
                  </span>
                </div>
                <p className="text-small text-text leading-relaxed">&ldquo;{remark.remarks}&rdquo;</p>
                <p className="text-xs text-muted mt-2">— Coach {remark.coach_last}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AthleteDashboard;
