import React, { useState, useEffect } from 'react';
import { Activity, CalendarCheck, Gauge, MessageSquare, Users } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dashboardAPI from '../../services/dashboard.service';
import { Panel, ScoreBar, StatCard, StatusPill } from '../../components/widgets';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import PageHeader from '../../components/common/PageHeader';
import { toNum } from '../../theme';

const axis = { stroke: 'var(--muted-foreground)', fontSize: 12 };
const tooltipStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '0.75rem',
  fontSize: '12px',
};

function mapAthleteStatus(perf) {
  if (perf >= 88) return 'Selected';
  if (perf >= 82) return 'Shortlisted';
  if (perf >= 75) return 'In Training';
  return 'Recovering';
}

export default function CoachDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI
      .getCoachDashboard()
      .then((res) => setData(res?.data || res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} type="stat" />
          ))}
        </div>
      </div>
    );
  }

  const { stats = {}, athletes = [], charts = {} } = data;
  const perfTrend = charts.performanceTrend || [];
  const fitTrend  = charts.fitnessTrend || [];
  const attMonthly = charts.attendanceMonthlyTrend || [];

  const trendLabels = [...new Set([
    ...perfTrend.map((d) => d.month),
    ...fitTrend.map((d) => d.month),
    ...attMonthly.map((d) => d.month),
  ])].sort();

  const perfByMonth = Object.fromEntries(perfTrend.map((d) => [d.month, toNum(d.avg_score)]));
  const fitByMonth  = Object.fromEntries(fitTrend.map((d)  => [d.month, toNum(d.avg_fitness)]));
  const attByMonth  = Object.fromEntries(attMonthly.map((d) => [d.month, toNum(d.avg_attendance)]));

  const performanceTrendData = trendLabels.map((m) => {
    const [y, mo] = String(m).split('-');
    return {
      month: new Date(Number(y), Number(mo) - 1).toLocaleDateString('en', { month: 'short' }),
      performance: perfByMonth[m] || 0,
      fitness: fitByMonth[m] || 0,
      attendance: attByMonth[m] || 0,
    };
  });

  const squadPerf =
    athletes.length > 0
      ? (
          athletes.reduce((acc, a) => acc + toNum(a.avg_performance), 0) / athletes.length
        ).toFixed(1)
      : 0;
  const squadFit =
    athletes.length > 0
      ? (athletes.reduce((acc, a) => acc + toNum(a.avg_fitness), 0) / athletes.length).toFixed(1)
      : 0;
  const avgAttendance =
    stats.assignedAthletes > 0
      ? Math.round((toNum(stats.todayAttendance) / toNum(stats.assignedAthletes)) * 100)
      : 0;

  const coachRemarks = athletes.slice(0, 3).map((a, i) => ({
    id: a.id || i,
    athlete: `${a.first_name} ${a.last_name}`,
    remark: `Performance index ${toNum(a.avg_performance).toFixed(1)} — ${a.sport_name || 'assigned sport'}.`,
    date: new Date().toLocaleDateString('en', { day: '2-digit', month: 'short' }),
  }));

  const upcomingAssessments = [
    {
      id: 1,
      title: 'Squad Fitness Battery',
      group: `${stats.assignedAthletes || 0} assigned athletes`,
      date: 'Next week',
    },
    {
      id: 2,
      title: 'Performance Review',
      group: 'Monthly cycle',
      date: stats.pendingAssessments ? `${stats.pendingAssessments} pending` : 'Scheduled',
    },
  ];

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Coach Workspace"
        subtitle="Monitor your assigned squad and key priorities."
        breadcrumb="Coach Dashboard"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned Athletes" value={stats.assignedAthletes || athletes.length} icon={Users} />
        <StatCard label="Squad Performance" value={squadPerf || '—'} icon={Activity} delta={5} tone="info" />
        <StatCard label="Squad Fitness" value={squadFit || '—'} icon={Gauge} delta={3} tone="success" />
        <StatCard
          label="Attendance Summary"
          value={`${avgAttendance || stats.todayAttendance || 0}%`}
          icon={CalendarCheck}
          delta={-2}
          tone="warning"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Performance, Fitness & Attendance Trend" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={performanceTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} {...axis} />
              <YAxis tickLine={false} axisLine={false} {...axis} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v).toFixed(1)}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="performance" name="Performance" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
              <Line dataKey="fitness" name="Fitness" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
              <Line dataKey="attendance" name="Attendance" stroke="var(--chart-3)" strokeWidth={2.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Upcoming Assessments">
          <ul className="space-y-3">
            {upcomingAssessments.map((u) => (
              <li key={u.id} className="rounded-lg bg-secondary px-3 py-2.5">
                <p className="text-sm font-medium">{u.title}</p>
                <p className="text-xs text-muted-foreground">
                  {u.group} · {u.date}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Recent Performance — Assigned Athletes" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Athlete</th>
                  <th className="py-2 pr-3">Performance</th>
                  <th className="py-2 pr-3">Fitness</th>
                  <th className="py-2 pr-3">Attendance</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((a) => {
                  const perf = toNum(a.avg_performance);
                  const fit = toNum(a.latest_fitness);
                  return (
                    <tr key={a.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-3 font-medium">
                        {a.first_name} {a.last_name}
                      </td>
                      <td className="py-3 pr-3">
                        <ScoreBar value={perf} />
                      </td>
                      <td className="py-3 pr-3">
                        <ScoreBar value={fit} tone="success" />
                      </td>
                      <td className="py-3 pr-3">
                        <ScoreBar value={Math.min(100, perf - 5)} tone="warning" />
                      </td>
                      <td className="py-3">
                        <StatusPill status={mapAthleteStatus(perf)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Coach Remarks">
          <ul className="space-y-4">
            {coachRemarks.map((r) => (
              <li key={r.id} className="flex gap-3">
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{r.athlete}</p>
                  <p className="text-xs leading-snug text-muted-foreground">{r.remark}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">{r.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
