import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, Target, UserCircle } from 'lucide-react';
import dashboardAPI from '../../services/dashboard.service';
import StatCard from '../../components/common/StatCard';
import { LineChart, BarChart } from '../../components/charts/Charts';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const CoachDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getCoachDashboard()
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <LoadingSkeleton key={i} type="stat" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton rows={6} />
          <LoadingSkeleton rows={6} />
        </div>
      </div>
    );
  }

  const { stats, athletes, charts } = data;

  const perfData = {
    labels: charts.performanceTrend.map(d => d.month),
    datasets: [{
      label: 'Avg Squad Performance',
      data: charts.performanceTrend.map(d => d.avg_score),
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    }]
  };

  const fitData = {
    labels: charts.fitnessTrend.map(d => d.month),
    datasets: [{
      label: 'Avg Squad Fitness',
      data: charts.fitnessTrend.map(d => d.avg_fitness),
      backgroundColor: '#3B82F6',
      borderRadius: 4,
    }]
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Assigned Athletes" value={stats.assignedAthletes} icon={Users} color="#8B5CF6" delay={0} />
        <StatCard title="Today's Attendance" value={stats.todayAttendance} icon={ClipboardList} color="#10B981" delay={100} />
        <StatCard title="Pending Assessments" value={stats.pendingAssessments} icon={Target} color="#EF4444" delay={200} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover fade-in-delay-1">
          <h3 className="font-bold text-gray-900 mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Squad Performance Trend</h3>
          <LineChart data={perfData} height={250} />
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover fade-in-delay-2">
          <h3 className="font-bold text-gray-900 mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Squad Fitness Trend</h3>
          <BarChart data={fitData} height={250} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover fade-in-delay-3">
        <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>My Athletes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 text-xs font-semibold text-gray-500 uppercase">Athlete</th>
                <th className="py-3 text-xs font-semibold text-gray-500 uppercase">Sport/Category</th>
                <th className="py-3 text-xs font-semibold text-gray-500 uppercase text-center">Avg Perf</th>
                <th className="py-3 text-xs font-semibold text-gray-500 uppercase text-center">Fitness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {athletes.length === 0 ? (
                <tr><td colSpan="4" className="py-8 text-center text-gray-500">No athletes assigned yet.</td></tr>
              ) : athletes.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {a.first_name[0]}{a.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{a.first_name} {a.last_name}</p>
                        <p className="text-xs text-gray-500">{a.athlete_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <p className="text-sm text-gray-800">{a.sport_name}</p>
                    <p className="text-xs text-gray-500">{a.category_name}</p>
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                      {parseFloat(a.avg_performance || 0).toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-block px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      {parseFloat(a.latest_fitness || 0).toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
