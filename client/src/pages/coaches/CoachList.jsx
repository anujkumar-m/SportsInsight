// ─── pages/coaches/CoachList.jsx ─────────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Shield, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { coachService } from '../../services/coachService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const CoachList = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('u.first_name');
  const [sortDir, setSortDir] = useState('ASC');

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await coachService.list({ page, limit, search, sort_by: sortBy, sort_dir: sortDir });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Failed to load coaches');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await coachService.remove(confirmDelete.id);
      toast.success('Coach deleted');
      setConfirmDelete(null);
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setActionLoading(false); }
  };

  const COLUMNS = [
    { key: 'coach_code', label: 'ID', render: (v) => <span className="font-mono text-xs text-primary">{v}</span> },
    {
      key: 'full_name', label: 'Coach', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-navy text-xs font-bold text-white">
            {v?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-foreground">{v}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      )
    },
    { key: 'sport_name', label: 'Sport', render: (v) => v || '—' },
    { key: 'specialization', label: 'Specialization', render: (v) => v || '—' },
    { key: 'athlete_count', label: 'Athletes', render: (v) => <Badge variant="primary">{v || 0}</Badge> },
    { key: 'current_status', label: 'Status', render: (v) => <Badge variant={v === 'active' ? 'success' : 'secondary'}>{v}</Badge> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => navigate(`/coaches/${row.id}`)}><Eye size={14}/></Button>
          {role === 'admin' && (
            <>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/coaches/${row.id}/edit`)}><Pencil size={14}/></Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(row)}><Trash2 size={14}/></Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in space-y-5">
      <PageHeader
        title="Coaches"
        subtitle="Manage academy coaches, assignments and performance."
        breadcrumb="Management"
        actions={
          role === 'admin' && (
            <Button size="sm" leftIcon={Plus} onClick={() => navigate('/coaches/add')}>
              Add Coach
            </Button>
          )
        }
      />

      <div className="ui-card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(val) => { setSearch(val); setPage(1); }}
          placeholder="Search by name, ID or email…"
        />
      </div>

      <DataTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={(key) => {
          setSortDir((d) => (sortBy === key ? (d === 'ASC' ? 'DESC' : 'ASC') : 'ASC'));
          setSortBy(key);
        }}
        emptyText="No coaches found."
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
        title="Delete Coach"
        message={`Delete coach "${confirmDelete?.full_name}"?`}
        confirmText="Delete"
      />
    </div>
  );
};

export default CoachList;
