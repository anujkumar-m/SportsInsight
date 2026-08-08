import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ArrowLeft, User, Trophy, Activity, CalendarCheck, ShieldAlert, HeartPulse } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { athleteService } from '../../services/athleteService';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const AthleteAnalytics = () => {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [athletes, setAthletes] = useState([]);
  const [selectedId, setSelectedId] = useState(athleteId || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    athleteService.getAthletes({ limit: 100 })
      .then(r => {
        const list = r.data.athletes || r.data || [];
        setAthletes(list);
        if (!selectedId && list.length > 0) {
          setSelectedId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      analyticsService.getAthlete(selectedId)
        .then(r => setData(r.data.data))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [selectedId]);

  const athlete = data?.athlete;
  const perfTrend = data?.performanceTrend || [];
  const fitnessTrend = data?.fitnessTrend || [];
  const attSummary = data?.attendanceSummary || {};
  const injuries = data?.injuries || [];
  const ranking = data?.ranking || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Athlete Performance Analytics</h1>
          <p className="text-xs text-muted-foreground">Individual development trends, fitness stats, and historical metrics</p>
        </div>
        <div className="w-full sm:w-64">
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Select Athlete</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm"
          >
            {athletes.map(a => (
              <option key={a.id} value={a.id}>{a.first_name} {a.last_name} ({a.athlete_code})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : !athlete ? (
        <div className="p-8 text-center text-muted-foreground rounded-2xl border border-border bg-card">
          Select an athlete to view analytics.
        </div>
      ) : (
        <>
          {/* Athlete Profile Overview Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl">
                {athlete.first_name?.[0]}{athlete.last_name?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{athlete.first_name} {athlete.last_name}</h2>
                <p className="text-xs text-muted-foreground">{athlete.athlete_code} • {athlete.sport || 'Unassigned'} ({athlete.category || 'General'})</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={athlete.medical_status === 'fit' ? 'success' : 'danger'}>
                    Medical: {athlete.medical_status}
                  </Badge>
                  <Badge variant="outline">Age: {athlete.date_of_birth ? new Date().getFullYear() - new Date(athlete.date_of_birth).getFullYear() : 'N/A'}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 text-center border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <div>
                <div className="text-xs text-muted-foreground font-medium">Academy Rank</div>
                <div className="text-2xl font-black text-primary">#{ranking?.rank_position || '—'}</div>
                <div className="text-[10px] text-muted-foreground">Score: {ranking?.overall_ranking_score || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Attendance</div>
                <div className="text-2xl font-black text-amber-500">{attSummary?.pct || 0}%</div>
                <div className="text-[10px] text-muted-foreground">{attSummary?.present || 0}/{attSummary?.total || 0} Sessions</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Injuries</div>
                <div className="text-2xl font-black text-rose-500">{injuries.length}</div>
                <div className="text-[10px] text-muted-foreground">Historical records</div>
              </div>
            </div>
          </div>

          {/* Performance & Fitness Trends */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity size={16} className="text-primary" /> Performance History Trend
              </h3>
              {perfTrend.length === 0 ? (
                <p className="text-xs text-muted-foreground py-12 text-center">No performance records found.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={perfTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="record_date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
                    <Line type="monotone" dataKey="performance_score" stroke="#6366f1" strokeWidth={3} name="Perf Score" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HeartPulse size={16} className="text-cyan-500" /> Fitness Score Evolution
              </h3>
              {fitnessTrend.length === 0 ? (
                <p className="text-xs text-muted-foreground py-12 text-center">No fitness assessments found.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={fitnessTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="assessment_date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
                    <Line type="monotone" dataKey="overall_fitness_score" stroke="#22d3ee" strokeWidth={3} name="Overall Fitness" />
                    <Line type="monotone" dataKey="strength_score" stroke="#f59e0b" strokeDasharray="4 4" name="Strength" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AthleteAnalytics;
