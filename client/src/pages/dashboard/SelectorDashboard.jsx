import React, { useState, useEffect } from 'react';
import { Trophy, Target, Star, Brain, GitCompare, Download, Award } from 'lucide-react';
import dashboardAPI from '../../services/dashboard.service';
import StatCard from '../../components/common/StatCard';
import { DoughnutChart } from '../../components/charts/Charts';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import QuickActionsBar from '../../components/common/QuickActionsBar';
import QuickActionModal from '../../components/common/QuickActionModal';
import ChartCard from '../../components/ui/ChartCard';
import Card, { CardHeader } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { COLORS, toNum } from '../../theme';

const SelectorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', type: '' });

  useEffect(() => {
    dashboardAPI.getSelectorDashboard()
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

  const { stats, recommendations = [], charts = {} } = data;
  const rankDist = charts.rankingDistribution || {};

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

  const quickActions = [
    { label: 'Compare Athletes', icon: GitCompare, primary: true, onClick: () => setModalState({ isOpen: true, title: 'Athlete Performance Comparison', type: 'compare' }) },
    { label: 'Generate Selection List', icon: Brain, path: '/ai-generate' },
    { label: 'Export Report', icon: Download, variant: 'emerald', onClick: () => toast.success('Exporting Selection Intelligence Report (PDF)...') },
  ];

  const statusVariant = (s) => {
    if (s === 'recommended') return 'blue';
    if (s === 'selected') return 'green';
    if (s === 'rejected') return 'red';
    return 'amber';
  };

  return (
    <div className="page-shell">
      <div>
        <h2 className="page-title">Selector Dashboard</h2>
        <p className="text-small text-muted mt-1">Rankings, recommendations, and selection confidence</p>
      </div>

      <QuickActionsBar actions={quickActions} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Top Ranked Athletes" value={stats.topRankedCount} icon={Trophy} color={COLORS.warning} delay={0} />
        <StatCard title="Selections Made" value={stats.totalSelections} icon={Target} color={COLORS.success} delay={40} />
        <StatCard title="Active Sports" value={stats.activeSports} icon={Star} color={COLORS.brand} delay={80} />
        <StatCard title="Avg Confidence" value="88.5%" icon={Award} color={COLORS.brand} delay={120} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2 fade-in-1" hover>
          <CardHeader
            title="AI Selection Recommendations"
            action={
              <Badge variant="blue">
                <span className="inline-flex items-center gap-1">
                  <Brain size={12} /> Live
                </span>
              </Badge>
            }
          />
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Sport</th>
                  <th className="text-center">Score</th>
                  <th className="text-center">Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState title="No recommendations" minHeight={120} />
                    </td>
                  </tr>
                ) : recommendations.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar firstName={r.first_name} lastName={r.last_name} role="athlete" size={32} />
                        <div>
                          <p className="text-small font-semibold">{r.first_name} {r.last_name}</p>
                          <p className="text-xs text-muted">{r.athlete_code}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-small">{r.sport_name}</p>
                      <p className="text-xs text-muted">{r.category_name}</p>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-blue">{toNum(r.selection_score).toFixed(1)}</span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="score-bar w-14">
                          <div className="score-fill bg-success" style={{ width: `${Math.min(100, toNum(r.confidence_score))}%`, background: COLORS.success }} />
                        </div>
                        <span className="text-xs text-muted">{toNum(r.confidence_score).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={statusVariant(r.status)} className="capitalize">{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <ChartCard title="Talent Pool Distribution" className="fade-in-2">
          <DoughnutChart data={rankDistData} height={260} />
        </ChartCard>
      </div>

      <QuickActionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        type={modalState.type}
      />
    </div>
  );
};

export default SelectorDashboard;
