import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Activity, Heart, Zap, Award, BarChart2, FileText, RefreshCw, X, MessageSquare, Calendar, ShieldCheck, Flame, Dumbbell } from 'lucide-react';
import toast from 'react-hot-toast';
import { fitnessService } from '../../services/fitnessService';
import { athleteService } from '../../services/athleteService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const FitnessList = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [assessments, setAssessments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  // Row Details Modal
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // Prevent background scroll when modal open
  useEffect(() => {
    if (selectedAssessment) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = orig; };
    }
  }, [selectedAssessment]);

  const [search, setSearch] = useState('');
  const [athleteId, setAthleteId] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [analytics, setAnalytics] = useState(null);

  const fetchAthletes = async () => {
    try {
      const res = await athleteService.getAthletes({ limit: 100 });
      setAthletes(res.data?.athletes || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fitnessService.getAssessments({
        page,
        limit,
        search,
        athleteId: athleteId || undefined,
      });
      const recordList = res?.data?.data?.assessments || res?.data?.assessments || res?.assessments || (Array.isArray(res?.data) ? res.data : []);
      const totalCount = res?.data?.data?.pagination?.total ?? res?.data?.pagination?.total ?? res?.pagination?.total ?? recordList.length;
      setAssessments(recordList);
      setTotal(totalCount);
    } catch (e) {
      toast.error('Failed to load fitness assessments.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, athleteId]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fitnessService.getAnalytics();
      setAnalytics(res.data.summary);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchAthletes();
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await fitnessService.delete(confirmDelete.id);
      toast.success('Fitness assessment deleted.');
      setConfirmDelete(null);
      fetchAssessments();
      fetchAnalytics();
    } catch (e) {
      toast.error('Failed to delete assessment.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'athlete',
      label: 'Athlete',
      width: '26%',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          {row.profile_photo ? (
            <img src={row.profile_photo} alt="" className="size-9 rounded-full object-cover border border-border" />
          ) : (
            <div className="grid size-9 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs">
              {row.first_name?.[0]}{row.last_name?.[0]}
            </div>
          )}
          <div>
            <div className="font-semibold text-foreground">{row.first_name} {row.last_name}</div>
            <div className="text-xs text-muted-foreground">{row.athlete_code} • {row.sport_name}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'assessment_date',
      label: 'Date',
      width: '14%',
      render: (_, row) => <span className="text-xs text-muted-foreground">{new Date(row.assessment_date).toLocaleDateString()}</span>,
    },
    {
      key: 'bmi',
      label: 'BMI & Body Fat',
      width: '16%',
      render: (_, row) => (
        <div className="text-xs">
          <div className="font-semibold text-foreground">BMI: {row.bmi || 'N/A'}</div>
          <div className="text-muted-foreground">Body Fat: {row.body_fat_percentage || 0}%</div>
        </div>
      ),
    },
    {
      key: 'fitness_score',
      label: 'Fitness Score & Grade',
      width: '20%',
      render: (_, row) => {
        const score = Math.round(row.overall_fitness_score || 0);
        const grade = row.ai_analysis?.fitnessGrade || (score >= 80 ? 'A' : score >= 60 ? 'B' : 'C');
        return (
          <div className="flex items-center gap-2">
            <div className="text-base font-bold text-foreground">{score} <span className="text-xs text-muted-foreground">/ 100</span></div>
            <Badge variant={score >= 80 ? 'success' : score >= 65 ? 'info' : 'warning'}>
              Grade {grade}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'ai_insights',
      label: 'Readiness & Injury Risk',
      width: ['admin', 'coach'].includes(role) ? '16%' : '24%',
      render: (_, row) => {
        const ai = row.ai_analysis;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Risk:</span>
              <Badge variant={ai?.injuryRisk === 'High' ? 'danger' : ai?.injuryRisk === 'Medium' ? 'warning' : 'success'}>
                {ai?.injuryRisk || 'Low'} Risk
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground line-clamp-1">
              Readiness: {ai?.recoveryReadiness || 'Optimal'}
            </div>
          </div>
        );
      },
    },
    ...(['admin', 'coach'].includes(role)
      ? [
          {
            key: 'actions',
            label: 'Actions',
            width: '8%',
            render: (_, row) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/fitness/${row.id}/edit`); }}
                  title="Edit Assessment"
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }}
                  title="Delete Assessment"
                  className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fitness Assessment Module"
        subtitle="Evaluate 13 physical fitness parameters, real-time BMI, recovery readiness, and injury risk."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {role === 'admin' && (
              <Button variant="outline" size="sm" leftIcon={BarChart2} onClick={() => navigate('/fitness/analytics')}>
                Analytics
              </Button>
            )}
            {role !== 'athlete' && (
              <Button variant="outline" size="sm" leftIcon={FileText} onClick={() => navigate('/fitness/reports')}>
                Reports
              </Button>
            )}
            {(role === 'admin' || role === 'coach') && (
              <Button size="sm" leftIcon={Plus} onClick={() => navigate('/fitness/add')}>
                Add Assessment
              </Button>
            )}
          </div>
        }
      />

      {/* Fitness KPI Cards */}
      {analytics && role !== 'athlete' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground font-medium">Total Evaluations</div>
            <div className="mt-1 text-2xl font-extrabold text-foreground">{analytics.total_assessments || 0}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{analytics.total_athletes || 0} Athletes</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground font-medium">Avg Fitness Score</div>
            <div className="mt-1 text-2xl font-extrabold text-emerald-500">{Math.round(analytics.avg_fitness_score || 0)} / 100</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Academy Benchmark</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground font-medium">Average BMI</div>
            <div className="mt-1 text-2xl font-extrabold text-primary">{analytics.avg_bmi ? Math.round(analytics.avg_bmi * 10) / 10 : '22.5'}</div>
            <div className="mt-1 text-[11px] text-emerald-500 font-medium">Healthy Athletic Range</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground font-medium">Avg Strength Index</div>
            <div className="mt-1 text-2xl font-extrabold text-indigo-500">{Math.round(analytics.avg_strength || 70)} pts</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Resistance Score</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search fitness metrics..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {role !== 'athlete' && (
          <select
            value={athleteId}
            onChange={(e) => { setAthleteId(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-w-[180px]"
          >
            <option value="">All Athletes</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
            ))}
          </select>
        )}
          <Button variant="ghost" size="sm" leftIcon={RefreshCw} onClick={() => { setSearch(''); setSportId(''); setAthleteId(''); }}>
            Reset
          </Button>
      </div>

      <DataTable
        columns={columns}
        data={assessments}
        loading={loading}
        onRowClick={(row) => setSelectedAssessment(row)}
        emptyMessage="No fitness assessments found."
      />

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / limit) || 1}
        onPageChange={setPage}
        totalEntries={total}
        limit={limit}
        onLimitChange={setLimit}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Fitness Assessment"
        message={`Are you sure you want to delete the assessment for ${confirmDelete?.first_name}?`}
        confirmText="Delete Assessment"
        confirmVariant="danger"
        loading={actionLoading}
      />

      {/* Fitness Assessment Details Modal Portal */}
      {selectedAssessment &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 w-screen h-screen overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Full-viewport edge-to-edge backdrop */}
            <div
              className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedAssessment(null)}
              aria-hidden="true"
            />

            {/* Modal Dialog Box */}
            <div className="relative z-10 w-full max-w-lg my-auto animate-in fade-in zoom-in-95 duration-150 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl space-y-5 text-gray-900">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Fitness Assessment Details</h2>
                    <p className="text-xs text-gray-500">
                      {selectedAssessment.first_name} {selectedAssessment.last_name} · <span className="font-semibold text-gray-700">{selectedAssessment.athlete_code}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAssessment(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Core Score & Vitals Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Overall Fitness Score</div>
                  <div className="mt-1 text-base font-bold text-emerald-600 flex items-center gap-1.5">
                    {Math.round(selectedAssessment.overall_fitness_score || 0)} <span className="text-xs font-normal text-gray-400">/ 100</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5 font-medium">
                    Grade {selectedAssessment.overall_fitness_score >= 85 ? 'A (Excellent)' : selectedAssessment.overall_fitness_score >= 70 ? 'B (Good)' : 'C (Needs Work)'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Body Vitals</div>
                  <div className="mt-1 text-sm font-bold text-gray-900">
                    BMI: <span className="text-primary font-semibold">{selectedAssessment.bmi ? Number(selectedAssessment.bmi).toFixed(1) : '22.0'}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Body Fat: <span className="font-semibold text-gray-700">{selectedAssessment.body_fat_percentage ? `${selectedAssessment.body_fat_percentage}%` : 'N/A'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Date Assessed</div>
                  <div className="mt-1 text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <Calendar size={13} className="text-gray-400" />
                    {selectedAssessment.assessment_date ? new Date(selectedAssessment.assessment_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Injury & Recovery</div>
                  <div className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck size={13} /> {selectedAssessment.ai_analysis?.injuryRisk ? `Risk: ${selectedAssessment.ai_analysis.injuryRisk}` : 'Low Injury Risk'}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {selectedAssessment.ai_analysis?.recoveryReadiness ? `Recovery: ${selectedAssessment.ai_analysis.recoveryReadiness}` : 'Ready for high intensity'}
                  </div>
                </div>
              </div>

              {/* Key Physical Test Results if available */}
              {(selectedAssessment.cooper_test_distance || selectedAssessment.pushups_count || selectedAssessment.plank_seconds) && (
                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Physical Breakdown</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {selectedAssessment.cooper_test_distance && (
                      <div className="p-2 rounded-lg bg-white border border-gray-200">
                        <div className="text-[10px] text-gray-400">Cooper Run</div>
                        <div className="text-xs font-bold text-gray-800">{selectedAssessment.cooper_test_distance}m</div>
                      </div>
                    )}
                    {selectedAssessment.pushups_count && (
                      <div className="p-2 rounded-lg bg-white border border-gray-200">
                        <div className="text-[10px] text-gray-400">Pushups</div>
                        <div className="text-xs font-bold text-gray-800">{selectedAssessment.pushups_count} reps</div>
                      </div>
                    )}
                    {selectedAssessment.plank_seconds && (
                      <div className="p-2 rounded-lg bg-white border border-gray-200">
                        <div className="text-[10px] text-gray-400">Plank Time</div>
                        <div className="text-xs font-bold text-gray-800">{selectedAssessment.plank_seconds}s</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Coach Remarks Section */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <MessageSquare size={14} className="text-primary" /> Fitness Coach Remarks & Notes
                </div>
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 text-xs text-gray-800 leading-relaxed italic">
                  {selectedAssessment.notes?.trim() ? (
                    `"${selectedAssessment.notes.trim()}"`
                  ) : (
                    <span className="text-gray-400 not-italic">No coach remarks recorded for this fitness assessment.</span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedAssessment(null)}
                  className="border-gray-200 text-gray-700 hover:bg-gray-100"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default FitnessList;
