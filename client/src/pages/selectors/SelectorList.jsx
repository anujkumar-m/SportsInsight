// ─── pages/selectors/SelectorList.jsx ──────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectorService } from '../../services/selectorService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const SelectorList = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState('ASC');

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await selectorService.list({ page, limit, search, sort_dir: sortDir });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Failed to load selectors');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await selectorService.remove(confirmDelete.id);
      toast.success('Selector deleted');
      setConfirmDelete(null);
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setActionLoading(false); }
  };

  const COLUMNS = [
    { key: 'selector_code', label: 'ID', render: (v) => <span className="font-mono text-xs text-primary">{v}</span> },
    {
      key: 'full_name', label: 'Selector', sortable: true,
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
    { key: 'designation', label: 'Designation', render: (v) => v || '—' },
    { key: 'organization', label: 'Organization', render: (v) => v || '—' },
    { key: 'sport_expertise', label: 'Expertise', render: (v) => v || '—' },
    { key: 'total_selections', label: 'Selections', render: (v) => <Badge variant="primary">{v || 0}</Badge> },
    { key: 'is_active', label: 'Status', render: (v) => <Badge variant={v ? 'success' : 'secondary'}>{v ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/selectors/${row.id}`); }}><Eye size={14}/></Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/selectors/${row.id}/edit`); }}><Pencil size={14}/></Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }}><Trash2 size={14}/></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in space-y-5">
      <PageHeader
        title="Selectors"
        subtitle="Manage academy selectors and their sports assignments."
        breadcrumb="Management"
        actions={
          <Button size="sm" leftIcon={Plus} onClick={() => navigate('/selectors/add')}>
            Add Selector
          </Button>
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
        sortBy="full_name"
        sortDir={sortDir}
        onSort={() => { setSortDir((d) => (d === 'ASC' ? 'DESC' : 'ASC')); }}
        emptyText="No selectors found."
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
        title="Delete Selector"
        message={`Delete selector "${confirmDelete?.full_name}"?`}
        confirmText="Delete"
      />
    </div>
  );
};

export default SelectorList;
