import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import coachService from '../../services/coachService';
import athleteService from '../../services/athleteService';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-hot-toast';
import {
  MessageSquare,
  Plus,
  Star,
  User,
  Calendar,
  Filter,
  Trash2,
  X,
  Check,
  Award,
  Sparkles,
} from 'lucide-react';

const REMARK_TYPES = [
  { value: 'all', label: 'All Remarks' },
  { value: 'performance', label: 'Performance' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'behavior', label: 'Behavior & Discipline' },
  { value: 'general', label: 'General Feedback' },
];

export default function CoachFeedback() {
  const { user, role } = useAuth();
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State for new remark
  const [assignedAthletes, setAssignedAthletes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [newRemark, setNewRemark] = useState({
    athlete_id: '',
    remark_type: 'performance',
    rating: 8.5,
    remarks: '',
  });

  const fetchRemarks = async () => {
    try {
      setLoading(true);
      const params = selectedType !== 'all' ? { remark_type: selectedType } : {};
      const res = await coachService.getRemarks(params);
      const data = res?.data || res || [];
      setRemarks(data);
    } catch (err) {
      toast.error('Failed to load feedback records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAthletes = async () => {
    try {
      const res = await athleteService.getAthletes({ limit: 100 });
      const list = res?.data || res?.athletes || [];
      setAssignedAthletes(list);
      if (list.length > 0) {
        setNewRemark((prev) => ({ ...prev, athlete_id: list[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRemarks();
  }, [selectedType]);

  useEffect(() => {
    if (['admin', 'coach'].includes(role)) {
      fetchAthletes();
    }
  }, [role]);

  const handleCreateRemark = async (e) => {
    e.preventDefault();
    if (!newRemark.athlete_id) {
      toast.error('Please select an athlete');
      return;
    }
    if (!newRemark.remarks.trim()) {
      toast.error('Please enter feedback notes');
      return;
    }

    try {
      setSubmitting(true);
      await coachService.createRemark({
        athlete_id: Number(newRemark.athlete_id),
        remark_type: newRemark.remark_type,
        rating: Number(newRemark.rating),
        remarks: newRemark.remarks,
      });
      toast.success('Coach remark submitted successfully');
      setModalOpen(false);
      setNewRemark({ athlete_id: assignedAthletes[0]?.id || '', remark_type: 'performance', rating: 8.5, remarks: '' });
      fetchRemarks();
    } catch (err) {
      toast.error(err.message || 'Failed to submit remark');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRemark = async (id) => {
    if (!window.confirm('Are you sure you want to delete this remark?')) return;
    try {
      await coachService.deleteRemark(id);
      toast.success('Remark deleted');
      setRemarks((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error('Failed to delete remark');
    }
  };

  const avgRating =
    remarks.length > 0
      ? (remarks.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / remarks.length).toFixed(1)
      : 'N/A';

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Coach Feedback & Remarks"
        subtitle="Review qualitative evaluation logs, ratings, and performance notes submitted by coaches."
        breadcrumb="Coach Feedback"
      >
        {['admin', 'coach'].includes(role) && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
          >
            <Plus className="size-4" /> Add Feedback Remark
          </button>
        )}
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Remarks</span>
            <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-card-foreground">{remarks.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average Rating</span>
            <div className="grid size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
              <Star className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-card-foreground">{avgRating} / 10</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Evaluated</span>
            <div className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Award className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-card-foreground">
            {new Set(remarks.map((r) => r.athlete_id)).size} Athletes
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-3">
        <Filter className="size-4 text-muted-foreground shrink-0" />
        {REMARK_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setSelectedType(t.value)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              selectedType === t.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Remarks Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : remarks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <MessageSquare className="mx-auto size-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-base font-semibold text-card-foreground">No Feedback Remarks Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            There are currently no feedback remarks logged under this filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {remarks.map((item) => (
            <div
              key={item.id}
              className="relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-full bg-navy text-xs font-bold text-navy-foreground">
                      {item.athlete_name?.[0] || 'A'}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-card-foreground">{item.athlete_name || 'Athlete'}</p>
                      <p className="text-xs text-muted-foreground">{item.athlete_code || 'ATH'}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Star className="size-3 fill-amber-500 text-amber-500" /> {Number(item.rating || 0).toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className={`capitalize rounded-md px-2 py-0.5 font-semibold text-[11px] ${
                    item.source === 'performance'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : item.source === 'fitness'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-secondary text-foreground'
                  }`}>
                    {item.source === 'performance' ? '⚡ Performance Record' : item.source === 'fitness' ? '💪 Fitness Assessment' : (item.remark_type || 'General Feedback')}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" /> {item.remark_date ? new Date(item.remark_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <p className="text-sm text-card-foreground leading-relaxed bg-secondary/30 p-3 rounded-lg border border-border/50">
                  "{item.remarks}"
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium">
                  <User className="size-3 text-primary" /> {item.coach_name || 'Assigned Coach'}
                </span>
                {['admin', 'coach'].includes(role) && item.source === 'coach' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRemark(item.id)}
                    className="text-destructive hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="size-3" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Remark Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-card-foreground flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> Submit Coach Remark
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRemark} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Select Athlete
                </label>
                <select
                  value={newRemark.athlete_id}
                  onChange={(e) => setNewRemark({ ...newRemark, athlete_id: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {assignedAthletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.first_name || a.full_name} {a.last_name || ''} ({a.athlete_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Remark Type
                  </label>
                  <select
                    value={newRemark.remark_type}
                    onChange={(e) => setNewRemark({ ...newRemark, remark_type: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="performance">Performance</option>
                    <option value="fitness">Fitness</option>
                    <option value="behavior">Behavior & Discipline</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Rating Score ({newRemark.rating} / 10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={newRemark.rating}
                    onChange={(e) => setNewRemark({ ...newRemark, rating: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary mt-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Detailed Remarks & Guidance
                </label>
                <textarea
                  rows={4}
                  value={newRemark.remarks}
                  onChange={(e) => setNewRemark({ ...newRemark, remarks: e.target.value })}
                  placeholder="Provide constructive feedback, observed progress, or areas for improvement..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Remark'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
