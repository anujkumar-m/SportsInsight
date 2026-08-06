// ─── pages/athletes/ArchivedAthletes.jsx ───────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCcw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const ArchivedAthletes = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  const [confirmRestore, setConfirmRestore] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await athleteService.listArchived({ page, limit });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Failed to load archived athletes');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      await athleteService.restore(confirmRestore.id);
      toast.success('Athlete restored successfully');
      setConfirmRestore(null);
      fetchData();
    } catch { toast.error('Failed to restore athlete'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await athleteService.remove(confirmDelete.id);
      toast.success('Athlete deleted permanently');
      setConfirmDelete(null);
      fetchData();
    } catch { toast.error('Failed to delete athlete'); }
    finally { setActionLoading(false); }
  };

  const COLUMNS = [
    { key: 'athlete_code', label: 'ID', render: (v) => <span className="font-mono text-xs text-primary">{v}</span> },
    { key: 'full_name', label: 'Name' },
    { key: 'sport_name', label: 'Sport', render: (v) => v || '—' },
    { key: 'archived_at', label: 'Archived On', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" leftIcon={RefreshCcw} onClick={() => setConfirmRestore(row)}>
            Restore
          </Button>
          <Button size="sm" variant="danger" leftIcon={Trash2} onClick={() => setConfirmDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in space-y-5">
      <PageHeader
        title="Archived Athletes"
        subtitle="Manage inactive or past athlete records."
        breadcrumb="Athletes"
        actions={
          <Button variant="outline" size="sm" leftIcon={ChevronLeft} onClick={() => navigate('/athletes')}>
            Back to Athletes
          </Button>
        }
      />

      <DataTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        emptyText="No archived athletes found."
      />

      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

      <ConfirmDialog
        open={!!confirmRestore}
        onClose={() => setConfirmRestore(null)}
        onConfirm={handleRestore}
        loading={actionLoading}
        title="Restore Athlete"
        message={`Are you sure you want to restore "${confirmRestore?.full_name}" to active status?`}
        confirmText="Restore"
        variant="primary"
      />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Athlete Permanently"
        message={`Permanently delete "${confirmDelete?.full_name}"? This action cannot be undone and all associated records will be lost.`}
        confirmText="Permanently Delete"
      />
    </div>
  );
};

export default ArchivedAthletes;
