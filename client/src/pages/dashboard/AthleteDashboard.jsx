import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Activity, MessageSquare, ClipboardList, Flame, Medal, Bell } from 'lucide-react';
import dashboardAPI from '../../services/dashboard.service';
import StatCard from '../../components/common/StatCard';
import { LineChart } from '../../components/charts/Charts';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';

const AthleteDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    dashboardAPI.getAthleteDashboard()
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

  const { athlete, attendancePercentage, ranking, latestFitness, avgPerformance, performanceHistory, coachRemarks, notifications } = data;

  const perfData = {
    labels: performanceHistory.map(d => new Date(d.record_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Performance Score',
      data: performanceHistory.map(d => parseFloat(d.performance_score)),
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    }]
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex items-center justify-between fade-in">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold font-display mb-1">Welcome back, {user?.firstName}!</h2>
          <p className="text-indigo-200 text-sm">
            {athlete.sport_name} • {athlete.category_name} 
            {athlete.coach_first && ` • Coach: ${athlete.coach_first} ${athlete.coach_last}`}
          </p>
        </div>
        <div className="relative z-10 hidden md:block">
          {ranking?.rank_position <= 3 ? (
            <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-4 py-2 rounded-xl">
              <Medal className="text-yellow-400" size={24} />
              <div>
                <p className="text-xs text-yellow-200 font-medium uppercase tracking-wider">Current Rank</p>
                <p className="font-bold text-white leading-none">#{ranking.rank_position} {ranking.rank_type}</p>
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-white/10 rounded-full border border-white/20 flex items-center justify-center">
              <Flame size={28} className="text-orange-400" />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Avg Performance" value={parseFloat(avgPerformance).toFixed(1)} icon={Activity} color="#8B5CF6" delay={0} />
        <StatCard title="Overall Fitness" value={parseFloat(latestFitness?.overall_fitness_score || 0).toFixed(1)} icon={Activity} color="#10B981" delay={100} />
        <StatCard title="Attendance" value={attendancePercentage} suffix="%" icon={Calendar} color="#3B82F6" delay={200} />
        <StatCard title="Academy Rank" value={ranking?.rank_position ? `#${ranking.rank_position}` : 'N/A'} icon={Trophy} color="#F59E0B" delay={300} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2 card-hover fade-in-delay-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>My Performance Growth</h3>
            <span className="badge bg-purple-50 text-purple-600">Last 6 Months</span>
          </div>
          {performanceHistory.length > 0 ? (
            <LineChart data={perfData} height={250} />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">No performance data recorded yet.</div>
          )}
        </div>

        {/* Coach Feedback */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover fade-in-delay-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Recent Feedback</h3>
            <MessageSquare size={18} className="text-gray-400" />
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {coachRemarks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No feedback recorded.</p>
            ) : coachRemarks.map((remark, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                      ${remark.remark_type === 'performance' ? 'bg-blue-100 text-blue-700' : 
                        remark.remark_type === 'fitness' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-gray-200 text-gray-700'}`}>
                      {remark.remark_type}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(remark.remark_date).toLocaleDateString()}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
                    {parseFloat(remark.rating).toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">"{remark.remarks}"</p>
                <p className="text-xs text-gray-400 mt-2 font-medium">- Coach {remark.coach_last}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteDashboard;
