// ─── pages/sports/SportsList.jsx ─────────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Trophy, Activity, Settings2, X, PlusCircle, Edit3, Gauge, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { sportService } from '../../services/sportService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const emptyMetric = () => ({
  id: Date.now() + Math.random(),
  metric_label: '',
  metric_unit: '',
  metric_type: 'number',
  is_higher_better: true,
});

const SportsList = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add / Edit Sport Modal State
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingSportId, setEditingSportId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [sportForm, setSportForm] = useState({
    name: '',
    description: '',
    icon: 'trophy',
    is_active: 1,
    metrics: [
      { id: 1, metric_label: 'Speed / Sprint Time', metric_unit: 'sec', metric_type: 'time', is_higher_better: false },
      { id: 2, metric_label: 'Endurance Score', metric_unit: 'points', metric_type: 'number', is_higher_better: true },
      { id: 3, metric_label: 'Technical Accuracy', metric_unit: '%', metric_type: 'percentage', is_higher_better: true },
    ],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sportService.listSports({ page, limit, search, ...filters });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Failed to load sports');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingSportId(null);
    setSportForm({
      name: '',
      description: '',
      icon: 'trophy',
      is_active: 1,
      metrics: [
        { id: 1, metric_label: 'Speed / Sprint Time', metric_unit: 'sec', metric_type: 'time', is_higher_better: false },
        { id: 2, metric_label: 'Endurance Score', metric_unit: 'points', metric_type: 'number', is_higher_better: true },
        { id: 3, metric_label: 'Technical Accuracy', metric_unit: '%', metric_type: 'percentage', is_higher_better: true },
      ],
    });
  };

  const openEditModal = async (sport) => {
    setModalMode('edit');
    setEditingSportId(sport.id);
    setSportForm({
      name: sport.name || '',
      description: sport.description || '',
      icon: sport.icon || 'trophy',
      is_active: sport.is_active ?? 1,
      metrics: [],
    });

    try {
      const res = await sportService.getMetrics(sport.id);
      const mList = res.data || [];
      if (mList.length > 0) {
        setSportForm((prev) => ({
          ...prev,
          metrics: mList.map((m, idx) => ({
            id: m.id || idx,
            metric_label: m.metric_label || m.label || '',
            metric_unit: m.metric_unit || m.unit || '',
            metric_type: m.metric_type || 'number',
            is_higher_better: m.is_higher_better !== 0 && m.is_higher_better !== false,
          })),
        }));
      } else {
        setSportForm((prev) => ({
          ...prev,
          metrics: [emptyMetric()],
        }));
      }
    } catch {
      setSportForm((prev) => ({ ...prev, metrics: [emptyMetric()] }));
    }
  };

  const handleAddMetricRow = () => {
    setSportForm((prev) => ({
      ...prev,
      metrics: [...prev.metrics, emptyMetric()],
    }));
  };

  const handleRemoveMetricRow = (idx) => {
    setSportForm((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== idx),
    }));
  };

  const handleMetricChange = (idx, field, value) => {
    setSportForm((prev) => {
      const nextMetrics = [...prev.metrics];
      nextMetrics[idx] = { ...nextMetrics[idx], [field]: value };
      return { ...prev, metrics: nextMetrics };
    });
  };

  const handleSaveSport = async (e) => {
    e.preventDefault();
    if (!sportForm.name.trim()) {
      toast.error('Sport name is required');
      return;
    }

    const cleanMetrics = (sportForm.metrics || [])
      .map((m, idx) => ({
        metric_label: m.metric_label.trim(),
        metric_unit: (m.metric_unit || '').trim() || null,
        metric_type: m.metric_type || 'number',
        is_higher_better: m.is_higher_better !== false,
        display_order: idx + 1,
      }))
      .filter((m) => m.metric_label.length > 0);

    setModalLoading(true);
    try {
      if (modalMode === 'add') {
        await sportService.createSport({
          name: sportForm.name.trim(),
          description: sportForm.description.trim() || null,
          icon: sportForm.icon,
          is_active: sportForm.is_active,
          metrics: cleanMetrics,
        });
        toast.success(`Sport "${sportForm.name}" created with ${cleanMetrics.length} metrics!`);
      } else {
        await sportService.updateSport(editingSportId, {
          name: sportForm.name.trim(),
          description: sportForm.description.trim() || null,
          icon: sportForm.icon,
          is_active: sportForm.is_active,
          metrics: cleanMetrics,
        });
        toast.success(`Sport "${sportForm.name}" updated successfully!`);
      }

      setModalMode(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || err?.data?.message || 'Failed to save sport');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await sportService.deleteSport(confirmDelete.id);
      toast.success('Sport deleted');
      setConfirmDelete(null);
      fetchData();
    } catch {
      toast.error('Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const COLUMNS = [
    {
      key: 'name',
      label: 'Sport',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-primary text-white shadow-sm">
            <Trophy size={16} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{v}</p>
            <p className="text-xs text-muted-foreground">{row.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    { key: 'athlete_count', label: 'Athletes', render: (v) => <Badge variant="primary">{v || 0}</Badge> },
    {
      key: 'metrics_count',
      label: 'Custom Metrics',
      render: (v, row) => (
        <button
          type="button"
          onClick={() => openEditModal(row)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-info/10 hover:bg-info/20 text-info text-xs font-semibold border border-info/20 transition-colors"
          title="Click to view and edit metrics"
        >
          <Gauge size={13} />
          {v || 0} metrics
        </button>
      ),
    },
    { key: 'is_active', label: 'Status', render: (v) => <Badge variant={v ? 'success' : 'secondary'}>{v ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="text-primary hover:bg-primary/10"
            title="Edit Sport & Metrics"
            onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
          >
            <Edit3 size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            title="Delete Sport"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in space-y-5">
      <PageHeader
        title="Sports Management"
        subtitle="Manage sports, customizable performance metrics (N metrics), and academy disciplines."
        breadcrumb="Configuration"
        actions={
          <Button size="sm" leftIcon={Plus} onClick={openAddModal}>
            Add Sport
          </Button>
        }
      />

      <div className="ui-card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search sports..."
        />
      </div>

      <DataTable columns={COLUMNS} data={data} loading={loading} emptyText="No sports found." />

      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      {/* Add / Edit Sport & Metrics Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {modalMode === 'add' ? 'Add New Sport & Metrics' : 'Edit Sport & Metrics'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Define sport profile and add N custom performance metrics with units.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveSport} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span>1. Sport Information</span>
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Sport Name <span className="text-destructive font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Basketball, Badminton, Archery, Boxing"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={sportForm.name}
                      onChange={(e) => setSportForm({ ...sportForm, name: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief description or rules of the sport..."
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={sportForm.description}
                      onChange={(e) => setSportForm({ ...sportForm, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Icon Type
                    </label>
                    <select
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
                      value={sportForm.icon}
                      onChange={(e) => setSportForm({ ...sportForm, icon: e.target.value })}
                    >
                      <option value="trophy">🏆 Trophy</option>
                      <option value="run">🏃 Running / Track</option>
                      <option value="waves">🏊 Swimming</option>
                      <option value="circle">⚽ Ball Sport</option>
                      <option value="target">🎯 Target</option>
                      <option value="zap">⚡ Racquet</option>
                      <option value="shield">🛡️ Combat / Martial</option>
                      <option value="star">⭐ Gymnastics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Status
                    </label>
                    <select
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
                      value={sportForm.is_active}
                      onChange={(e) => setSportForm({ ...sportForm, is_active: Number(e.target.value) })}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic N Metrics Section */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Gauge size={15} />
                      <span>2. Custom Performance Metrics ({sportForm.metrics.length})</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Add any number of measurable performance indicators and their measurement units.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={PlusCircle}
                    onClick={handleAddMetricRow}
                  >
                    Add Metric
                  </Button>
                </div>

                {sportForm.metrics.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground space-y-2">
                    <p>No custom metrics added yet.</p>
                    <Button type="button" size="sm" variant="outline" leftIcon={Plus} onClick={handleAddMetricRow}>
                      Add First Metric
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sportForm.metrics.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-3 rounded-xl border border-border bg-background/60 hover:bg-background transition-all"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-[11px] font-bold text-muted-foreground">
                          {idx + 1}
                        </span>

                        {/* Metric Name */}
                        <div className="flex-1 min-w-[140px]">
                          <input
                            type="text"
                            placeholder="Metric Name (e.g. 100m Sprint)"
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                            value={m.metric_label}
                            onChange={(e) => handleMetricChange(idx, 'metric_label', e.target.value)}
                          />
                        </div>

                        {/* Metric Unit */}
                        <div className="w-24 shrink-0">
                          <input
                            type="text"
                            placeholder="Unit (e.g. sec, cm, %)"
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                            value={m.metric_unit}
                            onChange={(e) => handleMetricChange(idx, 'metric_unit', e.target.value)}
                          />
                        </div>

                        {/* Metric Type */}
                        <div className="w-28 shrink-0">
                          <select
                            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary"
                            value={m.metric_type}
                            onChange={(e) => handleMetricChange(idx, 'metric_type', e.target.value)}
                          >
                            <option value="number">Number</option>
                            <option value="time">Time</option>
                            <option value="percentage">Percent (%)</option>
                            <option value="text">Text</option>
                          </select>
                        </div>

                        {/* Higher is Better Toggle */}
                        <button
                          type="button"
                          onClick={() => handleMetricChange(idx, 'is_higher_better', !m.is_higher_better)}
                          className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                            m.is_higher_better
                              ? 'bg-success/10 text-success border-success/30'
                              : 'bg-warning/10 text-warning border-warning/30'
                          }`}
                          title={m.is_higher_better ? 'Higher score is better' : 'Lower time/score is better'}
                        >
                          {m.is_higher_better ? (
                            <>
                              <ArrowUp size={12} /> Higher ↑
                            </>
                          ) : (
                            <>
                              <ArrowDown size={12} /> Lower ↓
                            </>
                          )}
                        </button>

                        {/* Delete Row Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveMetricRow(idx)}
                          className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Remove metric"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-4">
                <Button type="button" variant="ghost" onClick={() => setModalMode(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={modalLoading}>
                  {modalMode === 'add' ? 'Create Sport & Save Metrics' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Sport"
        message={`Delete sport "${confirmDelete?.name}"? All related categories and records will be affected.`}
        confirmText="Delete"
      />
    </div>
  );
};

export default SportsList;
