import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, HeartPulse, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { injuryService } from '../../services/injuryService';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const AddInjury = () => {
  const navigate = useNavigate();

  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    athlete_id: '',
    injury_type: '',
    body_part: '',
    severity: 'moderate',
    diagnosis: '',
    treatment: '',
    medication: '',
    doctor_name: '',
    hospital: '',
    injury_date: new Date().toISOString().split('T')[0],
    expected_recovery_date: '',
    actual_recovery_date: '',
    recovery_status: 'recovering',
    availability_status: 'unfit',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.athlete_id || !form.injury_type || !form.injury_date) {
      toast.error('Please select Athlete, Injury Type, and Injury Date.');
      return;
    }

    // Validation: expected recovery date cannot be before injury date
    if (form.expected_recovery_date && form.expected_recovery_date < form.injury_date) {
      toast.error('Expected recovery date cannot be before injury date.');
      return;
    }

    setLoading(true);
    try {
      await injuryService.create(form);
      toast.success('Injury record created and AI recovery prediction engine initialized!');
      navigate('/injuries');
    } catch (err) {
      toast.error(err.message || 'Failed to record injury.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Record New Injury"
        subtitle="Log athlete medical diagnosis, recovery timeline, doctor details, and availability status."
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/injuries')}>Back to Register</Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-foreground">Injury Overview</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">Athlete *</label>
              <select
                required
                value={form.athlete_id}
                onChange={(e) => setForm({ ...form, athlete_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Athlete</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>{a.first_name} {a.last_name} ({a.athlete_code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Injury Date *</label>
              <input
                type="date"
                required
                value={form.injury_date}
                onChange={(e) => setForm({ ...form, injury_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-foreground">Injury Type *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hamstring Strain, Ankle Sprain"
                value={form.injury_type}
                onChange={(e) => setForm({ ...form, injury_type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Body Part Affected</label>
              <input
                type="text"
                placeholder="e.g. Right Hamstring, Left Knee"
                value={form.body_part}
                onChange={(e) => setForm({ ...form, body_part: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Severity Level</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="minor">Minor (1-7 Days)</option>
                <option value="moderate">Moderate (2-4 Weeks)</option>
                <option value="severe">Severe (1-3 Months)</option>
                <option value="critical">Critical (3+ Months / Surgery)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">Expected Recovery Date (Validation: Cannot be before Injury Date)</label>
              <input
                type="date"
                min={form.injury_date}
                value={form.expected_recovery_date}
                onChange={(e) => setForm({ ...form, expected_recovery_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Availability Status</label>
              <select
                value={form.availability_status}
                onChange={(e) => setForm({ ...form, availability_status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="unfit">Unfit (Out of Play)</option>
                <option value="restricted">Restricted Training</option>
                <option value="under_observation">Under Observation</option>
                <option value="fit">Fit for Selection</option>
              </select>
            </div>
          </div>

          <h3 className="text-sm font-bold text-foreground pt-4 border-t border-border">Medical & Hospital Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">Attending Doctor Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Rajesh Sharma"
                value={form.doctor_name}
                onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Hospital / Clinic</label>
              <input
                type="text"
                placeholder="e.g. Apollo Sports Medicine Clinic"
                value={form.hospital}
                onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Diagnosis Summary</label>
            <textarea
              rows={2}
              placeholder="Clinical diagnosis notes from MRI / Ultrasound / X-Ray..."
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Prescribed Treatment & Medication</label>
            <textarea
              rows={2}
              placeholder="Physical therapy drills, anti-inflammatory prescription, ice compression protocols..."
              value={form.treatment}
              onChange={(e) => setForm({ ...form, treatment: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/injuries')}>
            Cancel
          </Button>
          <Button type="submit" leftIcon={Save} loading={loading}>Save Injury Record</Button>
        </div>
      </form>
    </div>
  );
};

export default AddInjury;
