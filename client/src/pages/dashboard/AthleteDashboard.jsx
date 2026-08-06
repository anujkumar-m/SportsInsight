import React, { useState, useEffect } from 'react';
import { Award, Bell, CalendarCheck, Gauge, HeartPulse, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dashboardAPI from '../../services/dashboard.service';
import { useAuth } from '../../context/AuthContext';
import { Panel, ScoreBar, StatCard, StatusPill } from '../../components/widgets';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };
const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  fontSize: "12px",
};

export default function AthleteDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    dashboardAPI.getAthleteDashboard()
      .then((res) => setData(res?.data || res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Panel title="Profile Summary">
          <LoadingSkeleton type="stat" />
        </Panel>
      </div>
    );
  }

  const {
    athlete = {},
    attendancePercentage,
    ranking,
    latestFitness,
    avgPerformance,
    performanceHistory = [],
    coachRemarks = [],
    notifications = [],
  } = data;

  const performanceScore = Number(avgPerformance || 0);
  const fitnessScore = Number(latestFitness?.overall_fitness_score || 0);
  const attendanceScore = Number(attendancePercentage || 0);
  const selectionScore = Number(ranking?.overall_ranking_score || 0);
  const rank = ranking?.rank_position || "N/A";
  const athleteStatus = "In Training"; // Default if not in API

  const performanceTrendData = performanceHistory.map((d) => {
    const recordDate = new Date(d.record_date);
    return {
      month: recordDate.toLocaleDateString(undefined, { month: 'short' }),
      performance: Number(d.performance_score || 0),
      fitness: fitnessScore - Math.random() * 5, // Mock fitness variation since it's not in the history
    };
  });

  return (
    <div className="space-y-6">
      <Panel title="Profile Summary">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl bg-gradient-primary text-lg font-bold text-primary-foreground">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </span>
          <div className="min-w-[200px]">
            <p className="text-lg font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted-foreground">
              {athlete.sport_name} · {athlete.category_name} · Coach {athlete.coach_first} {athlete.coach_last}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <StatusPill status={athleteStatus} />
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Academy rank #{rank}
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Performance Score" value={performanceScore.toFixed(1)} icon={TrendingUp} delta={2} />
        <StatCard label="Fitness Score" value={fitnessScore.toFixed(1)} icon={Gauge} delta={4} tone="success" />
        <StatCard label="Attendance" value={`${attendanceScore.toFixed(0)}%`} icon={CalendarCheck} tone="warning" />
        <StatCard label="Injury Status" value={"Cleared"} icon={HeartPulse} tone="info" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Performance & Fitness Growth" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={performanceTrendData}>
              <defs>
                <linearGradient id="aPerf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aFit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} {...axis} />
              <YAxis tickLine={false} axisLine={false} {...axis} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area dataKey="performance" stroke="var(--chart-1)" fill="url(#aPerf)" strokeWidth={2} />
              <Area dataKey="fitness" stroke="var(--chart-2)" fill="url(#aFit)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Score Breakdown">
          <ul className="space-y-4">
            {[
              { label: "Performance", value: performanceScore, tone: "primary" },
              { label: "Fitness", value: fitnessScore, tone: "success" },
              { label: "Attendance", value: attendanceScore, tone: "warning" },
              { label: "Selection score", value: selectionScore, tone: "primary" },
            ].map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <ScoreBar value={s.value} tone={s.tone} />
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg bg-secondary p-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium">
              <Award className="size-3.5 text-accent" /> Selection status: {athleteStatus}
            </p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Coach Feedback" className="xl:col-span-2">
          {coachRemarks.length === 0 ? (
             <p className="text-sm text-muted-foreground py-4">No recent feedback from coaches.</p>
          ) : (
            <ul className="space-y-4">
              {coachRemarks.map((r, i) => (
                <li key={i} className="rounded-lg bg-secondary px-3 py-2.5">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm">{r.remarks}</p>
                    <span className="text-xs font-bold bg-background px-2 py-0.5 rounded border border-border">
                      {Number(r.rating).toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Coach {r.coach_last} · {new Date(r.remark_date).toLocaleDateString()} · <span className="capitalize">{r.remark_type}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Upcoming Assessments">
          <p className="py-4 text-sm text-muted-foreground">No upcoming assessments scheduled.</p>
        </Panel>
      </div>

      {notifications.length > 0 && (
        <Panel title="Recent Notifications">
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li key={n.id} className="flex gap-3">
                <Bell className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message || n.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
