import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, Activity, Heart, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { fitnessService } from '../../services/fitnessService';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const AddFitness = () => {
  const navigate = useNavigate();

  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    athlete_id: '',
    assessment_date: new Date().toISOString().split('T')[0],
    height_cm: '',
    weight_kg: '',
    strength_score: 75,
    endurance_score: 75,
    stamina_score: 75,
    flexibility_score: 75,
    agility_score: 75,
    speed_score: 75,
    reaction_time_ms: 220,
    balance_score: 80,
    body_fat_percentage: 14,
    vo2_max: 55,
    resting_heart_rate: 65,
    recovery_rate_bpm: 35,
    notes: '',
  });

  useEffect(() => {
    async function loadAthletes() {
      try {
        const res = await athleteService.getAthletes({ limit: 150 });
        setAthletes(res.data?.athletes || res.data || []);
      } catch (e) {
        toast.error('Failed to load athletes.');
      }
    }
    loadAthletes();
  }, []);

  const handleAthleteChange = (e) => {
    const id = e.target.value;
    const found = athletes.find((a) => String(a.id) === String(id));
    setForm((f) => ({
      ...f,
      athlete_id: id,
      height_cm: found?.height_cm || f.height_cm,
      weight_kg: found?.weight_kg || f.weight_kg,
    }));
  };

  // Real-time BMI calculation
  const computedBmi =
    form.height_cm && form.weight_kg && parseFloat(form.height_cm) > 0 && parseFloat(form.weight_kg) > 0
      ? Math.round((parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)) * 100) / 100
      : null;

  // Real-time Fitness Score preview
  const liveScore = Math.round(
    parseFloat(form.strength_score || 0) * 0.20 +
    parseFloat(form.endurance_score || 0) * 0.20 +
    parseFloat(form.stamina_score || 0) * 0.15 +
    parseFloat(form.flexibility_score || 0) * 0.15 +
    parseFloat(form.agility_score || 0) * 0.15 +
    parseFloat(form.speed_score || 0) * 0.10 +
    parseFloat(form.balance_score || 0) * 0.05
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.athlete_id || !form.assessment_date) {
      toast.error('Please select Athlete and Assessment Date.');
      return;
    }

    // Non-negative validation
    const numKeys = [
      'strength_score', 'endurance_score', 'stamina_score', 'flexibility_score',
      'agility_score', 'speed_score', 'reaction_time_ms', 'balance_score',
      'body_fat_percentage', 'vo2_max', 'resting_heart_rate', 'recovery_rate_bpm',
      'height_cm', 'weight_kg'
    ];
    for (const key of numKeys) {
      if (form[key] !== '' && parseFloat(form[key]) < 0) {
        toast.error(`Fitness parameters cannot be negative.`);
        return;
      }
    }

    setLoading(true);
    try {
      await fitnessService.create(form);
      toast.success('Fitness assessment saved successfully!');
      navigate('/fitness');
    } catch (err) {
      toast.error(err.message || 'Failed to save fitness assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Add Fitness Assessment"
        subtitle="Log physical assessment parameters for real-time BMI and AI fitness scoring."
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/fitness')}>Back to List</Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-foreground">Basic Info & Body Composition</h3>

          <div className="grid gap-4 sm:grid-cols-3">
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
                  <option key={a.id} value={a.id}>{a.first_name} {a.last_name} ({a.athlete_code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Assessment Date *</label>
              <input
                type="date"
                required
                value={form.assessment_date}
                onChange={(e) => setForm({ ...form, assessment_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex flex-col justify-center">
              <span className="text-xs text-muted-foreground font-medium">Calculated BMI</span>
              <span className="text-xl font-black text-primary">{computedBmi !== null ? computedBmi : '—'}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-foreground">Height (cm)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 178"
                value={form.height_cm}
                onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Weight (kg)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 72"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Body Fat (%)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 14.5"
                value={form.body_fat_percentage}
                onChange={(e) => setForm({ ...form, body_fat_percentage: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        </div>

        {/* 13 Fitness Parameters Grid */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Physical Fitness Parameters (0 - 100 Scores)</h3>
            <div className="text-sm font-bold text-emerald-500">Live Fitness Preview: {liveScore} / 100</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-foreground">Strength Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.strength_score}
                onChange={(e) => setForm({ ...form, strength_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Endurance Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.endurance_score}
                onChange={(e) => setForm({ ...form, endurance_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Stamina Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.stamina_score}
                onChange={(e) => setForm({ ...form, stamina_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Flexibility Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.flexibility_score}
                onChange={(e) => setForm({ ...form, flexibility_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Agility Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.agility_score}
                onChange={(e) => setForm({ ...form, agility_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Speed Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.speed_score}
                onChange={(e) => setForm({ ...form, speed_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Balance Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.balance_score}
                onChange={(e) => setForm({ ...form, balance_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Reaction Time (ms)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 210"
                value={form.reaction_time_ms}
                onChange={(e) => setForm({ ...form, reaction_time_ms: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">VO2 Max (ml/kg/min)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 58"
                value={form.vo2_max}
                onChange={(e) => setForm({ ...form, vo2_max: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <h3 className="text-sm font-bold text-foreground pt-4 border-t border-border">Heart Rate & Recovery Indicators</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">Resting Heart Rate (bpm)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 62"
                value={form.resting_heart_rate}
                onChange={(e) => setForm({ ...form, resting_heart_rate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Recovery Rate (bpm drop in 1 min)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 35"
                value={form.recovery_rate_bpm}
                onChange={(e) => setForm({ ...form, recovery_rate_bpm: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Coach / Evaluator Remarks</label>
            <textarea
              rows={3}
              placeholder="Notes on technique, endurance fatigue, or muscle tightness..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/fitness')}>
            Cancel
          </Button>
          <Button type="submit" leftIcon={Save} loading={loading}>Save Fitness Assessment</Button>
        </div>
      </form>
    </div>
  );
};

export default AddFitness;
