import React, { useState, useEffect } from 'react';
import { Medal, Sparkles, Trophy } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
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

function mapStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'selected') return 'Selected';
  if (s === 'recommended') return 'Shortlisted';
  if (s === 'pending') return 'In Training';
  return 'Recovering';
}

export default function SelectorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI
      .getSelectorDashboard()
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

  const { stats = {}, topRankedAthletes = [], topAthletes = [], recommendations = [] } = data;
  const ranked = (Array.isArray(topRankedAthletes) && topRankedAthletes.length > 0)
    ? topRankedAthletes
    : (Array.isArray(topAthletes) && topAthletes.length > 0)
    ? topAthletes
    : (Array.isArray(recommendations) ? recommendations : []);

  const sportWisePerformanceData = Object.entries(
    ranked.reduce((acc, r) => {
      const sport = r.sport_name || 'Unknown';
      if (!acc[sport]) acc[sport] = { sport, total: 0, count: 0 };
      acc[sport].total += toNum(r.selection_score);
      acc[sport].count += 1;
      return acc;
    }, {}),
  ).map(([, v]) => ({
    sport: v.sport,
    score: Math.round(v.total / v.count),
  }));

  const avgConfidence =
    ranked.length > 0
      ? Math.round(ranked.reduce((s, a) => s + toNum(a.confidence_score), 0) / ranked.length)
      : 84;

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Selection Intelligence"
        subtitle="Rank, compare and shortlist athletes."
        breadcrumb="Selector Workspace"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Athletes In Pool" value={ranked.length || stats.topRankedCount || 0} icon={Trophy} />
        <StatCard
          label="Recommended"
          value={ranked.filter((x) => toNum(x.selection_score) > 85).length}
          icon={Sparkles}
          tone="success"
        />
        <StatCard label="Avg Confidence" value={`${avgConfidence}%`} icon={Medal} tone="info" />
        <StatCard label="Recent Selections" value={stats.totalSelections || 0} icon={Medal} delta={9} tone="warning" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Top Ranked Athletes & Recommendation Scores" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Athlete</th>
                  <th className="py-2 pr-3">Sport</th>
                  <th className="py-2 pr-3">Selection score</th>
                  <th className="py-2 pr-3">AI confidence</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 8).map((x, i) => (
                  <tr key={x.athlete_code || i} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3 tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="py-3 pr-3 font-medium">
                      {x.first_name} {x.last_name}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{x.sport_name}</td>
                    <td className="py-3 pr-3">
                      <ScoreBar value={toNum(x.selection_score)} />
                    </td>
                    <td className="py-3 pr-3 font-semibold tabular-nums text-accent">
                      {toNum(x.confidence_score)}%
                    </td>
                    <td className="py-3">
                      <StatusPill status={mapStatus(x.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Sport Rankings">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sportWisePerformanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} {...axis} />
              <YAxis dataKey="sport" type="category" width={78} tickLine={false} axisLine={false} {...axis} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--secondary)' }} />
              <Bar dataKey="score" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
