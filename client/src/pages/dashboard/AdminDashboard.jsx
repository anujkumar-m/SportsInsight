import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, Shield, Trophy, Activity, AlertTriangle,
  Target, ClipboardList, Grid, Brain, PlusCircle, FileText,
} from 'lucide-react';
import dashboardAPI from '../../services/dashboard.service';
import StatCard from '../../components/common/StatCard';
import { LineChart, BarChart, DoughnutChart } from '../../components/charts/Charts';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import QuickActionsBar from '../../components/common/QuickActionsBar';
import QuickActionModal from '../../components/common/QuickActionModal';
import ChartCard from '../../components/ui/ChartCard';
import Card, { CardHeader } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { COLORS, toNum } from '../../theme';

const spark = (n = 7, base = 50) =>
  Array.from({ length: n }, () => base + Math.round(Math.random() * 20 - 8));

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.getAdminDashboard()
      .then((res) => setData(res?.data || res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="page-shell">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => <LoadingSkeleton key={i} type="stat" />)}
        </div>
      </div>
    );
  }

  const { stats, topAthletes = [], charts = {}, recentActivities = [] } = data;
  const perfTrend = charts.performanceTrend || [];
  const fitTrend = charts.fitnessTrend || [];
  const sportWise = charts.sportWisePerformance || [];
  const rankDist = charts.rankingDistribution || {};
  const attTrend = charts.attendanceTrend || [];

  const trendLabels = [...new Set([
    ...perfTrend.map((d) => d.month),
    ...fitTrend.map((d) => d.month),
  ])].sort();

  const perfByMonth = Object.fromEntries(perfTrend.map((d) => [d.month, toNum(d.avg_score)]));
  const fitByMonth = Object.fromEntries(fitTrend.map((d) => [d.month, toNum(d.avg_fitness)]));

  const combinedTrendData = {
    labels: trendLabels.map((m) => {
      const [y, mo] = String(m).split('-');
      return new Date(Number(y), Number(mo) - 1).toLocaleDateString('en', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Performance',
        data: trendLabels.map((m) => perfByMonth[m] ?? null),
        borderColor: COLORS.brand,
        backgroundColor: 'rgba(37, 99, 235, 0.06)',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        spanGaps: true,
      },
      {
        label: 'Fitness',
        data: trendLabels.map((m) => fitByMonth[m] ?? null),
        borderColor: COLORS.success,
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        spanGaps: true,
      },
    ],
  };

  const sportPerfData = {
    labels: sportWise.map((s) => s.sport_name),
    datasets: [{
      label: 'Avg Performance',
      data: sportWise.map((s) => toNum(s.avg_performance)),
      backgroundColor: COLORS.brand,
      borderRadius: 6,
      maxBarThickness: 40,
    }],
  };

  const rankDistData = {
    labels: ['Elite', 'Advanced', 'Intermediate', 'Beginner'],
    datasets: [{
      data: [
        toNum(rankDist.elite),
        toNum(rankDist.advanced),
        toNum(rankDist.intermediate),
        toNum(rankDist.beginner),
      ],
      backgroundColor: [COLORS.brand, COLORS.success, COLORS.warning, COLORS.danger],
    }],
  };

  const attendanceData = {
    labels: attTrend.slice(-14).map((d) => new Date(d.date).getDate()),
    datasets: [
      {
        label: 'Present',
        data: attTrend.slice(-14).map((d) => toNum(d.present)),
        backgroundColor: COLORS.success,
        borderRadius: 4,
        maxBarThickness: 16,
      },
      {
        label: 'Absent',
        data: attTrend.slice(-14).map((d) => toNum(d.absent)),
        backgroundColor: COLORS.danger,
        borderRadius: 4,
        maxBarThickness: 16,
      },
    ],
  };

  const quickActions = [
    { label: 'Generate AI List', icon: Brain, primary: true, path: '/ai-generate' },
    { label: 'Add Athlete', icon: PlusCircle, onClick: () => setModalState({ isOpen: true, title: 'Add New Athlete', type: 'user' }) },
    { label: 'Add Coach', icon: UserCheck, onClick: () => setModalState({ isOpen: true, title: 'Add New Coach', type: 'user' }) },
    { label: 'Generate Report', icon: FileText, onClick: () => setModalState({ isOpen: true, title: 'Generate Academy Report', type: 'report' }) },
    { label: 'View Rankings', icon: Trophy, variant: 'emerald', onClick: () => navigate('/rankings') },
  ];

  return (
    <div className="page-shell">
      <div>
        <h2 className="page-title">Dashboard</h2>
        <p className="text-small text-muted mt-1">Academy performance overview and key metrics</p>
      </div>

      <QuickActionsBar actions={quickActions} />

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Athletes" value={stats.totalAthletes} icon={Users} color={COLORS.brand} change={5.2} changeType="up" sparkline={spark(8, stats.totalAthletes || 40)} delay={0} />
        <StatCard title="Total Coaches" value={stats.totalCoaches} icon={UserCheck} color={COLORS.success} change={2.1} changeType="up" sparkline={spark(8, 10)} delay={40} />
        <StatCard title="Total Selectors" value={stats.totalSelectors} icon={Shield} color={COLORS.warning} sparkline={spark(8, 5)} delay={80} />
        <StatCard title="Sports / Categories" value={`${stats.totalSports} / ${stats.totalCategories}`} icon={Grid} color={COLORS.brand} sparkline={spark(8, 8)} delay={120} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Today's Attendance" value={stats.todayAttendance} icon={ClipboardList} color={COLORS.warning} sparkline={spark(8, 20)} delay={160} />
        <StatCard title="Active Injuries" value={stats.activeInjuries} icon={AlertTriangle} color={COLORS.danger} change={-1.5} changeType="down" sparkline={spark(8, 4)} delay={200} />
        <StatCard title="Performance Score" value="86.4" suffix="/100" icon={Activity} color={COLORS.success} change={3.8} changeType="up" sparkline={spark(8, 80)} delay={240} />
      </div>

      {/* Charts middle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <ChartCard title="Performance & Fitness Trend" badge="6 months" className="lg:col-span-2 fade-in-1">
          <LineChart data={combinedTrendData} height={280} emptyMessage="No trend data yet" />
        </ChartCard>
        <ChartCard title="Ranking Distribution" className="fade-in-2">
          <DoughnutChart data={rankDistData} height={280} />
        </ChartCard>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <ChartCard title="Attendance (14 days)" badge="Present / Absent" badgeVariant="green" className="lg:col-span-2 fade-in-3">
          <BarChart data={attendanceData} height={280} emptyMessage="No attendance data yet" />
        </ChartCard>

        <Card className="fade-in-4 flex flex-col min-h-[320px]" hover>
          <CardHeader title="Recent Activities" />
          <div className="flex-1 overflow-y-auto space-y-1 max-h-[280px] -mx-1 px-1">
            {recentActivities.length === 0 ? (
              <EmptyState title="No activity" description="Recent academy activity will appear here." minHeight={160} />
            ) : recentActivities.map((act, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface transition-colors">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: act.type === 'performance' ? '#EFF6FF'
                      : act.type === 'fitness' ? '#F0FDF4' : '#F3F4F6',
                  }}
                >
                  {act.type === 'performance' ? <Activity size={16} className="text-brand" />
                    : act.type === 'fitness' ? <Target size={16} className="text-success" />
                    : <Users size={16} className="text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold text-text truncate">{act.name}</p>
                  <p className="text-xs text-muted truncate">
                    {act.detail}{act.score != null ? ` (${toNum(act.score).toFixed(1)})` : ''}
                  </p>
                  <p className="text-xs text-muted/70 mt-0.5">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sport-wise + table */}
      <ChartCard title="Sport-Wise Average Performance" badge="Academy" className="fade-in">
        <BarChart data={sportPerfData} height={280} emptyMessage="No sport-wise data yet" />
      </ChartCard>

      <Card hover>
        <CardHeader
          title="Top Ranked Athletes"
          action={
            <button type="button" onClick={() => navigate('/ai-generate')} className="text-small text-brand font-semibold hover:underline">
              View AI Rankings →
            </button>
          }
        />
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Athlete</th>
                <th>Sport</th>
                <th>Category</th>
                <th className="text-center">Score</th>
              </tr>
            </thead>
            <tbody>
              {topAthletes.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="No ranked athletes" minHeight={120} />
                  </td>
                </tr>
              ) : topAthletes.slice(0, 5).map((ath, idx) => (
                <tr key={idx}>
                  <td>
                    <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center">
                      #{ath.rank_position || idx + 1}
                    </span>
                  </td>
                  <td className="font-semibold">
                    {ath.first_name} {ath.last_name}
                    <span className="block text-xs font-medium text-muted">{ath.athlete_code}</span>
                  </td>
                  <td>{ath.sport_name}</td>
                  <td className="text-muted">{ath.category_name}</td>
                  <td className="text-center">
                    <span className="badge badge-blue">
                      {toNum(ath.overall_ranking_score).toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <QuickActionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        type={modalState.type}
      />
    </div>
  );
};

export default AdminDashboard;
