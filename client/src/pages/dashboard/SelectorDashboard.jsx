import React, { useState, useEffect } from 'react';
import { Trophy, Target, Star, Brain } from 'lucide-react';
import dashboardAPI from '../../services/dashboard.service';
import StatCard from '../../components/common/StatCard';
import { DoughnutChart } from '../../components/charts/Charts';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const SelectorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getSelectorDashboard()
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><LoadingSkeleton rows={8} /></div>
          <div><LoadingSkeleton rows={8} /></div>
        </div>
      </div>
    );
  }

  const { stats, recommendations, charts } = data;

  const rankDistData = {
    labels: ['Elite', 'Advanced', 'Intermediate', 'Beginner'],
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Top 10 Athletes" value={stats.topRankedCount} icon={Trophy} color="#F59E0B" delay={0} />
        <StatCard title="Total Selections" value={stats.totalSelections} icon={Target} color="#10B981" delay={100} />
        <StatCard title="Active Sports" value={stats.activeSports} icon={Star} color="#3B82F6" delay={200} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2 card-hover fade-in-delay-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>AI Selection Recommendations</h3>
            <span className="badge bg-purple-50 text-purple-600 flex items-center gap-1">
              <Brain size={12} /> Live AI Insights
            </span>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 text-xs font-semibold text-gray-500 uppercase">Athlete</th>
                  <th className="py-3 text-xs font-semibold text-gray-500 uppercase">Sport/Category</th>
                  <th className="py-3 text-xs font-semibold text-gray-500 uppercase text-center">Sel. Score</th>
                  <th className="py-3 text-xs font-semibold text-gray-500 uppercase text-center">Confidence</th>
                  <th className="py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recommendations.length === 0 ? (
                  <tr><td colSpan="5" className="py-8 text-center text-gray-500">No recommendations available.</td></tr>
                ) : recommendations.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {r.first_name[0]}{r.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{r.first_name} {r.last_name}</p>
                          <p className="text-xs text-gray-500">{r.athlete_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <p className="text-sm text-gray-800">{r.sport_name}</p>
                      <p className="text-xs text-gray-500">{r.category_name}</p>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
                        {parseFloat(r.selection_score || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[60px] mx-auto">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${r.confidence_score}%` }}></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">{parseFloat(r.confidence_score || 0).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize 
                        ${r.status === 'recommended' ? 'bg-purple-100 text-purple-700' : 
                          r.status === 'selected' ? 'bg-emerald-100 text-emerald-700' : 
                          r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover fade-in-delay-2 flex flex-col">
          <h3 className="font-bold text-gray-900 mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Academy Talent Pool</h3>
          <div className="flex-1 flex items-center justify-center">
            <DoughnutChart data={rankDistData} height={220} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectorDashboard;
