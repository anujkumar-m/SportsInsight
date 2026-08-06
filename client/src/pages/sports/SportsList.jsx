// ─── pages/sports/SportsList.jsx ─────────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Trophy, Activity, Settings2 } from 'lucide-react';
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await sportService.deleteSport(confirmDelete.id);
      toast.success('Sport deleted');
      setConfirmDelete(null);
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setActionLoading(false); }
  };

  const COLUMNS = [
    {
      key: 'name', label: 'Sport',
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
      )
    },
    { key: 'athlete_count', label: 'Athletes', render: (v) => <Badge variant="primary">{v || 0}</Badge> },
    { key: 'metrics_count', label: 'Custom Metrics', render: (v) => <Badge variant="info">{v || 0} metrics</Badge> },
    { key: 'is_active', label: 'Status', render: (v) => <Badge variant={v ? 'success' : 'secondary'}>{v ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          {/* <Button size="sm" variant="ghost"><Settings2 size={14}/></Button> */}
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(row)}><Trash2 size={14}/></Button>
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
          <Button size="sm" leftIcon={Plus}>
            Add Sport
          </Button>
        }
      />

      <div className="ui-card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(val) => { setSearch(val); setPage(1); }}
          placeholder="Search sports..."
        />
      </div>

      <DataTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        emptyText="No sports found."
      />

      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

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
