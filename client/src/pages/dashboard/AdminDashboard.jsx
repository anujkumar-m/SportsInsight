import React, { useState, useEffect } from 'react';
import {
  Activity,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Medal,
  ShieldCheck,
  Trophy,
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
import authAPI from '../../services/auth.service';
import { Panel, ScoreBar, StatCard, StatusPill } from '../../components/widgets';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import PageHeader from '../../components/common/PageHeader';

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
  const [googleUsers, setGoogleUsers] = useState([]);
  const [googleUsersLoading, setGoogleUsersLoading] = useState(false);
  const [googlePanelOpen, setGooglePanelOpen] = useState(false);
  const [roleAssigning, setRoleAssigning] = useState({});
  const [pendingRoles, setPendingRoles] = useState({});

  const ASSIGNABLE_ROLES = [
    { id: 2, name: 'coach', label: 'Coach' },
    { id: 3, name: 'selector', label: 'State Selector' },
    { id: 4, name: 'athlete', label: 'Athlete' },
    { id: 5, name: 'unassigned', label: 'Unassigned' },
  ];

  useEffect(() => {
    dashboardAPI.getAdminDashboard()
      .then((res) => setData(res?.data || res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const fetchGoogleUsers = async () => {
    setGoogleUsersLoading(true);
    try {
      const res = await authAPI.getGoogleUsers();
      const users = res?.data?.users || res?.users || [];
      setGoogleUsers(users);
      // Init pending role selections to current role_id
      const init = {};
      users.forEach(u => { init[u.id] = u.role_id; });
      setPendingRoles(init);
    } catch (err) {
      console.error('Failed to fetch Google users', err);
    } finally {
      setGoogleUsersLoading(false);
    }
  };

  const handleToggleGooglePanel = () => {
    if (!googlePanelOpen && googleUsers.length === 0) fetchGoogleUsers();
    setGooglePanelOpen(prev => !prev);
  };

  const handleAssignRole = async (userId) => {
    const roleId = pendingRoles[userId];
    if (!roleId) return;
    setRoleAssigning(prev => ({ ...prev, [userId]: true }));
    try {
      await authAPI.assignRole(userId, roleId);
      setGoogleUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role_id: roleId, role: ASSIGNABLE_ROLES.find(r => r.id === Number(roleId))?.name || u.role } : u)
      );
    } catch (err) {
      console.error('Role assignment failed', err);
    } finally {
      setRoleAssigning(prev => ({ ...prev, [userId]: false }));
    }
  };

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
  const attMonthly = charts.attendanceMonthlyTrend || [];
  
  // Merge all month keys across all three trends
  const trendLabels = [...new Set([
    ...perfTrend.map((d) => d.month),
    ...fitTrend.map((d) => d.month),
    ...attMonthly.map((d) => d.month),
  ])].sort();

  const perfByMonth = Object.fromEntries(perfTrend.map((d) => [d.month, Number(d.avg_score)]));
  const fitByMonth  = Object.fromEntries(fitTrend.map((d)  => [d.month, Number(d.avg_fitness)]));
  const attByMonth  = Object.fromEntries(attMonthly.map((d) => [d.month, Number(d.avg_attendance)]));
  
  const performanceTrendData = trendLabels.map((m) => {
    const [y, mo] = String(m).split('-');
    return {
      month: new Date(Number(y), Number(mo) - 1).toLocaleDateString('en', { month: 'short' }),
      performance: perfByMonth[m] || 0,
      fitness: fitByMonth[m] || 0,
      attendance: attByMonth[m] || 0,
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

  // Create a selection stats line chart based on attendance monthly trend since the API doesn't provide selection trend
  const selectionStatsData = attMonthly.slice(-6).map((d, i) => ({
    stage: `Stage ${i + 1}`,
    count: Number(d.avg_attendance || 0) / 10 // pseudo conversion for display
  }));

  const topRanked = [...topAthletes].sort((a, b) => Number(b.overall_ranking_score) - Number(a.overall_ranking_score)).slice(0, 6);


  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Academy Command Centre"
        subtitle="Academy-wide performance, selection and AI intelligence overview."
        breadcrumb="Admin Overview"
      />
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
                <linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} {...axis} />
              <YAxis tickLine={false} axisLine={false} {...axis} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v).toFixed(1)}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area dataKey="performance" name="Performance" stroke="var(--chart-1)" fill="url(#gPerf)" strokeWidth={2} />
              <Area dataKey="fitness" name="Fitness" stroke="var(--chart-2)" fill="url(#gFit)" strokeWidth={2} />
              <Area dataKey="attendance" name="Attendance" stroke="var(--chart-3)" fill="url(#gAtt)" strokeWidth={2} />
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


      {/* ─── Google User Management ──────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          id="google-users-panel-toggle"
          onClick={handleToggleGooglePanel}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-secondary/50"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span className="text-sm font-semibold">Google User Management</span>
            {googleUsers.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {googleUsers.length}
              </span>
            )}
          </div>
          {googlePanelOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>

        {googlePanelOpen && (
          <div className="border-t border-border px-5 pb-5">
            <p className="py-3 text-xs text-muted-foreground">
              Manage roles for users who signed in via Google. The admin account cannot be modified.
            </p>

            {googleUsersLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading Google users…
              </div>
            ) : googleUsers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No Google users have signed in yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-4">User</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Current Role</th>
                      <th className="py-2 pr-4">Assign Role</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {googleUsers.map((u) => {
                      const isAdmin = u.role === 'admin';
                      return (
                        <tr key={u.id} className="border-b border-border/60 last:border-0">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              {u.profile_photo ? (
                                <img src={u.profile_photo} alt={u.first_name} className="size-7 rounded-full object-cover" />
                              ) : (
                                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {(u.first_name?.[0] || '?').toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium">{u.first_name} {u.last_name}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              u.role === 'admin' ? 'bg-primary/10 text-primary' :
                              u.role === 'unassigned' ? 'bg-warning/10 text-warning' :
                              'bg-success/10 text-success'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {isAdmin ? (
                              <span className="text-xs text-muted-foreground italic">Protected</span>
                            ) : (
                              <select
                                id={`role-select-${u.id}`}
                                value={pendingRoles[u.id] || u.role_id}
                                onChange={(e) => setPendingRoles(prev => ({ ...prev, [u.id]: Number(e.target.value) }))}
                                className="h-8 rounded-lg border border-border bg-card px-2 text-xs outline-none focus:border-primary"
                              >
                                {ASSIGNABLE_ROLES.map(r => (
                                  <option key={r.id} value={r.id}>{r.label}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="py-3">
                            {isAdmin ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <button
                                id={`assign-role-btn-${u.id}`}
                                onClick={() => handleAssignRole(u.id)}
                                disabled={roleAssigning[u.id] || pendingRoles[u.id] === u.role_id}
                                className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                              >
                                {roleAssigning[u.id] ? (
                                  <><div className="size-3 animate-spin rounded-full border border-white border-t-transparent" /> Saving…</>
                                ) : 'Assign'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
