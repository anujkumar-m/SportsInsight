import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, Target, Activity, Heart, CalendarCheck, Brain } from 'lucide-react';
import dashboardAPI from '../../services/dashboard.service';
import StatCard from '../../components/common/StatCard';
import { LineChart, BarChart } from '../../components/charts/Charts';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import QuickActionsBar from '../../components/common/QuickActionsBar';
import QuickActionModal from '../../components/common/QuickActionModal';
import ChartCard from '../../components/ui/ChartCard';
import Card, { CardHeader } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';
import { COLORS, toNum } from '../../theme';

const CoachDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.getCoachDashboard()
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

  const { stats, athletes = [], charts = {} } = data;
  const perfTrend = charts.performanceTrend || [];
  const fitTrend = charts.fitnessTrend || [];

  const perfData = {
    labels: perfTrend.map((d) => d.month),
    datasets: [{
      label: 'Avg Squad Performance',
      data: perfTrend.map((d) => toNum(d.avg_score)),
      borderColor: COLORS.success,
      backgroundColor: 'rgba(34, 197, 94, 0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.35,
      pointRadius: 3,
    }],
  };

  const fitData = {
    labels: fitTrend.map((d) => d.month),
    datasets: [{
      label: 'Avg Squad Fitness',
      data: fitTrend.map((d) => toNum(d.avg_fitness)),
      backgroundColor: COLORS.brand,
      borderRadius: 6,
      maxBarThickness: 36,
    }],
  };

  const quickActions = [
    { label: 'Add Performance', icon: Activity, primary: true, onClick: () => setModalState({ isOpen: true, title: 'Record Athlete Performance', type: 'performance' }) },
    { label: 'Add Fitness', icon: Heart, variant: 'emerald', onClick: () => setModalState({ isOpen: true, title: 'Record Fitness Assessment', type: 'fitness' }) },
    { label: 'Mark Attendance', icon: CalendarCheck, onClick: () => setModalState({ isOpen: true, title: 'Mark Today Attendance', type: 'attendance' }) },
    { label: 'Generate AI List', icon: Brain, path: '/ai-generate' },
  ];

  return (
    <div className="page-shell">
      <div>
        <h2 className="page-title">Coach Dashboard</h2>
        <p className="text-small text-muted mt-1">Squad performance, fitness, and attendance</p>
      </div>

      <QuickActionsBar actions={quickActions} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assigned Athletes" value={stats.assignedAthletes} icon={Users} color={COLORS.brand} delay={0} />
        <StatCard title="Today's Attendance" value={stats.todayAttendance} icon={ClipboardList} color={COLORS.success} delay={40} />
        <StatCard title="Upcoming Assessments" value={stats.pendingAssessments} icon={Target} color={COLORS.danger} delay={80} />
        <StatCard title="Squad Performance" value="84.2%" icon={Activity} color={COLORS.brand} delay={120} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <ChartCard title="Squad Performance Trend" className="fade-in-1">
          <LineChart data={perfData} height={260} emptyMessage="No performance data yet" />
        </ChartCard>
        <ChartCard title="Squad Fitness Trend" className="fade-in-2">
          <BarChart data={fitData} height={260} emptyMessage="No fitness data yet" />
        </ChartCard>
      </div>

      <Card hover className="fade-in-3">
        <CardHeader
          title="Assigned Athletes"
          action={
            <button type="button" onClick={() => navigate('/ai-generate')} className="text-small text-brand font-semibold hover:underline">
              Generate Squad AI List →
            </button>
          }
        />
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Athlete</th>
                <th>Sport / Category</th>
                <th className="text-center">Avg Perf</th>
                <th className="text-center">Fitness</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {athletes.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="No athletes assigned" minHeight={120} />
                  </td>
                </tr>
              ) : athletes.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar firstName={a.first_name} lastName={a.last_name} role="athlete" size={32} />
                      <div>
                        <p className="text-small font-semibold">{a.first_name} {a.last_name}</p>
                        <p className="text-xs text-muted">{a.athlete_code}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-small">{a.sport_name}</p>
                    <p className="text-xs text-muted">{a.category_name}</p>
                  </td>
                  <td className="text-center">
                    <span className="badge badge-blue">{toNum(a.avg_performance).toFixed(1)}</span>
                  </td>
                  <td className="text-center">
                    <span className="badge badge-green">{toNum(a.latest_fitness).toFixed(1)}</span>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => setModalState({ isOpen: true, title: `Record for ${a.first_name}`, type: 'performance' })}
                      className="btn-outline !h-8 !px-3 !text-xs"
                    >
                      + Performance
                    </button>
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

export default CoachDashboard;
