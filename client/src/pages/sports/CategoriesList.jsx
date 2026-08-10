// ─── pages/sports/CategoriesList.jsx ─────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { sportService } from '../../services/sportService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const CategoriesList = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sports, setSports] = useState([]);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    sportService.listSports({ limit: 100 }).then((r) => setSports(r.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sportService.listCategories({ page, limit, search, ...filters });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await sportService.deleteCategory(confirmDelete.id);
      toast.success('Category deleted');
      setConfirmDelete(null);
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setActionLoading(false); }
  };

  const COLUMNS = [
    {
      key: 'name', label: 'Category',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground shadow-sm">
            <Tag size={14} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{v}</p>
            <p className="text-xs text-muted-foreground">Ages: {row.age_min || 0} - {row.age_max || 'No limit'}</p>
          </div>
        </div>
      )
    },
    { key: 'sport_name', label: 'Sport', render: (v) => v || '—' },
    { key: 'gender', label: 'Gender', render: (v) => <span className="capitalize">{v}</span> },
    { key: 'athlete_count', label: 'Athletes', render: (v) => <Badge variant="primary">{v || 0}</Badge> },
    { key: 'is_active', label: 'Status', render: (v) => <Badge variant={v ? 'success' : 'secondary'}>{v ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          {/* <Button size="sm" variant="ghost"><Pencil size={14}/></Button> */}
          <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }}><Trash2 size={14}/></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in space-y-5">
      <PageHeader
        title="Categories Management"
        subtitle="Manage age, gender and weight categories for all sports."
        breadcrumb="Configuration"
        actions={
          <Button size="sm" leftIcon={Plus}>
            Add Category
          </Button>
        }
      />

      <div className="ui-card p-4">
        <SearchFilterBar
          search={search}
          onSearch={(val) => { setSearch(val); setPage(1); }}
          placeholder="Search categories..."
          filters={[
            {
              key: 'sport_id', label: 'Filter by Sport', type: 'select',
              options: sports.map((s) => ({ value: s.id, label: s.name })),
            }
          ]}
          filterValues={filters}
          onFilterChange={(key, val) => { setFilters({ ...filters, [key]: val || undefined }); setPage(1); }}
          onClearFilters={() => { setFilters({}); setSearch(''); setPage(1); }}
        />
      </div>

      <DataTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        emptyText="No categories found."
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
        title="Delete Category"
        message={`Delete category "${confirmDelete?.name}"?`}
        confirmText="Delete"
      />
    </div>
  );
};

export default CategoriesList;
