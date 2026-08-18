import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Download, Upload, Trash2, Eye, Pencil, TrendingUp, TrendingDown,
  BarChart2, ShieldAlert, Sparkles, Filter, RefreshCw, X, MessageSquare, Calendar, Activity, CheckCircle2
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

  // Row Details Modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Prevent background scroll when modal open
  useEffect(() => {
    if (selectedRecord) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = orig; };
    }
  }, [selectedRecord]);

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
      const recordList = res?.data?.data?.records || res?.data?.records || res?.records || (Array.isArray(res?.data) ? res.data : []);
      const totalCount = res?.data?.data?.pagination?.total ?? res?.data?.pagination?.total ?? res?.pagination?.total ?? recordList.length;
      setRecords(recordList);
      setTotal(totalCount);
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
      width: '26%',
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
      width: '20%',
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
      width: '14%',
      render: (_, row) => <span className="text-xs text-muted-foreground">{new Date(row.record_date).toLocaleDateString()}</span>,
    },
    {
      key: 'performance_score',
      label: 'AI Performance Score',
      width: '18%',
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
      label: 'AI Trend',
      width: ['admin', 'coach'].includes(role) ? '14%' : '22%',
      render: (_, row) => {
        const ai = row.ai_analysis;
        return (
          <Badge variant={ai?.isExceptional ? 'success' : ai?.isDeclining ? 'danger' : 'info'}>
            {ai?.trend || 'Stable'}
          </Badge>
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
                  onClick={(e) => { e.stopPropagation(); navigate(`/performance/${row.id}/edit`); }}
                  title="Edit Record"
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }}
                  title="Delete Record"
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
        title="Performance Monitoring"
        subtitle="Track sport-specific athlete metrics, AI trend predictions, and coach remarks."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Compare is available for coaches and admin */}
            {role !== 'athlete' && (
              <Button variant="outline" size="sm" leftIcon={Sparkles} onClick={() => navigate('/performance/compare')}>
                Compare
              </Button>
            )}

            {/* Admin-only tools: Analytics, Export, Import, Custom Metric */}
            {role === 'admin' && (
              <>
                <Button variant="outline" size="sm" leftIcon={BarChart2} onClick={() => navigate('/performance/analytics')}>
                  Analytics
                </Button>
                <Button variant="outline" size="sm" leftIcon={Download} onClick={handleExport}>
                  Export
                </Button>
                <Button variant="outline" size="sm" leftIcon={Upload} onClick={() => setImportModalOpen(true)}>
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCustomMetricModalOpen(true)}>
                  + Custom Metric
                </Button>
              </>
            )}

            {/* Add Performance for coach and admin */}
            {(role === 'admin' || role === 'coach') && (
              <Button size="sm" leftIcon={Plus} onClick={() => navigate('/performance/add')}>
                Add Performance
              </Button>
            )}
          </div>
        }
      />

      {/* Summary KPI Cards */}
      {analytics && role !== 'athlete' && (
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
              placeholder="Search metric name..."
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
          {role !== 'athlete' && (
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
          )}
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
          <Button variant="ghost" size="sm" leftIcon={RefreshCw} onClick={() => { setSearch(''); setSportId(''); setAthleteId(''); setDateFrom(''); setDateTo(''); }}>
            Reset
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        onRowClick={(row) => setSelectedRecord(row)}
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
              <Button size="sm" onClick={handleImportSubmit} loading={actionLoading}>Import</Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Metric Definition Modal */}
      {customMetricModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateMetric} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Define Custom Metric</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">Sport</label>
                <select
                  required
                  value={customMetricForm.sport_id}
                  onChange={(e) => setCustomMetricForm({ ...customMetricForm, sport_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Select Sport</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Metric Key (e.g. max_sprint_speed)</label>
                <input
                  type="text"
                  required
                  value={customMetricForm.metric_key}
                  onChange={(e) => setCustomMetricForm({ ...customMetricForm, metric_key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Metric Label (e.g. Max Sprint Speed)</label>
                <input
                  type="text"
                  required
                  value={customMetricForm.metric_label}
                  onChange={(e) => setCustomMetricForm({ ...customMetricForm, metric_label: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Unit (e.g. km/h, sec, reps)</label>
                <input
                  type="text"
                  value={customMetricForm.metric_unit}
                  onChange={(e) => setCustomMetricForm({ ...customMetricForm, metric_unit: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-xs text-foreground font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customMetricForm.is_higher_better}
                      onChange={(e) => setCustomMetricForm({ ...customMetricForm, is_higher_better: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    Higher is better
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setCustomMetricModalOpen(false)}>Cancel</Button>
              <Button size="sm" type="submit">Create Metric</Button>
            </div>
          </form>
        </div>
      )}

      {/* Performance Record Details Modal Portal */}
      {selectedRecord &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 w-screen h-screen overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Full-viewport edge-to-edge backdrop */}
            <div
              className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedRecord(null)}
              aria-hidden="true"
            />

            {/* Modal Dialog Box */}
            <div className="relative z-10 w-full max-w-lg my-auto animate-in fade-in zoom-in-95 duration-150 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl space-y-5 text-gray-900">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Performance Evaluation Details</h2>
                    <p className="text-xs text-gray-500">
                      {selectedRecord.first_name} {selectedRecord.last_name} · <span className="font-semibold text-gray-700">{selectedRecord.athlete_code}</span> ({selectedRecord.sport_name || 'Athletics'})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Evaluation Metric</div>
                  <div className="mt-1 text-base font-bold text-gray-900 capitalize">
                    {selectedRecord.metric_name?.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mt-0.5">
                    {selectedRecord.metric_value} {selectedRecord.metric_unit || ''}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Performance Score</div>
                  <div className="mt-1 text-base font-bold text-gray-900 flex items-center gap-1.5">
                    {selectedRecord.performance_score || 'N/A'} <span className="text-xs font-normal text-gray-400">/ 100</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    {Number(selectedRecord.improvement_rate) > 0 ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        <TrendingUp size={12} /> +{selectedRecord.improvement_rate}%
                      </span>
                    ) : Number(selectedRecord.improvement_rate) < 0 ? (
                      <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                        <TrendingDown size={12} /> {selectedRecord.improvement_rate}%
                      </span>
                    ) : (
                      <span className="text-gray-500 font-medium">Stable</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Date Recorded</div>
                  <div className="mt-1 text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <Calendar size={13} className="text-gray-400" />
                    {selectedRecord.record_date ? new Date(selectedRecord.record_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Session Context</div>
                  <div className="mt-1 text-sm font-semibold text-gray-800">
                    {selectedRecord.session_type || 'Training Evaluation'}
                  </div>
                </div>
              </div>

              {/* Coach Remarks Section */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <MessageSquare size={14} className="text-primary" /> Coach Remarks & Evaluation
                </div>
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 text-xs text-gray-800 leading-relaxed italic">
                  {selectedRecord.notes?.trim() ? (
                    `"${selectedRecord.notes.trim()}"`
                  ) : (
                    <span className="text-gray-400 not-italic">No coach remarks recorded for this evaluation.</span>
                  )}
                </div>
              </div>

              {/* AI Analysis / Insights */}
              {selectedRecord.ai_analysis && (
                <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                    <Sparkles size={13} /> AI Insights & Trend
                  </div>
                  <p className="text-xs text-purple-900 leading-relaxed">
                    {typeof selectedRecord.ai_analysis === 'string'
                      ? selectedRecord.ai_analysis
                      : selectedRecord.ai_analysis.reason || selectedRecord.ai_analysis.trend || 'Consistent trajectory observed across recent records.'}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedRecord(null)}
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

export default PerformanceList;
