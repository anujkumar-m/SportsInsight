import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { performanceService } from '../../services/performanceService';
import { athleteService } from '../../services/athleteService';
import { sportService } from '../../services/sportService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const AddPerformance = () => {
  const navigate = useNavigate();

  const [athletes, setAthletes] = useState([]);
  const [sports, setSports] = useState([]);
  const [sportMetrics, setSportMetrics] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    athlete_id: '',
    sport_id: '',
    record_date: new Date().toISOString().split('T')[0],
    metric_name: '',
    metric_value: '',
    metric_unit: '',
    notes: '',
  });

  const [previewAI, setPreviewAI] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const athRes = await athleteService.getAthletes({ limit: 200 });
        setAthletes(athRes.data?.athletes || athRes.data || []);
        const spRes = await sportService.listSports();
        setSports(spRes.data || []);
      } catch (e) {
        toast.error('Failed to load form metadata.');
      }
    }
    init();
  }, []);

  const handleAthleteChange = (e) => {
    const athleteId = e.target.value;
    const selectedAth = athletes.find((a) => String(a.id) === String(athleteId));
    const sportId = selectedAth?.sport_id || form.sport_id;

    setForm((f) => ({ ...f, athlete_id: athleteId, sport_id: sportId }));
    if (sportId) {
      loadMetrics(sportId);
    }
  };

  const handleSportChange = (e) => {
    const sId = e.target.value;
    setForm((f) => ({ ...f, sport_id: sId, metric_name: '', metric_unit: '' }));
    if (sId) {
      loadMetrics(sId);
    }
  };

  const loadMetrics = async (sId) => {
    try {
      const res = await performanceService.getSportMetrics(sId);
      setSportMetrics(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMetricSelect = (metricKey) => {
    const found = sportMetrics.find((m) => m.metric_key === metricKey);
    setForm((f) => ({
      ...f,
      metric_name: metricKey,
      metric_unit: found?.metric_unit || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.athlete_id || !form.metric_name || form.metric_value === '') {
      toast.error('Please select Athlete, Metric, and enter Metric Value.');
      return;
    }
    if (parseFloat(form.metric_value) < 0) {
      toast.error('Performance values cannot be negative.');
      return;
    }

    setLoading(true);
    try {
      await performanceService.create(form);
      toast.success('Performance record created successfully!');
      navigate('/performance');
    } catch (err) {
      toast.error(err.message || 'Failed to add performance record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Add Performance Record"
        subtitle="Record sport-specific athlete metrics to trigger automated AI performance scoring."
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/performance')}>
            <ArrowLeft size={14} className="mr-1.5" /> Back to List
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h3 className="text-base font-semibold text-foreground">Record Information</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">Athlete *</label>
              <select
                required
                value={form.athlete_id}
                onChange={handleAthleteChange}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Athlete</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.first_name} {a.last_name} ({a.athlete_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Sport *</label>
              <select
                required
                value={form.sport_id}
                onChange={handleSportChange}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Sport</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Record Date *</label>
              <input
                type="date"
                required
                value={form.record_date}
                onChange={(e) => setForm({ ...form, record_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Sport Specific Metrics Selection */}
          {sportMetrics.length > 0 && (
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">Sport Specific Metric Presets</label>
              <div className="flex flex-wrap gap-2">
                {sportMetrics.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleMetricSelect(m.metric_key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                      form.metric_name === m.metric_key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background hover:bg-secondary text-muted-foreground'
                    }`}
                  >
                    {m.metric_label} ({m.metric_unit})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-foreground">Metric Name / Key *</label>
              <input
                type="text"
                required
                placeholder="e.g. goals, runs, sprint_time, smash_accuracy"
                value={form.metric_name}
                onChange={(e) => setForm({ ...form, metric_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Metric Unit</label>
              <input
                type="text"
                placeholder="e.g. goals, km/h, sec, %"
                value={form.metric_unit}
                onChange={(e) => setForm({ ...form, metric_unit: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Metric Value * (Non-Negative)</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="Enter numerical metric value"
              value={form.metric_value}
              onChange={(e) => setForm({ ...form, metric_value: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Coach Remarks / Field Notes</label>
            <textarea
              rows={3}
              placeholder="Optional remarks regarding form, strategy, weather, or tactical performance..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* AI Preview Banner */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-2">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Sparkles size={16} /> Automated AI Performance Processing Engine
          </div>
          <p className="text-xs text-muted-foreground">
            Submitting this record automatically calculates Performance Score, Improvement Rate vs historical baseline, Trend flags, and updates Central Academy Rankings.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/performance')}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            <Save size={14} className="mr-1.5" /> Save Performance Record
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddPerformance;
