// ─── pages/sports/SportsList.jsx ─────────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Trophy, Activity, Settings2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { sportService } from '../../services/sportService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

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

  // Add Sport Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    icon: 'trophy',
    is_active: 1,
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

  const handleCreateSport = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast.error('Sport name is required');
      return;
    }
    setAddLoading(true);
    try {
      await sportService.createSport({
        name: addForm.name.trim(),
        description: addForm.description.trim() || null,
        icon: addForm.icon,
        is_active: addForm.is_active,
      });
      toast.success('Sport created successfully!');
      setIsAddOpen(false);
      setAddForm({ name: '', description: '', icon: 'trophy', is_active: 1 });
      fetchData();
    } catch (err) {
      toast.error(err?.message || err?.data?.message || 'Failed to create sport');
    } finally {
      setAddLoading(false);
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
    { key: 'metrics_count', label: 'Custom Metrics', render: (v) => <Badge variant="info">{v || 0} metrics</Badge> },
    { key: 'is_active', label: 'Status', render: (v) => <Badge variant={v ? 'success' : 'secondary'}>{v ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }}>
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
        subtitle="Manage sports, performance metrics, and academy disciplines."
        breadcrumb="Configuration"
        actions={
          <Button size="sm" leftIcon={Plus} onClick={() => setIsAddOpen(true)}>
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

      {/* Add Sport Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Trophy size={18} />
                </div>
                <h3 className="text-base font-bold text-foreground">Add New Sport</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Sport Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basketball, Archery, Hockey"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the sport..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Icon Type
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
                    value={addForm.icon}
                    onChange={(e) => setAddForm({ ...addForm, icon: e.target.value })}
                  >
                    <option value="trophy">Trophy</option>
                    <option value="run">Running</option>
                    <option value="waves">Swimming</option>
                    <option value="circle">Ball Sport</option>
                    <option value="target">Target</option>
                    <option value="zap">Racquet</option>
                    <option value="shield">Combat</option>
                    <option value="star">Gymnastics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Status
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
                    value={addForm.is_active}
                    onChange={(e) => setAddForm({ ...addForm, is_active: Number(e.target.value) })}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-4">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={addLoading}>
                  Create Sport
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
