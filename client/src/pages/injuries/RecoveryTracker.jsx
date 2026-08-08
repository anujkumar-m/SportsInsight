import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Sparkles, Plus, CheckCircle2, ShieldAlert, HeartPulse, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { injuryService } from '../../services/injuryService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';

const RecoveryTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [injury, setInjury] = useState(null);
  const [loading, setLoading] = useState(true);

  // Checkup Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [checkupForm, setCheckupForm] = useState({
    checkup_date: new Date().toISOString().split('T')[0],
    recovery_percentage: 50,
    status_update: 'recovering',
    doctor_name: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await injuryService.getById(id);
        setInjury(res.data);
        const ai = res.data?.ai_analysis;
        setCheckupForm((f) => ({
          ...f,
          recovery_percentage: ai?.recoveryPercentage || 50,
          doctor_name: res.data?.doctor_name || '',
        }));
      } catch (e) {
        toast.error('Failed to load recovery data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAddCheckup = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await injuryService.addRecoveryLog(id, checkupForm);
      toast.success('Recovery checkup logged and AI return predictions updated!');
      setInjury(res.data);
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to log checkup.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading recovery tracker...</div>;
  if (!injury) return <div className="p-8 text-center text-muted-foreground">Injury not found.</div>;

  const ai = injury.ai_analysis;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`Recovery Tracker - ${injury.first_name} ${injury.last_name}`}
        subtitle={`Injury: ${injury.injury_type} (${injury.body_part || 'General'}) • Doctor: ${injury.doctor_name || 'N/A'}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/injuries')}>
              <ArrowLeft size={14} className="mr-1.5" /> Back to List
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={14} className="mr-1.5" /> Log Doctor Checkup
            </Button>
          </div>
        }
      />

      {/* Recovery Milestone & AI Overview Banner */}
      <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-primary uppercase">Current Recovery Progress</span>
            <div className="text-3xl font-black text-foreground mt-0.5">
              {ai?.recoveryPercentage || 0}% <span className="text-sm font-normal text-muted-foreground">Completed</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="text-xs text-muted-foreground">Expected Return Date</div>
              <div className="text-base font-bold text-foreground">{ai?.expectedReturnDate || 'TBD'}</div>
            </div>
            <Badge variant={injury.availability_status === 'fit' ? 'success' : 'warning'}>
              {injury.availability_status?.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-primary to-emerald-500 transition-all duration-500"
              style={{ width: `${ai?.recoveryPercentage || 0}%` }}
            />
          </div>
        </div>

        {/* AI Recommendations Card */}
        <div className="rounded-xl bg-secondary/50 p-4 space-y-3 text-xs border border-border">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" /> AI Recovery & Reinjury Risk Engine
            </span>
            <Badge variant={ai?.reinjuryProbability > 40 ? 'danger' : 'success'}>
              {ai?.reinjuryProbability}% Reinjury Risk
            </Badge>
          </div>
          <p className="text-muted-foreground">{ai?.medicalRecommendation}</p>
          <div className="pt-2 border-t border-border/50 text-foreground font-medium">
            Training Guidance: <span className="text-muted-foreground">{ai?.trainingRecommendation}</span>
          </div>
        </div>
      </div>

      {/* Checkup Timeline & Doctor Remarks */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Medical Checkups & Milestone Log</h3>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          {!injury.recoveryLogs || injury.recoveryLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No checkups logged yet. Click 'Log Doctor Checkup' above to add progress notes.</p>
          ) : (
            injury.recoveryLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl border border-border bg-background space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Clock size={13} className="text-primary" /> Checkup on {new Date(log.checkup_date).toLocaleDateString()}
                  </span>
                  <Badge variant={log.status_update === 'recovered' ? 'success' : 'info'}>
                    {log.recovery_percentage}% Recovered
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{log.notes || 'No notes added.'}</p>
                {log.doctor_name && <p className="text-[11px] text-muted-foreground font-medium">Attending Doctor: {log.doctor_name}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Log Checkup Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAddCheckup} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Log Doctor Checkup</h3>
            <div>
              <label className="text-xs font-medium text-foreground">Checkup Date</label>
              <input
                type="date"
                required
                value={checkupForm.checkup_date}
                onChange={(e) => setCheckupForm({ ...checkupForm, checkup_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Recovery Percentage ({checkupForm.recovery_percentage}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={checkupForm.recovery_percentage}
                onChange={(e) => setCheckupForm({ ...checkupForm, recovery_percentage: e.target.value })}
                className="mt-1 w-full accent-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Recovery Status</label>
              <select
                value={checkupForm.status_update}
                onChange={(e) => setCheckupForm({ ...checkupForm, status_update: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="recovering">Recovering</option>
                <option value="recovered">Full Recovered (Cleared)</option>
                <option value="chronic">Chronic</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Doctor Notes & Observations</label>
              <textarea
                rows={3}
                placeholder="Doctor's notes regarding mobility, strength test..."
                value={checkupForm.notes}
                onChange={(e) => setCheckupForm({ ...checkupForm, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button size="sm" type="submit" loading={saving}>Save Checkup</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RecoveryTracker;
