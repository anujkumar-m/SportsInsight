import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import { performanceService } from '../../services/performanceService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const PerformanceComparison = () => {
  const navigate = useNavigate();

  const [athletes, setAthletes] = useState([]);
  const [selectedAthlete1, setSelectedAthlete1] = useState('');
  const [selectedAthlete2, setSelectedAthlete2] = useState('');

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
          setSelectedAthlete1(list[0].id);
          setSelectedAthlete2(list[1].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadAthletes();
  }, []);

  useEffect(() => {
    async function compare() {
      if (!selectedAthlete1 || !selectedAthlete2) return;
      setLoading(true);
      try {
        const [a1, a2, p1, p2] = await Promise.all([
          athleteService.getAthleteById(selectedAthlete1).catch(() => ({ data: null })),
          athleteService.getAthleteById(selectedAthlete2).catch(() => ({ data: null })),
          performanceService.getHistory(selectedAthlete1).catch(() => ({ data: { records: [] } })),
          performanceService.getHistory(selectedAthlete2).catch(() => ({ data: { records: [] } })),
        ]);
        setAthData1(a1.data);
        setAthData2(a2.data);
        setPerfData1(p1.data?.records || p1.data || []);
        setPerfData2(p2.data?.records || p2.data || []);
      } catch (e) {
        toast.error('Failed to load comparison data.');
      } finally {
        setLoading(false);
      }
    }
    compare();
  }, [selectedAthlete1, selectedAthlete2]);

  const calcAvgScore = (records) => {
    if (records.length === 0) return 0;
    return Math.round(records.reduce((acc, r) => acc + (r.performance_score || 75), 0) / records.length);
  };

  const avg1 = calcAvgScore(perfData1);
  const avg2 = calcAvgScore(perfData2);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Side-by-Side Performance Comparison"
        subtitle="Compare athlete metrics, AI scores, and trends to assist squad selection decisions."
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/performance')}>
            <ArrowLeft size={14} className="mr-1.5" /> Back to Records
          </Button>
        }
      />

      {/* Athlete Selection Dropdowns */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-foreground">Athlete 1</label>
          <select
            value={selectedAthlete1}
            onChange={(e) => setSelectedAthlete1(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>{a.first_name} {a.last_name} ({a.athlete_code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground">Athlete 2</label>
          <select
            value={selectedAthlete2}
            onChange={(e) => setSelectedAthlete2(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>{a.first_name} {a.last_name} ({a.athlete_code})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Comparing athletes...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Athlete 1 Card */}
          <div className={`rounded-2xl border p-6 shadow-sm space-y-4 ${avg1 >= avg2 ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
            <div className="flex items-center gap-3">
              {athData1?.profile_photo ? (
                <img src={athData1.profile_photo} alt="" className="size-14 rounded-full object-cover border-2 border-primary" />
              ) : (
                <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {athData1?.first_name?.[0]}{athData1?.last_name?.[0]}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-foreground">{athData1?.first_name} {athData1?.last_name}</h3>
                <p className="text-xs text-muted-foreground">{athData1?.sport_name} • Code: {athData1?.athlete_code}</p>
              </div>
            </div>

            <div className="rounded-xl bg-background p-4 border border-border space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-muted-foreground">AI Performance Score</span>
                <span className="text-primary text-xl font-bold">{avg1} / 100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Evaluated Records</span>
                <span className="font-bold text-foreground">{perfData1.length}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Performance Metrics</h4>
              {perfData1.slice(0, 5).map((r) => (
                <div key={r.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background border border-border">
                  <span className="font-medium text-foreground">{r.metric_name}</span>
                  <span className="font-bold text-primary">{r.metric_value} {r.metric_unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Athlete 2 Card */}
          <div className={`rounded-2xl border p-6 shadow-sm space-y-4 ${avg2 > avg1 ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
            <div className="flex items-center gap-3">
              {athData2?.profile_photo ? (
                <img src={athData2.profile_photo} alt="" className="size-14 rounded-full object-cover border-2 border-primary" />
              ) : (
                <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {athData2?.first_name?.[0]}{athData2?.last_name?.[0]}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-foreground">{athData2?.first_name} {athData2?.last_name}</h3>
                <p className="text-xs text-muted-foreground">{athData2?.sport_name} • Code: {athData2?.athlete_code}</p>
              </div>
            </div>

            <div className="rounded-xl bg-background p-4 border border-border space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-muted-foreground">AI Performance Score</span>
                <span className="text-primary text-xl font-bold">{avg2} / 100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Evaluated Records</span>
                <span className="font-bold text-foreground">{perfData2.length}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Performance Metrics</h4>
              {perfData2.slice(0, 5).map((r) => (
                <div key={r.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background border border-border">
                  <span className="font-medium text-foreground">{r.metric_name}</span>
                  <span className="font-bold text-primary">{r.metric_value} {r.metric_unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceComparison;
