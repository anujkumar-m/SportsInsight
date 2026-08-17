import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { performanceService } from '../../services/performanceService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const EditPerformance = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    athlete_name: '',
    metric_name: '',
    metric_value: '',
    metric_unit: '',
    record_date: '',
    notes: '',
  });

  useEffect(() => {
    async function loadRecord() {
      try {
        const res = await performanceService.getById(id);
        const r = res.data;
        setForm({
          athlete_name: `${r.first_name} ${r.last_name} (${r.athlete_code})`,
          metric_name: r.metric_name,
          metric_value: r.metric_value,
          metric_unit: r.metric_unit,
          record_date: r.record_date?.split('T')[0] || '',
          notes: r.notes || '',
        });
      } catch (e) {
        toast.error('Failed to load performance record.');
        navigate('/performance');
      } finally {
        setFetching(false);
      }
    }
    loadRecord();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(form.metric_value) < 0) {
      toast.error('Performance value cannot be negative.');
      return;
    }

    setLoading(true);
    try {
      await performanceService.update(id, form);
      toast.success('Performance record updated successfully.');
      navigate('/performance');
    } catch (err) {
      toast.error(err.message || 'Failed to update record.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-muted-foreground">Loading record details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Edit Performance Record"
        subtitle="Modify performance metric entry and update AI confidence scores."
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/performance')}>Back to List</Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Athlete</label>
            <div className="mt-1 text-base font-bold text-foreground">{form.athlete_name}</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <div>
              <label className="text-xs font-medium text-foreground">Metric Name *</label>
              <input
                type="text"
                required
                value={form.metric_name}
                onChange={(e) => setForm({ ...form, metric_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">Metric Value * (Non-Negative)</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={form.metric_value}
                onChange={(e) => setForm({ ...form, metric_value: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Metric Unit</label>
              <input
                type="text"
                value={form.metric_unit}
                onChange={(e) => setForm({ ...form, metric_unit: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Notes / Remarks</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/performance')}>
            Cancel
          </Button>
          <Button type="submit" leftIcon={Save} loading={loading}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default EditPerformance;
