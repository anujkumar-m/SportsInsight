import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Shield, Trophy, Activity, AlertTriangle, Target, ClipboardList } from 'lucide-react';
import dashboardAPI from '../../services/dashboard.service';
import StatCard from '../../components/common/StatCard';
import { LineChart, BarChart, DoughnutChart } from '../../components/charts/Charts';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getAdminDashboard()
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <LoadingSkeleton key={i} type="stat" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><LoadingSkeleton rows={6} /></div>
          <div><LoadingSkeleton rows={6} /></div>
        </div>
      </div>
    );
  }

  const { stats, topAthletes, charts, recentActivities } = data;

  // Prepare chart data
  const perfData = {
    labels: charts.performanceTrend.map(d => d.month),
    datasets: [{
      label: 'Avg Performance Score',
      data: charts.performanceTrend.map(d => d.avg_score),
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    }]
  };

  const attData = {
    labels: charts.attendanceTrend.map(d => new Date(d.date).getDate()),
    datasets: [
      {
        label: 'Present',
        data: charts.attendanceTrend.map(d => d.present),
        backgroundColor: '#10B981',
      },
      {
        label: 'Absent',
        data: charts.attendanceTrend.map(d => d.absent),
        backgroundColor: '#EF4444',
      }
    ]
  };

  const rankDistData = {
    labels: ['Elite (85+)', 'Advanced (70-84)', 'Intermediate (55-69)', 'Beginner (<55)'],
    datasets: [{
      data: [
        charts.rankingDistribution.elite,
        charts.rankingDistribution.advanced,
        charts.rankingDistribution.intermediate,
        charts.rankingDistribution.beginner
      ],
      backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
    }]
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Athletes" value={stats.totalAthletes} icon={Users} color="#2563EB" change={5.2} changeType="up" delay={0} />
        <StatCard title="Total Coaches" value={stats.totalCoaches} icon={UserCheck} color="#10B981" change={2.1} changeType="up" delay={100} />
        <StatCard title="Active Injuries" value={stats.activeInjuries} icon={AlertTriangle} color="#EF4444" change={-1.5} changeType="down" delay={200} />
        <StatCard title="Today's Attendance" value={stats.todayAttendance} icon={ClipboardList} color="#F59E0B" delay={300} />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2 card-hover fade-in-delay-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Performance Trend</h3>
            <span className="badge bg-blue-50 text-blue-600">Last 6 Months</span>
          </div>
          <LineChart data={perfData} height={280} />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover fade-in-delay-2">
          <h3 className="font-bold text-gray-900 mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Ranking Distribution</h3>
          <div className="flex justify-center">
            <DoughnutChart data={rankDistData} height={240} />
          </div>
        </div>
      </div>

      {/* Secondary Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2 card-hover fade-in-delay-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Attendance Overview</h3>
            <span className="badge bg-green-50 text-green-600">Last 14 Days</span>
          </div>
          <BarChart data={attData} height={260} options={{ scales: { x: { stacked: true }, y: { stacked: true } } }} />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover fade-in-delay-4 overflow-hidden flex flex-col">
          <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Recent Activities</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentActivities.map((act, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: act.type === 'performance' ? '#EFF6FF' : act.type === 'fitness' ? '#ECFDF5' : '#EEF2FF' }}>
                  {act.type === 'performance' ? <Activity size={18} className="text-blue-600" /> :
                   act.type === 'fitness' ? <Target size={18} className="text-emerald-600" /> :
                   <Users size={18} className="text-indigo-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{act.name}</p>
                  <p className="text-xs text-gray-500 truncate">{act.detail} {act.score ? `(${act.score})` : ''}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(act.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
