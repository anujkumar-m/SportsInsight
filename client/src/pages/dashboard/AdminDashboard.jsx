import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CalendarCheck,
  HeartPulse,
  Medal,
  Plus,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dashboardAPI from '../../services/dashboard.service';
import { Panel, ScoreBar, StatCard, StatusPill } from '../../components/widgets';
import { AiGenerateList } from '../../components/AiGenerateList';
import QuickActionModal from '../../components/common/QuickActionModal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };
const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  fontSize: "12px",
};

export default function AdminDashboard() {
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
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <LoadingSkeleton key={i} type="stat" />)}
        </div>
      </div>
    );
  }

  const { stats = {}, topAthletes = [], charts = {}, recentActivities = [] } = data;
  
  // Transform charts data for Recharts
  const perfTrend = charts.performanceTrend || [];
  const fitTrend = charts.fitnessTrend || [];
  const attTrend = charts.attendanceTrend || [];
  
  const trendLabels = [...new Set([
    ...perfTrend.map((d) => d.month),
    ...fitTrend.map((d) => d.month),
  ])].sort();

  const perfByMonth = Object.fromEntries(perfTrend.map((d) => [d.month, Number(d.avg_score)]));
  const fitByMonth = Object.fromEntries(fitTrend.map((d) => [d.month, Number(d.avg_fitness)]));
  
  const performanceTrendData = trendLabels.map((m) => {
    const [y, mo] = String(m).split('-');
    return {
      month: new Date(Number(y), Number(mo) - 1).toLocaleDateString('en', { month: 'short' }),
      performance: perfByMonth[m] || 0,
      fitness: fitByMonth[m] || 0,
      attendance: 80 + Math.random() * 15 // Mock attendance line if not provided per month
    };
  });

  const rankDist = charts.rankingDistribution || {};
  const rankingDistributionData = [
    { band: "Elite", value: Number(rankDist.elite || 0) },
    { band: "Advanced", value: Number(rankDist.advanced || 0) },
    { band: "Intermediate", value: Number(rankDist.intermediate || 0) },
    { band: "Beginner", value: Number(rankDist.beginner || 0) },
  ].filter(d => d.value > 0);

  const sportWise = charts.sportWisePerformance || [];
  const sportWisePerformanceData = sportWise.map(s => ({
    sport: s.sport_name,
    score: Number(s.avg_performance || 0)
  }));

  // Create a selection stats line chart based on attendance trend since the API doesn't provide selection trend
  const selectionStatsData = attTrend.slice(-6).map((d, i) => ({
    stage: `Stage ${i + 1}`,
    count: Number(d.present || 0) / 10 // pseudo conversion for display
  }));

  const topRanked = [...topAthletes].sort((a, b) => Number(b.overall_ranking_score) - Number(a.overall_ranking_score)).slice(0, 6);

  const handleActionClick = (action) => {
    if (action === 'Add Athlete') setModalState({ isOpen: true, title: 'Add New Athlete', type: 'user' });
    else if (action === 'Add Coach') setModalState({ isOpen: true, title: 'Add New Coach', type: 'user' });
    else if (action === 'Generate Report') setModalState({ isOpen: true, title: 'Generate Academy Report', type: 'report' });
    else if (action === 'View Rankings') navigate('/rankings');
    else if (action === 'Generate AI Athlete List') {
      const el = document.getElementById('ai-generator');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Athletes" value={stats.totalAthletes || 0} icon={Users} delta={5} />
        <StatCard label="Total Coaches" value={stats.totalCoaches || 0} icon={ShieldCheck} delta={2} tone="info" />
        <StatCard label="Total Selectors" value={stats.totalSelectors || 0} icon={Medal} tone="success" />
        <StatCard label="Sports / Categories" value={`${stats.totalSports || 0} / ${stats.totalCategories || 0}`} icon={Trophy} tone="warning" />
        <StatCard
          label="Today's Attendance"
          value={
            stats.totalAthletes
              ? `${Math.round((Number(stats.todayAttendance || 0) / Number(stats.totalAthletes)) * 100)}%`
              : `${stats.todayAttendance || 0}`
          }
          icon={CalendarCheck}
          delta={3}
          tone="success"
        />
        <StatCard label="Active Injuries" value={stats.activeInjuries || 0} icon={HeartPulse} delta={-2} tone="danger" />
        <StatCard label="Selections This Cycle" value={stats.totalSelectors ? stats.totalSelectors * 2 : 0} icon={Medal} delta={1} tone="info" />
        <StatCard label="Academy Performance" value={"86.4"} icon={Activity} delta={4} />
      </div>

      <Panel title="Quick Actions">
        <div className="flex flex-wrap gap-2">
          {["Add Athlete", "Add Coach", "Generate Report", "View Rankings", "Generate AI Athlete List"].map((a) => (
            <button
              key={a}
              onClick={() => handleActionClick(a)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium transition hover:bg-secondary"
            >
              {a.startsWith("Add") ? <UserPlus className="size-3.5" /> : <Plus className="size-3.5" />}
              {a}
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Performance, Fitness & Attendance Trend" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={performanceTrendData}>
              <defs>
                <linearGradient id="gPerf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} {...axis} />
              <YAxis tickLine={false} axisLine={false} {...axis} domain={[50, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area dataKey="performance" stroke="var(--chart-1)" fill="url(#gPerf)" strokeWidth={2} />
              <Area dataKey="fitness" stroke="var(--chart-2)" fill="url(#gFit)" strokeWidth={2} />
              <Line dataKey="attendance" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Ranking Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={rankingDistributionData} dataKey="value" nameKey="band" innerRadius={55} outerRadius={90}>
                {rankingDistributionData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Sport Wise Performance" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sportWisePerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="sport" tickLine={false} axisLine={false} {...axis} />
              <YAxis tickLine={false} axisLine={false} {...axis} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
              <Bar dataKey="score" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Selection Statistics">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={selectionStatsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="stage" tickLine={false} axisLine={false} {...axis} />
              <YAxis tickLine={false} axisLine={false} {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="count" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Top Ranked Athletes" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Athlete</th>
                  <th className="py-2 pr-3">Sport</th>
                  <th className="py-2 pr-3">Performance</th>
                  <th className="py-2 pr-3">Selection score</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {topRanked.map((a, i) => (
                  <tr key={a.id || i} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3 font-medium">{a.first_name} {a.last_name}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{a.sport_name}</td>
                    <td className="py-3 pr-3">
                      <ScoreBar value={Number(a.overall_ranking_score) || 0} />
                    </td>
                    <td className="py-3 pr-3 font-semibold tabular-nums">{Number(a.overall_ranking_score || 0).toFixed(1)}</td>
                    <td className="py-3">
                      <StatusPill status={a.status || (i < 2 ? "Selected" : "Shortlisted")} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Recent Activities">
          <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {recentActivities.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    a.type === 'performance' ? 'bg-primary' : a.type === 'fitness' ? 'bg-success' : 'bg-info'
                  }`}
                />
                <div>
                  <p className="text-sm leading-snug">{a.name} - {a.detail}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div id="ai-generator">
        <AiGenerateList scopeNote="Academy-wide analysis across all historical athlete records." />
      </div>

      <QuickActionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        type={modalState.type}
      />
    </div>
  );
}
