import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Activity, Heart, Zap, Award, BarChart2, FileText, RefreshCw } from 'lucide-react';
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
      setAssessments(res.data.assessments);
      setTotal(res.data.pagination.total);
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
      render: (_, row) => <span className="text-xs text-muted-foreground">{new Date(row.assessment_date).toLocaleDateString()}</span>,
    },
    {
      key: 'bmi',
      label: 'BMI & Body Fat',
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
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/fitness/history/${row.athlete_id}`); }}
            title="View Fitness History"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Eye size={15} />
          </button>
          {(role === 'admin' || role === 'coach') && (
            <>
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
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fitness Assessment Module"
        subtitle="Evaluate 13 physical fitness parameters, real-time BMI, recovery readiness, and injury risk."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/fitness/analytics')}>
              <BarChart2 size={14} className="mr-1.5" /> Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/fitness/reports')}>
              <FileText size={14} className="mr-1.5" /> Reports
            </Button>
            {(role === 'admin' || role === 'coach') && (
              <Button size="sm" onClick={() => navigate('/fitness/add')}>
                <Plus size={14} className="mr-1.5" /> Add Assessment
              </Button>
            )}
          </div>
        }
      />

      {/* Fitness KPI Cards */}
      {analytics && (
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
            placeholder="Search athlete code, name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
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
        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setAthleteId(''); }}>
          <RefreshCw size={13} className="mr-1" /> Reset
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={assessments}
        loading={loading}
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
    </div>
  );
};

export default FitnessList;
