import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Save, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectionService } from '../../services/selectionService';
import { sportService } from '../../services/sportService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const RecommendedAthletes = () => {
  const navigate = useNavigate();

  const [sports, setSports] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    sportId: '',
    gender: '',
    limit: 10,
  });

  useEffect(() => {
    sportService.listSports().then(res => setSports(res.data || []));
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await selectionService.getRecommendations(filters);
      setRecommendations(res.data || []);
      toast.success(`Generated AI recommendations for ${res.data?.length || 0} athletes.`);
    } catch (e) {
      toast.error('Failed to generate AI recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [filters.sportId, filters.gender]);

  const handleSaveList = async () => {
    if (recommendations.length === 0) return;
    setSaving(true);
    try {
      await selectionService.generate({
        filters,
        selectionType: 'State Selection Trial',
        save: true,
      });
      toast.success('Selections saved to database official register!');
      navigate('/selections');
    } catch (e) {
      toast.error('Failed to save selections.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="AI Selection Recommendation Engine"
        subtitle="Objective multi-variate scoring (40% Performance, 30% Fitness, 20% Attendance, 10% Coach)"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/selections')}>
              <ArrowLeft size={14} className="mr-1.5" /> Back to Dashboard
            </Button>
            <Button size="sm" loading={saving} onClick={handleSaveList} disabled={recommendations.length === 0}>
              <Save size={14} className="mr-1.5" /> Save Official Selection List
            </Button>
          </div>
        }
      />

      {/* Filter Controls */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Configure Selection Criteria</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-foreground">Sport</label>
            <select
              value={filters.sportId}
              onChange={(e) => setFilters({ ...filters, sportId: e.target.value })}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
            >
              <option value="">All Sports</option>
              {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Gender</label>
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Max Athletes</label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommendations Cards */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : recommendations.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground rounded-2xl border border-border bg-card">
          No athletes met the selection criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <div key={rec.athlete_id} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                  #{idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-foreground">{rec.first_name} {rec.last_name}</h4>
                    <Badge variant={rec.recommendation === 'selected' ? 'success' : 'info'}>
                      {rec.recommendation}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.athlete_code} • {rec.sport || 'General'} ({rec.category || 'Open'})</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {rec.strengths?.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-6 text-right w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-border pt-3 md:pt-0">
                <div>
                  <div className="text-xs text-muted-foreground">Selection Score</div>
                  <div className="text-xl font-black text-primary">{rec.selectionScore}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">AI Confidence</div>
                  <div className="text-xl font-black text-emerald-500">{rec.confidenceScore}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendedAthletes;
