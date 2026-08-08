import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Activity, TrendingUp, Users, HeartPulse, CalendarCheck, ShieldAlert,
  Trophy, Medal, ChevronRight, Sparkles, BarChart2
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

const StatCard = ({ icon: Icon, label, value, sub, color = 'primary' }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center gap-4">
    <div className={`rounded-xl p-3 bg-${color}/10 flex-shrink-0`}>
      <Icon size={22} className={`text-${color}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-2xl font-black text-foreground">{value ?? '—'}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  </div>
);

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton rows={6} />;

  const { athletes, performance, fitness, attendance, injuries, selections, sportBreakdown = [], recentActivity = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Academy Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live insights across all modules · No data duplication</p>
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Performance', path: '/analytics/performance' },
            { label: 'Fitness', path: '/analytics/fitness' },
            { label: 'Attendance', path: '/analytics/attendance' },
          ].map(({ label, path }) => (
            <button key={path} onClick={() => navigate(path)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-secondary text-foreground transition">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users}        label="Total Athletes"    value={athletes?.total}          sub={`${athletes?.active} active`}             color="primary" />
        <StatCard icon={TrendingUp}   label="Avg Performance"  value={`${performance?.avg_score || 0}%`} sub={`${performance?.total_records} records`}   color="emerald-500" />
        <StatCard icon={HeartPulse}   label="Avg Fitness"      value={`${fitness?.avg_score || 0}%`}    sub={`BMI avg: ${fitness?.avg_bmi}`}           color="cyan-500" />
        <StatCard icon={CalendarCheck} label="Attendance Rate" value={`${attendance?.attendance_pct || 0}%`} sub={`${attendance?.total_records} records`} color="amber-500" />
        <StatCard icon={ShieldAlert}  label="Active Injuries"  value={injuries?.active_injuries}  sub={`${injuries?.fit_athletes} fit`}          color="rose-500" />
        <StatCard icon={Trophy}       label="Selections Made"  value={selections?.selected}       sub={`${selections?.recommended} recommended`} color="violet-500" />
        <StatCard icon={Medal}        label="Avg Selection Score" value={`${selections?.avg_score || 0}%`} sub="across all selections"             color="orange-500" />
        <StatCard icon={Activity}     label="Injured Athletes" value={athletes?.injured}          sub="needs medical attention"                  color="red-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sport Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-primary" /> Athletes by Sport
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sportBreakdown} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="sport" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
              <Bar dataKey="athlete_count" name="Athletes" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Selection Status Pie */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Selection Status Breakdown
          </h3>
          {selections && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Selected', value: selections.selected || 0 },
                    { name: 'Recommended', value: selections.recommended || 0 },
                    { name: 'Total', value: (selections.total || 0) - (selections.selected || 0) - (selections.recommended || 0) },
                  ]}
                  cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" paddingAngle={3}
                >
                  {COLORS.slice(0, 3).map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Links to Sub-Analytics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Performance Analytics', desc: 'Scores, trends, top performers', path: '/analytics/performance', color: 'from-indigo-500 to-violet-600' },
          { label: 'Fitness Analytics', desc: 'BMI, radar, fitness trends', path: '/analytics/fitness', color: 'from-cyan-500 to-blue-600' },
          { label: 'Attendance Analytics', desc: 'Consistency scores and rates', path: '/analytics/attendance', color: 'from-amber-500 to-orange-600' },
          { label: 'Injury Analytics', desc: 'Severity, body parts, recovery', path: '/analytics/injury', color: 'from-rose-500 to-red-600' },
          { label: 'Coach Analytics', desc: 'Coach effectiveness metrics', path: '/analytics/coach', color: 'from-emerald-500 to-green-600' },
          { label: 'Sport Analytics', desc: 'Per-sport performance summary', path: '/analytics/sport', color: 'from-purple-500 to-pink-600' },
        ].map(card => (
          <button key={card.path} onClick={() => navigate(card.path)}
            className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <BarChart2 size={18} className="text-white" />
            </div>
            <h4 className="text-sm font-bold text-foreground">{card.label}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
            <div className="flex items-center gap-1 text-primary text-xs font-medium mt-3 group-hover:gap-2 transition-all">
              View <ChevronRight size={12} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
