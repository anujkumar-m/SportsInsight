import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { injuryService } from '../../services/injuryService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const EditInjury = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [athleteName, setAthleteName] = useState('');

  const [form, setForm] = useState({
    injury_type: '',
    body_part: '',
    severity: 'moderate',
    diagnosis: '',
    treatment: '',
    medication: '',
    doctor_name: '',
    hospital: '',
    injury_date: '',
    expected_recovery_date: '',
    actual_recovery_date: '',
    recovery_status: 'recovering',
    availability_status: 'unfit',
    notes: '',
  });

  useEffect(() => {
    async function loadRecord() {
      try {
        const res = await injuryService.getById(id);
        const r = res.data;
        setAthleteName(`${r.first_name} ${r.last_name} (${r.athlete_code})`);
        setForm({
          injury_type: r.injury_type || '',
          body_part: r.body_part || '',
          severity: r.severity || 'moderate',
          diagnosis: r.diagnosis || '',
          treatment: r.treatment || '',
          medication: r.medication || '',
          doctor_name: r.doctor_name || '',
          hospital: r.hospital || '',
          injury_date: r.injury_date?.split('T')[0] || '',
          expected_recovery_date: r.expected_recovery_date?.split('T')[0] || '',
          actual_recovery_date: r.actual_recovery_date?.split('T')[0] || '',
          recovery_status: r.recovery_status || 'recovering',
          availability_status: r.availability_status || 'unfit',
          notes: r.notes || '',
        });
      } catch (e) {
        toast.error('Failed to load injury record.');
        navigate('/injuries');
      } finally {
        setFetching(false);
      }
    }
    loadRecord();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.expected_recovery_date && form.expected_recovery_date < form.injury_date) {
      toast.error('Expected recovery date cannot be before injury date.');
      return;
    }

    setLoading(true);
    try {
      await injuryService.update(id, form);
      toast.success('Injury record updated.');
      navigate('/injuries');
    } catch (err) {
      toast.error(err.message || 'Failed to update record.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-muted-foreground">Loading record details...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Edit Injury Record"
        subtitle={`Athlete: ${athleteName}`}
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/injuries')}>Back to Register</Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-foreground">Injury Type *</label>
              <input
                type="text"
                required
                value={form.injury_type}
                onChange={(e) => setForm({ ...form, injury_type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Body Part</label>
              <input
                type="text"
                value={form.body_part}
                onChange={(e) => setForm({ ...form, body_part: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">Expected Return Date</label>
              <input
                type="date"
                min={form.injury_date}
                value={form.expected_recovery_date}
                onChange={(e) => setForm({ ...form, expected_recovery_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Availability Status</label>
              <select
                value={form.availability_status}
                onChange={(e) => setForm({ ...form, availability_status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="unfit">Unfit</option>
                <option value="restricted">Restricted Training</option>
                <option value="under_observation">Under Observation</option>
                <option value="fit">Fit for Selection</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/injuries')}>Cancel</Button>
          <Button type="submit" leftIcon={Save} loading={loading}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default EditInjury;
