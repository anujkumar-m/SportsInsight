import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { fitnessService } from '../../services/fitnessService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const EditFitness = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [athleteName, setAthleteName] = useState('');

  const [form, setForm] = useState({
    assessment_date: '',
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
    async function loadRecord() {
      try {
        const res = await fitnessService.getById(id);
        const r = res.data;
        setAthleteName(`${r.first_name} ${r.last_name} (${r.athlete_code})`);
        setForm({
          assessment_date: r.assessment_date?.split('T')[0] || '',
          height_cm: r.height_cm || '',
          weight_kg: r.weight_kg || '',
          strength_score: r.strength_score || 0,
          endurance_score: r.endurance_score || 0,
          stamina_score: r.stamina_score || 0,
          flexibility_score: r.flexibility_score || 0,
          agility_score: r.agility_score || 0,
          speed_score: r.speed_score || 0,
          reaction_time_ms: r.reaction_time_ms || 0,
          balance_score: r.balance_score || 0,
          body_fat_percentage: r.body_fat_percentage || 0,
          vo2_max: r.vo2_max || 0,
          resting_heart_rate: r.resting_heart_rate || 70,
          recovery_rate_bpm: r.recovery_rate_bpm || 30,
          notes: r.notes || '',
        });
      } catch (e) {
        toast.error('Failed to load fitness assessment.');
        navigate('/fitness');
      } finally {
        setFetching(false);
      }
    }
    loadRecord();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fitnessService.update(id, form);
      toast.success('Fitness assessment updated successfully.');
      navigate('/fitness');
    } catch (err) {
      toast.error(err.message || 'Failed to update assessment.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-muted-foreground">Loading assessment...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Edit Fitness Assessment"
        subtitle={`Athlete: ${athleteName}`}
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/fitness')}>Back to List</Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-foreground">Assessment Date *</label>
              <input
                type="date"
                required
                value={form.assessment_date}
                onChange={(e) => setForm({ ...form, assessment_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Height (cm)</label>
              <input
                type="number"
                value={form.height_cm}
                onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Weight (kg)</label>
              <input
                type="number"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-foreground">Strength</label>
              <input
                type="number"
                value={form.strength_score}
                onChange={(e) => setForm({ ...form, strength_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Endurance</label>
              <input
                type="number"
                value={form.endurance_score}
                onChange={(e) => setForm({ ...form, endurance_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Stamina</label>
              <input
                type="number"
                value={form.stamina_score}
                onChange={(e) => setForm({ ...form, stamina_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Flexibility</label>
              <input
                type="number"
                value={form.flexibility_score}
                onChange={(e) => setForm({ ...form, flexibility_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Agility</label>
              <input
                type="number"
                value={form.agility_score}
                onChange={(e) => setForm({ ...form, agility_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Speed</label>
              <input
                type="number"
                value={form.speed_score}
                onChange={(e) => setForm({ ...form, speed_score: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/fitness')}>Cancel</Button>
          <Button type="submit" leftIcon={Save} loading={loading}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default EditFitness;
