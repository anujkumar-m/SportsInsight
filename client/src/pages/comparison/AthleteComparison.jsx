import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts';
import { Sparkles, X, Users, BarChart2, RotateCcw, ChevronDown, PieChart as PieChartIcon, Activity, TrendingUp } from 'lucide-react';
import { comparisonService } from '../../services/comparisonService';
import { athleteService } from '../../services/athleteService';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e'];

const tooltipStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '0.75rem',
  fontSize: 12,
};

// Tiny inline toast helper
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'error') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

// No hardcoded fallback data — all sports and athletes come from the API

const AthleteComparison = () => {
  const [sports, setSports]               = useState([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState(null);
  const [athletes, setAthletes]           = useState([]);
  const [athletesLoading, setAthletesLoading] = useState(false);
  const [selectedIds, setSelectedIds]     = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading]             = useState(false);
  const [hasCompared, setHasCompared]     = useState(false);
  const [chartType, setChartType]         = useState('bar'); // 'bar', 'pie', 'radar', 'line'
  const [pieMetric, setPieMetric]         = useState('overall');
  const { toasts, show: showToast }       = useToast();

  // Load sports list from DB on mount and auto-select first sport
  useEffect(() => {
    let isMounted = true;
    const loadSportsFromDB = async () => {
      let list = [];
      try {
        const res = await api.get('/sports', { params: { limit: 100 } });
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.sports)) list = res.sports;
        else if (Array.isArray(res?.data?.data)) list = res.data.data;

        // Fallback to /analytics/sports if list is empty
        if (!list || list.length === 0) {
          const analyticsRes = await api.get('/analytics/sports');
          const summary = analyticsRes?.data?.sportSummary || analyticsRes?.sportSummary || analyticsRes?.data || [];
          if (Array.isArray(summary)) list = summary;
        }
      } catch (err) {
        console.error('API /sports failed, using DB default sports list:', err);
      }

      if (isMounted) {
        let normalized = [];
        if (Array.isArray(list) && list.length > 0) {
          normalized = list.map((s) => ({
            id: Number(s.id || s.sport_id),
            name: String(s.name || s.sport_name || s.sport || `Sport ${s.id}`),
          })).filter((s) => s.id && s.name);
        }

        setSports(normalized);
        setSelectedSport(normalized[0] || null);
      }
      setSportsLoading(false);
    };

    loadSportsFromDB();
    return () => { isMounted = false; };
  }, []);

  // Load athletes filtered by selected sport
  useEffect(() => {
    if (!selectedSport) {
      setAthletes([]);
      setSelectedIds([]);
      setComparisonData(null);
      setHasCompared(false);
      return;
    }
    setAthletesLoading(true);
    setSelectedIds([]);
    setComparisonData(null);
    setHasCompared(false);

    athleteService.getAthletes({ sport_id: selectedSport.id, limit: 100 })
      .then((r) => {
        const list = r?.data || r?.athletes || (Array.isArray(r) ? r : []);
        setAthletes(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        showToast('Failed to load athletes. Please check your connection.', 'error');
        setAthletes([]);
      })
      .finally(() => setAthletesLoading(false));
  }, [selectedSport]);

  const toggleAthlete = (athlete) => {
    const id = athlete.id;
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } else {
      // Same-sport guard: even though the list is pre-filtered, be defensive
      if (selectedIds.length > 0 && selectedSport) {
        const existingSportId = athletes.find((a) => a.id === selectedIds[0])?.sport_id;
        if (athlete.sport_id && existingSportId && Number(athlete.sport_id) !== Number(existingSportId)) {
          showToast('Only athletes from the same sport can be compared.', 'error');
          return;
        }
      }
      if (selectedIds.length >= 5) {
        showToast('Maximum 5 athletes can be compared at once.', 'warning');
        return;
      }
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const removeAthlete = (id) => setSelectedIds((prev) => prev.filter((i) => i !== id));

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      showToast('Please select at least 2 athletes to compare.', 'error');
      return;
    }
    setLoading(true);
    setHasCompared(true);
    comparisonService.compare(selectedIds)
      .then((r) => {
        const payload = r?.data?.data || r?.data || r || {};
        if (!payload || (!payload.athletes && !Array.isArray(payload))) {
          showToast('Comparison returned no data. Please try different athletes.', 'warning');
          setComparisonData(null);
        } else {
          setComparisonData(payload);
        }
      })
      .catch((err) => {
        setComparisonData(null);
        // api.js interceptor rejects with the response body object: { success, message }
        // so err itself is { success: false, message: '...' } OR a native Error
        const msg = err?.message                   // native Error or object with .message
          || (typeof err === 'string' ? err : null)
          || 'Failed to fetch comparison data. Please try again.';
        showToast(msg, 'error');
      })
      .finally(() => setLoading(false));
  };

  const handleReset = () => {
    setSelectedIds([]);
    setComparisonData(null);
    setHasCompared(false);
  };

  const comparedAthletes       = comparisonData?.athletes || [];
  const aiInsights             = comparisonData?.aiInsights || {};
  const selectedAthleteObjects = athletes.filter((a) => selectedIds.includes(a.id));

  // Chart data
  const chartData = comparedAthletes.length > 0 ? [
    { metric: 'Performance', ...Object.fromEntries(comparedAthletes.map((a) => [`${a.profile?.first_name} ${a.profile?.last_name}`, Number(a.performance?.avg_perf || 0)])) },
    { metric: 'Fitness',     ...Object.fromEntries(comparedAthletes.map((a) => [`${a.profile?.first_name} ${a.profile?.last_name}`, Number(a.fitness?.avg_fitness || 0)])) },
    { metric: 'Attendance',  ...Object.fromEntries(comparedAthletes.map((a) => [`${a.profile?.first_name} ${a.profile?.last_name}`, Number(a.attendance?.attendance_pct || 0)])) },
    { metric: 'Potential',   ...Object.fromEntries(comparedAthletes.map((a) => [`${a.profile?.first_name} ${a.profile?.last_name}`, Number(a.potentialScore || 0)])) },
  ] : [];

  const tableRows = [
    { label: 'Athlete Code',      getValue: (item) => item.profile?.athlete_code || '—' },
    { label: 'Category',          getValue: (item) => item.profile?.category || '—' },
    { label: 'Age',               getValue: (item) => item.profile?.age ? `${item.profile.age} yrs` : '—' },
    { label: 'Gender',            getValue: (item) => item.profile?.gender ? item.profile.gender.charAt(0).toUpperCase() + item.profile.gender.slice(1) : '—' },
    { label: 'Height / Weight',   getValue: (item) => item.profile?.height_cm ? `${item.profile.height_cm}cm / ${item.profile.weight_kg}kg` : '—' },
    { label: 'Avg Performance',   getValue: (item) => item.performance?.avg_perf != null ? `${item.performance.avg_perf}%` : '—', getNum: (item) => Number(item.performance?.avg_perf || 0), highlight: true },
    { label: 'Avg Fitness',       getValue: (item) => item.fitness?.avg_fitness != null ? `${item.fitness.avg_fitness}%` : '—', getNum: (item) => Number(item.fitness?.avg_fitness || 0), highlight: true },
    { label: 'Attendance',        getValue: (item) => item.attendance?.attendance_pct != null ? `${item.attendance.attendance_pct}%` : '—', getNum: (item) => Number(item.attendance?.attendance_pct || 0), highlight: true },
    { label: 'Academy Rank',      getValue: (item) => item.ranking?.rank_position ? `#${item.ranking.rank_position}` : 'Unranked', getNum: (item) => item.ranking?.rank_position ? (1000 - Number(item.ranking.rank_position)) : -1, highlight: true },
    { label: 'Ranking Score',     getValue: (item) => item.ranking?.ranking_score != null ? item.ranking.ranking_score : '—', getNum: (item) => Number(item.ranking?.ranking_score || 0), highlight: true },
    { label: 'Injuries',          getValue: (item) => item.injuries?.total_injuries != null ? item.injuries.total_injuries : '0' },
    { label: 'Coach Rating',      getValue: (item) => item.coachRating?.avg_rating != null ? `${item.coachRating.avg_rating} / 10` : '—', getNum: (item) => Number(item.coachRating?.avg_rating || 0), highlight: true },
    { label: 'AI Potential Score',getValue: (item) => item.potentialScore != null ? `${item.potentialScore}%` : '—', getNum: (item) => Number(item.potentialScore || 0), highlight: true },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast container */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: t.type === 'error' ? '#ef4444' : t.type === 'warning' ? '#f59e0b' : '#10b981',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>

      <PageHeader
        title="Side-by-Side Athlete Comparison"
        subtitle="Select a sport, choose 2–5 athletes, and compare Performance, Fitness, Attendance, Rankings & AI Potential"
      />

      {/* Step 1 — Sport Selection */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
          <span className="text-sm font-bold text-foreground">Select Sport</span>
        </div>
        <div className="relative max-w-xs">
          <select
            id="sport-filter"
            className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={selectedSport?.id || ''}
            onChange={(e) => {
              const sport = sports.find((s) => s.id === Number(e.target.value));
              setSelectedSport(sport || null);
            }}
          >
            <option value="">-- Choose a sport --</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        </div>
      </div>

      {/* Step 2 — Athlete Selection */}
      {selectedSport && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
              <span className="text-sm font-bold text-foreground">
                Select Athletes — <span className="text-muted-foreground font-normal">{selectedSport.name}</span>
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{selectedIds.length} / 5 selected (min 2)</span>
          </div>

          {athletesLoading ? (
            <div className="text-sm text-muted-foreground py-4">Loading athletes…</div>
          ) : athletes.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">No athletes found for this sport.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {athletes.map((a) => {
                const isSel = selectedIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAthlete(a)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition ${
                      isSel
                        ? 'bg-primary text-primary-foreground border-primary shadow'
                        : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                    }`}
                  >
                    {a.first_name} {a.last_name}
                    {a.athlete_code && (
                      <span className={`ml-1 opacity-60`}>({a.athlete_code})</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected badges with remove buttons */}
          {selectedAthleteObjects.length > 0 && (
            <div className="border-t border-border/60 pt-3">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Selected athletes:</p>
              <div className="flex flex-wrap gap-2">
                {selectedAthleteObjects.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary"
                  >
                    {a.first_name} {a.last_name}
                    <button
                      onClick={() => removeAthlete(a.id)}
                      className="ml-0.5 rounded-full hover:bg-primary/20 transition p-0.5"
                      title="Remove athlete"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {selectedSport && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            id="compare-btn"
            onClick={handleCompare}
            disabled={selectedIds.length < 2 || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <BarChart2 size={15} />
            {loading ? 'Comparing…' : 'Compare Athletes'}
          </button>
          <button
            onClick={handleReset}
            disabled={selectedIds.length === 0 && !hasCompared}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw size={14} />
            Reset / Clear
          </button>
          {selectedIds.length === 1 && (
            <span className="text-xs text-amber-500 font-medium">Select at least one more athlete</span>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : hasCompared && comparedAthletes.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground rounded-2xl border border-border bg-card">
          No comparison data available. Ensure the selected athletes have recorded performance, fitness, or attendance data.
        </div>
      ) : comparedAthletes.length > 0 ? (
        <>
          {/* AI Potential Banner */}
          {aiInsights?.highestPotential && (
            <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-md flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                <Sparkles size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Future Potential Winner</span>
                <h3 className="text-lg font-black text-foreground">{aiInsights.highestPotential.name}</h3>
                <p className="text-xs text-muted-foreground">{aiInsights.highestPotential.reason}</p>
              </div>
            </div>
          )}

          {/* Comparison Summary Table */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/60 flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Athlete Comparison Summary</h3>
              <span className="ml-auto text-xs text-muted-foreground">{comparedAthletes.length} athletes compared</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" style={{ minWidth: `${300 + comparedAthletes.length * 160}px` }}>
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3 px-5 font-semibold w-44">Metric</th>
                    {comparedAthletes.map((item, idx) => (
                      <th key={idx} className="py-3 px-4 font-semibold">
                        <div style={{ color: COLORS[idx % COLORS.length] }}>{item.profile?.first_name} {item.profile?.last_name}</div>
                        <div className="text-[10px] font-normal text-muted-foreground normal-case tracking-normal">{item.profile?.sport}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(({ label, getValue, getNum, highlight }) => {
                    let bestId = null;
                    if (highlight && getNum) {
                      let bestVal = -Infinity;
                      comparedAthletes.forEach((item) => {
                        const val = getNum(item);
                        if (val > bestVal) { bestVal = val; bestId = item.profile?.id; }
                      });
                    }
                    return (
                      <tr key={label} className="border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-5 text-muted-foreground font-medium text-xs uppercase tracking-wide">{label}</td>
                        {comparedAthletes.map((item, idx) => {
                          const isBest = highlight && getNum && bestId === item.profile?.id;
                          return (
                            <td key={idx} className={`py-3 px-4 font-semibold ${isBest ? 'text-primary' : 'text-foreground'}`}>
                              {getValue(item)}
                              {isBest && <span className="ml-1 text-[10px]">▲</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparative Multi-Chart Visualization */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Multi-Dimensional Comparative Visualization
                </h3>
              </div>

              {/* 4 Chart Type Selector Tabs */}
              <div className="inline-flex rounded-xl bg-secondary p-1 border border-border">
                {[
                  { id: 'bar', label: 'Bar Chart', icon: BarChart2 },
                  { id: 'pie', label: 'Pie Chart', icon: PieChartIcon },
                  { id: 'radar', label: 'Web Chart', icon: Activity },
                  { id: 'line', label: 'The Graph', icon: TrendingUp },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = chartType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setChartType(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. Bar Chart */}
            {chartType === 'bar' && (
              <div className="animate-in fade-in duration-200">
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v).toFixed(1)}%`} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    {comparedAthletes.map((a, idx) => (
                      <Bar
                        key={a.profile?.id || idx}
                        dataKey={`${a.profile?.first_name} ${a.profile?.last_name}`}
                        fill={COLORS[idx % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 2. Pie Chart */}
            {chartType === 'pie' && (
              <div className="animate-in fade-in duration-200 space-y-4">
                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="text-muted-foreground font-medium">Metric Dimension:</span>
                  <select
                    value={pieMetric}
                    onChange={(e) => setPieMetric(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="overall">Overall Potential / Score</option>
                    <option value="Performance">Performance Score</option>
                    <option value="Fitness">Fitness Score</option>
                    <option value="Attendance">Attendance Rate</option>
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <ResponsiveContainer width="100%" height={290}>
                    <PieChart>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${Number(v).toFixed(1)}%`, name]} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Pie
                        data={comparedAthletes.map((a) => {
                          let val = 0;
                          if (pieMetric === 'overall') val = Number(a.potentialScore || a.ranking?.ranking_score || a.performance?.avg_perf || 0);
                          else if (pieMetric === 'Performance') val = Number(a.performance?.avg_perf || 0);
                          else if (pieMetric === 'Fitness') val = Number(a.fitness?.avg_fitness || 0);
                          else if (pieMetric === 'Attendance') val = Number(a.attendance?.attendance_pct || 0);
                          return {
                            name: `${a.profile?.first_name} ${a.profile?.last_name}`,
                            value: Math.max(1, Math.round(val)),
                          };
                        })}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {comparedAthletes.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Dimension Breakdown ({pieMetric === 'overall' ? 'Potential Score' : pieMetric})
                    </div>
                    {comparedAthletes.map((a, idx) => {
                      let val = 0;
                      if (pieMetric === 'overall') val = Number(a.potentialScore || a.ranking?.ranking_score || a.performance?.avg_perf || 0);
                      else if (pieMetric === 'Performance') val = Number(a.performance?.avg_perf || 0);
                      else if (pieMetric === 'Fitness') val = Number(a.fitness?.avg_fitness || 0);
                      else if (pieMetric === 'Attendance') val = Number(a.attendance?.attendance_pct || 0);
                      return (
                        <div key={a.profile?.id || idx} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 border border-border/50 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="font-semibold text-foreground">{a.profile?.first_name} {a.profile?.last_name}</span>
                          </div>
                          <span className="font-extrabold text-sm" style={{ color: COLORS[idx % COLORS.length] }}>
                            {Number(val).toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Web Chart / Radar Chart */}
            {chartType === 'radar' && (
              <div className="animate-in fade-in duration-200">
                <ResponsiveContainer width="100%" height={340}>
                  <RadarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis domain={[0, 100]} stroke="var(--border)" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v).toFixed(1)}%`} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    {comparedAthletes.map((a, idx) => (
                      <Radar
                        key={a.profile?.id || idx}
                        name={`${a.profile?.first_name} ${a.profile?.last_name}`}
                        dataKey={`${a.profile?.first_name} ${a.profile?.last_name}`}
                        stroke={COLORS[idx % COLORS.length]}
                        fill={COLORS[idx % COLORS.length]}
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 4. The Graph / Line Chart */}
            {chartType === 'line' && (
              <div className="animate-in fade-in duration-200">
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v).toFixed(1)}%`} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    {comparedAthletes.map((a, idx) => (
                      <Line
                        key={a.profile?.id || idx}
                        type="monotone"
                        dataKey={`${a.profile?.first_name} ${a.profile?.last_name}`}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={3}
                        dot={{ r: 5, fill: COLORS[idx % COLORS.length] }}
                        activeDot={{ r: 7 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AthleteComparison;
