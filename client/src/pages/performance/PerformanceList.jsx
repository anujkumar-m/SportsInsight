import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Download, Upload, Trash2, Eye, Pencil, TrendingUp, TrendingDown,
  BarChart2, ShieldAlert, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { performanceService } from '../../services/performanceService';
import { athleteService } from '../../services/athleteService';
import { sportService } from '../../services/sportService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const PerformanceList = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [sportId, setSportId] = useState('');
  const [sports, setSports] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [athleteId, setAthleteId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals & Actions
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [customMetricModalOpen, setCustomMetricModalOpen] = useState(false);
  const [customMetricForm, setCustomMetricForm] = useState({
    sport_id: '',
    metric_key: '',
    metric_label: '',
    metric_unit: '',
    metric_type: 'number',
    is_higher_better: true,
  });

  // Summary Analytics
  const [analytics, setAnalytics] = useState(null);

  const fetchSportsAndAthletes = async () => {
    try {
      const sportsRes = await sportService.listSports();
      setSports(sportsRes.data || []);
      const athRes = await athleteService.getAthletes({ limit: 100 });
      setAthletes(athRes.data?.athletes || athRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await performanceService.getRecords({
        page,
        limit,
        search,
        sportId: sportId || undefined,
        athleteId: athleteId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setRecords(res.data.records);
      setTotal(res.data.pagination.total);
    } catch (e) {
      toast.error(e.message || 'Failed to load performance records.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sportId, athleteId, dateFrom, dateTo]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await performanceService.getAnalytics();
      setAnalytics(res.data.summary);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchSportsAndAthletes();
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await performanceService.delete(confirmDelete.id);
      toast.success('Performance record deleted.');
      setConfirmDelete(null);
      fetchRecords();
      fetchAnalytics();
    } catch (e) {
      toast.error(e.message || 'Failed to delete record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await performanceService.exportRecords({ sportId, athleteId, dateFrom, dateTo });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance_records_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success('Performance records exported.');
    } catch (e) {
      toast.error('Export failed.');
    }
  };

  const handleImportSubmit = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const res = await performanceService.importRecords(parsed);
      toast.success(res.message || 'Records imported successfully.');
      setImportModalOpen(false);
      setImportJsonText('');
      fetchRecords();
      fetchAnalytics();
    } catch (e) {
      toast.error('Invalid JSON format or import failed: ' + e.message);
    }
  };

  const handleCreateCustomMetric = async (e) => {
    e.preventDefault();
    try {
      await performanceService.createCustomMetric(customMetricForm);
      toast.success('Custom sport metric created successfully!');
      setCustomMetricModalOpen(false);
      setCustomMetricForm({
        sport_id: '',
        metric_key: '',
        metric_label: '',
        metric_unit: '',
        metric_type: 'number',
        is_higher_better: true,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to create metric.');
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
            <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
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
      key: 'metric_name',
      label: 'Metric & Value',
      render: (_, row) => (
        <div>
          <div className="font-medium text-foreground text-sm">{row.metric_name}</div>
          <div className="text-xs font-semibold text-primary">
            {row.metric_value} {row.metric_unit}
          </div>
        </div>
      ),
    },
    {
      key: 'record_date',
      label: 'Record Date',
      render: (_, row) => <span className="text-xs text-muted-foreground">{new Date(row.record_date).toLocaleDateString()}</span>,
    },
    {
      key: 'performance_score',
      label: 'AI Performance Score',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="text-base font-bold text-foreground">{row.performance_score ?? 75}</div>
          <div className="flex flex-col text-[10px]">
            {row.improvement_rate > 0 ? (
              <span className="flex items-center gap-0.5 text-emerald-500 font-semibold">
                <TrendingUp size={11} /> +{row.improvement_rate}%
              </span>
            ) : row.improvement_rate < 0 ? (
              <span className="flex items-center gap-0.5 text-rose-500 font-semibold">
                <TrendingDown size={11} /> {row.improvement_rate}%
              </span>
            ) : (
              <span className="text-muted-foreground">Stable</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'ai_insights',
      label: 'AI Trend / Insights',
      render: (_, row) => {
        const ai = row.ai_analysis;
        return (
          <div className="space-y-1 max-w-xs">
            <div className="flex items-center gap-1.5">
              <Badge variant={ai?.isExceptional ? 'success' : ai?.isDeclining ? 'danger' : 'info'}>
                {ai?.trend || 'Stable'}
              </Badge>
              {ai?.isDeclining && (
                <span className="flex items-center gap-1 text-[11px] text-destructive font-medium">
                  <ShieldAlert size={12} /> Decline
                </span>
              )}
            </div>
            {ai?.reason && <p className="text-[11px] text-muted-foreground line-clamp-1">{ai.reason}</p>}
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
            onClick={() => navigate(`/performance/history/${row.athlete_id}`)}
            title="View Athlete History"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Eye size={15} />
          </button>
          {(role === 'admin' || role === 'coach') && (
            <>
              <button
                onClick={() => navigate(`/performance/${row.id}/edit`)}
                title="Edit Record"
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => setConfirmDelete(row)}
                title="Delete Record"
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
        title="Performance Monitoring"
        subtitle="Track sport-specific athlete metrics, AI trend predictions, and coach remarks."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/performance/analytics')}>
              <BarChart2 size={14} className="mr-1.5" /> Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/performance/compare')}>
              <Sparkles size={14} className="mr-1.5" /> Compare
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={14} className="mr-1.5" /> Export
            </Button>
            {(role === 'admin' || role === 'coach') && (
              <>
                <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
                  <Upload size={14} className="mr-1.5" /> Import
                </Button>
                {role === 'admin' && (
                  <Button variant="outline" size="sm" onClick={() => setCustomMetricModalOpen(true)}>
                    + Custom Metric
                  </Button>
                )}
                <Button size="sm" onClick={() => navigate('/performance/add')}>
                  <Plus size={14} className="mr-1.5" /> Add Performance
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Summary KPI Cards */}
      {analytics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground font-medium">Total Performance Logs</div>
            <div className="mt-1 text-2xl font-extrabold text-foreground">{analytics.total_records || 0}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{analytics.total_athletes || 0} Athletes Tracked</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground font-medium">Average Academy Score</div>
            <div className="mt-1 text-2xl font-extrabold text-primary">{Math.round(analytics.avg_score || 75)} / 100</div>
            <div className="mt-1 text-[11px] text-emerald-500 font-medium">Top Score: {analytics.top_score || 100}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground font-medium">Improving Athletes</div>
            <div className="mt-1 text-2xl font-extrabold text-emerald-500">{analytics.total_improved || 0}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Positive trajectory</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground font-medium">Declining / Risk Flagged</div>
            <div className="mt-1 text-2xl font-extrabold text-rose-500">{analytics.total_declining || 0}</div>
            <div className="mt-1 text-[11px] text-rose-400">Needs intervention</div>
          </div>
        </div>
      )}

      {/* Search & Advanced Filters Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search athlete, metric name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={sportId}
            onChange={(e) => { setSportId(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Sports</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={athleteId}
            onChange={(e) => { setAthleteId(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-w-[160px]"
          >
            <option value="">All Athletes</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
          />
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSportId(''); setAthleteId(''); setDateFrom(''); setDateTo(''); }}>
            <RefreshCw size={13} className="mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        emptyMessage="No performance records found."
      />

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / limit) || 1}
        onPageChange={setPage}
        totalEntries={total}
        limit={limit}
        onLimitChange={setLimit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Performance Record"
        message={`Are you sure you want to delete the record for ${confirmDelete?.first_name} (${confirmDelete?.metric_name})?`}
        confirmText="Delete Record"
        confirmVariant="danger"
        loading={actionLoading}
      />

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Import Performance Records (JSON)</h3>
            <p className="text-xs text-muted-foreground">Paste JSON array containing athlete_id, sport_id, record_date, metric_name, metric_value.</p>
            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='[{"athlete_id": 1, "sport_id": 1, "record_date": "2026-08-01", "metric_name": "goals", "metric_value": 3}]'
              className="w-full rounded-lg border border-border bg-background p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setImportModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleImportSubmit}>Submit Import</Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Sport Metric Modal */}
      {customMetricModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateCustomMetric} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Create Custom Sport Metric</h3>
            <div>
              <label className="text-xs font-medium text-foreground">Sport</label>
              <select
                required
                value={customMetricForm.sport_id}
                onChange={(e) => setCustomMetricForm({ ...customMetricForm, sport_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select Sport</option>
                {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Metric Label</label>
              <input
                type="text"
                required
                placeholder="e.g. Free Throw Accuracy"
                value={customMetricForm.metric_label}
                onChange={(e) => setCustomMetricForm({
                  ...customMetricForm,
                  metric_label: e.target.value,
                  metric_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground">Unit</label>
                <input
                  type="text"
                  placeholder="e.g. %, sec, pts"
                  value={customMetricForm.metric_unit}
                  onChange={(e) => setCustomMetricForm({ ...customMetricForm, metric_unit: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Type</label>
                <select
                  value={customMetricForm.metric_type}
                  onChange={(e) => setCustomMetricForm({ ...customMetricForm, metric_type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="number">Number</option>
                  <option value="percentage">Percentage</option>
                  <option value="time">Time</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="higherBetter"
                checked={customMetricForm.is_higher_better}
                onChange={(e) => setCustomMetricForm({ ...customMetricForm, is_higher_better: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="higherBetter" className="text-xs text-foreground font-medium">Higher value is better</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setCustomMetricModalOpen(false)}>Cancel</Button>
              <Button size="sm" type="submit">Create Metric</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PerformanceList;
