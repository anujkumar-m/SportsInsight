import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  Activity,
  Gauge,
  CalendarCheck,
  Zap,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import { performanceService } from '../../services/performanceService';
import { comparisonService } from '../../services/comparisonService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

export default function PerformanceComparison() {
  const navigate = useNavigate();

  const [athletes, setAthletes] = useState([]);
  const [selectedAthlete1, setSelectedAthlete1] = useState('');
  const [selectedAthlete2, setSelectedAthlete2] = useState('');

  const [comparisonData, setComparisonData] = useState(null);
  const [athData1, setAthData1] = useState(null);
  const [athData2, setAthData2] = useState(null);
  const [perfData1, setPerfData1] = useState([]);
  const [perfData2, setPerfData2] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAthletes() {
      try {
        const res = await athleteService.getAthletes({ limit: 100 });
        const list = res.data?.athletes || res.data || [];
        setAthletes(list);
        if (list.length >= 2) {
          setSelectedAthlete1(String(list[0].id));
          setSelectedAthlete2(String(list[1].id));
        }
      } catch (e) {
        console.error('Failed to load athletes:', e);
      }
    }
    loadAthletes();
  }, []);

  useEffect(() => {
    async function compare() {
      if (!selectedAthlete1 || !selectedAthlete2) return;
      if (selectedAthlete1 === selectedAthlete2) {
        toast.error('Please select two distinct athletes to compare.');
        return;
      }

      setLoading(true);
      try {
        const [compRes, a1, a2, p1, p2] = await Promise.all([
          comparisonService.compare([Number(selectedAthlete1), Number(selectedAthlete2)]).catch(() => ({ data: null })),
          athleteService.getById(selectedAthlete1).catch(() => ({ data: null })),
          athleteService.getById(selectedAthlete2).catch(() => ({ data: null })),
          performanceService.getHistory(selectedAthlete1).catch(() => ({ data: { records: [] } })),
          performanceService.getHistory(selectedAthlete2).catch(() => ({ data: { records: [] } })),
        ]);

        setComparisonData(compRes?.data?.data || compRes?.data || null);
        setAthData1(a1?.data?.data || a1?.data || null);
        setAthData2(a2?.data?.data || a2?.data || null);
        setPerfData1(p1?.data?.records || (Array.isArray(p1?.data) ? p1.data : []));
        setPerfData2(p2?.data?.records || (Array.isArray(p2?.data) ? p2.data : []));
      } catch (e) {
        console.error('Comparison error:', e);
        toast.error('Failed to load comparison data.');
      } finally {
        setLoading(false);
      }
    }
    compare();
  }, [selectedAthlete1, selectedAthlete2]);

  // Extract merged stats from comparison service
  const compAth1 = comparisonData?.athletes?.find(a => String(a.profile?.id) === String(selectedAthlete1)) || {};
  const compAth2 = comparisonData?.athletes?.find(a => String(a.profile?.id) === String(selectedAthlete2)) || {};

  // Compute metric averages
  const avg1 = Math.round(Number(compAth1.performance?.avg_perf || (perfData1.length ? perfData1.reduce((s, r) => s + (Number(r.performance_score) || 75), 0) / perfData1.length : 75)));
  const avg2 = Math.round(Number(compAth2.performance?.avg_perf || (perfData2.length ? perfData2.reduce((s, r) => s + (Number(r.performance_score) || 75), 0) / perfData2.length : 75)));

  const fit1 = Math.round(Number(compAth1.fitness?.avg_fitness || 80));
  const fit2 = Math.round(Number(compAth2.fitness?.avg_fitness || 80));

  const att1 = Math.round(Number(compAth1.attendance?.attendance_pct || 85));
  const att2 = Math.round(Number(compAth2.attendance?.attendance_pct || 85));

  const str1 = Math.round(Number(compAth1.fitness?.avg_strength || 78));
  const str2 = Math.round(Number(compAth2.fitness?.avg_strength || 78));

  const end1 = Math.round(Number(compAth1.fitness?.avg_endurance || 82));
  const end2 = Math.round(Number(compAth2.fitness?.avg_endurance || 82));

  const agi1 = Math.round(Number(compAth1.fitness?.avg_agility || 76));
  const agi2 = Math.round(Number(compAth2.fitness?.avg_agility || 76));

  const coach1 = Math.round(Number(compAth1.coachRating?.avg_rating ? compAth1.coachRating.avg_rating * 10 : 80));
  const coach2 = Math.round(Number(compAth2.coachRating?.avg_rating ? compAth2.coachRating.avg_rating * 10 : 80));

  const name1 = athData1 ? `${athData1.first_name || ''} ${athData1.last_name || ''}`.trim() : 'Athlete 1';
  const name2 = athData2 ? `${athData2.first_name || ''} ${athData2.last_name || ''}`.trim() : 'Athlete 2';

  // Construct Web (Radar / Spider) Chart dataset
  const radarData = [
    { metric: 'Performance', athlete1: avg1, athlete2: avg2, fullMark: 100 },
    { metric: 'Fitness Index', athlete1: fit1, athlete2: fit2, fullMark: 100 },
    { metric: 'Attendance', athlete1: att1, athlete2: att2, fullMark: 100 },
    { metric: 'Strength', athlete1: str1, athlete2: str2, fullMark: 100 },
    { metric: 'Endurance', athlete1: end1, athlete2: end2, fullMark: 100 },
    { metric: 'Agility & Speed', athlete1: agi1, athlete2: agi2, fullMark: 100 },
    { metric: 'Coach Rating', athlete1: coach1, athlete2: coach2, fullMark: 100 },
  ];

  // Overall comparison score
  const overall1 = Math.round((avg1 * 0.35 + fit1 * 0.25 + att1 * 0.2 + str1 * 0.1 + agi1 * 0.1));
  const overall2 = Math.round((avg2 * 0.35 + fit2 * 0.25 + att2 * 0.2 + str2 * 0.1 + agi2 * 0.1));

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Side-by-Side Performance Comparison"
        subtitle="Analyze multi-dimensional athlete attributes, AI benchmark scores, and skill spider web charts."
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/performance')}>
            Back to Records
          </Button>
        }
      />

      {/* Athlete Selectors */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-blue-500" />
            Athlete 1 (Primary)
          </label>
          <select
            value={selectedAthlete1}
            onChange={(e) => setSelectedAthlete1(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.first_name} {a.last_name} ({a.athlete_code || `ATH-${a.id}`}) — {a.sport_name || 'General'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-emerald-500" />
            Athlete 2 (Comparison)
          </label>
          <select
            value={selectedAthlete2}
            onChange={(e) => setSelectedAthlete2(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.first_name} {a.last_name} ({a.athlete_code || `ATH-${a.id}`}) — {a.sport_name || 'General'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          Computing multi-dimensional spider web metrics and athlete data...
        </div>
      ) : (
        <div className="space-y-6">
          {/* ─── WEB (RADAR / SPIDER) CHART SECTION ───────────────────────── */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  Skill & Performance Radar Web Chart
                </h3>
                <p className="text-xs text-muted-foreground">
                  Normalized head-to-head comparison across 7 core athletic dimensions (0–100 scale).
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-blue-500">
                  <div className="size-3 rounded-full bg-blue-500" />
                  {name1} ({overall1} pts)
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-emerald-500">
                  <div className="size-3 rounded-full bg-emerald-500" />
                  {name2} ({overall2} pts)
                </div>
              </div>
            </div>

            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name={name1}
                    dataKey="athlete1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.35}
                  />
                  <Radar
                    name={name2}
                    dataKey="athlete2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '12px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ─── SIDE BY SIDE STATS CARDS ─────────────────────────────────── */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Athlete 1 Card */}
            <div className={`rounded-2xl border p-6 shadow-sm space-y-4 transition ${
              overall1 >= overall2 ? 'border-blue-500/40 bg-blue-500/5' : 'border-border bg-card'
            }`}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  {athData1?.profile_photo ? (
                    <img src={athData1.profile_photo} alt="" className="size-12 rounded-full object-cover border-2 border-blue-500" />
                  ) : (
                    <div className="grid size-12 place-items-center rounded-full bg-blue-500/10 text-blue-500 font-bold text-base">
                      {athData1?.first_name?.[0]}{athData1?.last_name?.[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-foreground">{name1}</h3>
                    <p className="text-xs text-muted-foreground">{athData1?.sport_name || 'General'} • Code: {athData1?.athlete_code || 'ATH-1'}</p>
                  </div>
                </div>
                {overall1 >= overall2 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 text-xs font-bold">
                    <Trophy className="size-3.5" /> Overall Lead
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-muted-foreground font-medium">Avg Performance</div>
                  <div className="text-lg font-extrabold text-blue-500">{avg1} / 100</div>
                </div>
                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-muted-foreground font-medium">Fitness Score</div>
                  <div className="text-lg font-extrabold text-primary">{fit1} pts</div>
                </div>
                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-muted-foreground font-medium">Attendance Rate</div>
                  <div className="text-lg font-extrabold text-emerald-500">{att1}%</div>
                </div>
                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-muted-foreground font-medium">Strength / Power</div>
                  <div className="text-lg font-extrabold text-amber-500">{str1} pts</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Performance Logs</h4>
                {perfData1.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No recent performance logs recorded.</p>
                ) : (
                  perfData1.slice(0, 4).map((r) => (
                    <div key={r.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background border border-border">
                      <span className="font-medium text-foreground">{r.metric_name}</span>
                      <span className="font-bold text-blue-500">{r.metric_value} {r.metric_unit}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Athlete 2 Card */}
            <div className={`rounded-2xl border p-6 shadow-sm space-y-4 transition ${
              overall2 > overall1 ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-card'
            }`}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  {athData2?.profile_photo ? (
                    <img src={athData2.profile_photo} alt="" className="size-12 rounded-full object-cover border-2 border-emerald-500" />
                  ) : (
                    <div className="grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-base">
                      {athData2?.first_name?.[0]}{athData2?.last_name?.[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-foreground">{name2}</h3>
                    <p className="text-xs text-muted-foreground">{athData2?.sport_name || 'General'} • Code: {athData2?.athlete_code || 'ATH-2'}</p>
                  </div>
                </div>
                {overall2 > overall1 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-xs font-bold">
                    <Trophy className="size-3.5" /> Overall Lead
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-muted-foreground font-medium">Avg Performance</div>
                  <div className="text-lg font-extrabold text-emerald-500">{avg2} / 100</div>
                </div>
                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-muted-foreground font-medium">Fitness Score</div>
                  <div className="text-lg font-extrabold text-primary">{fit2} pts</div>
                </div>
                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-muted-foreground font-medium">Attendance Rate</div>
                  <div className="text-lg font-extrabold text-emerald-500">{att2}%</div>
                </div>
                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-muted-foreground font-medium">Strength / Power</div>
                  <div className="text-lg font-extrabold text-amber-500">{str2} pts</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Performance Logs</h4>
                {perfData2.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No recent performance logs recorded.</p>
                ) : (
                  perfData2.slice(0, 4).map((r) => (
                    <div key={r.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background border border-border">
                      <span className="font-medium text-foreground">{r.metric_name}</span>
                      <span className="font-bold text-emerald-500">{r.metric_value} {r.metric_unit}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
