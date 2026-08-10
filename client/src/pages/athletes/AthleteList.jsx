// ─── pages/athletes/AthleteList.jsx ──────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Download, Upload, Trash2, Archive, RefreshCw,
  Sparkles, Eye, Pencil, MoreVertical, UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import { sportService } from '../../services/sportService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AiAthleteListModal from './AiAthleteListModal';

// ─── Status Badge Helper ─────────────────────────────────
const MedicalBadge = ({ status }) => {
  const map = {
    fit: 'success',
    unfit: 'danger',
    injured: 'warning',
    under_observation: 'info',
  };
  return <Badge variant={map[status] || 'secondary'}>{status?.replace('_', ' ')}</Badge>;
};

const StatusBadge = ({ status }) => {
  const map = { active: 'success', inactive: 'secondary', archived: 'warning', transferred: 'info' };
  return <Badge variant={map[status] || 'secondary'}>{status}</Badge>;
};

// ─── Row Action Menu ─────────────────────────────────────
const RowActions = ({ athlete, onView, onEdit, onArchive, onDelete, role }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 top-8 z-40 min-w-[160px] rounded-xl border border-border bg-card p-1.5 shadow-xl">
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onView(athlete); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-secondary">
              <Eye size={13} /> View Profile
            </button>
            {(role === 'admin' || role === 'coach') && (
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(athlete); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-secondary">
                <Pencil size={13} /> Edit
              </button>
            )}
            {role === 'admin' && athlete.current_status !== 'archived' && (
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); onArchive(athlete); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-warning hover:bg-warning/10">
                <Archive size={13} /> Archive
              </button>
            )}
            {role === 'admin' && (
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(athlete); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10">
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────
const AthleteList = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('u.first_name');
  const [sortDir, setSortDir] = useState('ASC');
  const [selected, setSelected] = useState([]);
  const [sports, setSports] = useState([]);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [aiModalOpen, setAiModalOpen] = useState(false);

  // fetch athletes
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await athleteService.list({
        page, limit, search, sort_by: sortBy, sort_dir: sortDir, ...filters,
      });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Failed to load athletes');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortDir, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // fetch sports for filter
  useEffect(() => {
    sportService.listSports({ limit: 100 }).then((r) => setSports(r.data || [])).catch(() => {});
  }, []);

  const handleSort = (key) => {
    setSortDir((d) => (sortBy === key ? (d === 'ASC' ? 'DESC' : 'ASC') : 'ASC'));
    setSortBy(key);
  };

  const handleFilterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val || undefined }));
    setPage(1);
  };

  const handleSearchChange = (val) => { setSearch(val); setPage(1); };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await athleteService.remove(confirmDelete.id);
      toast.success('Athlete deleted');
      setConfirmDelete(null);
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setActionLoading(false); }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      await athleteService.archive(confirmArchive.id);
      toast.success('Athlete archived');
      setConfirmArchive(null);
      fetchData();
    } catch { toast.error('Archive failed'); }
    finally { setActionLoading(false); }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      await athleteService.bulkDelete(selected);
      toast.success(`${selected.length} athletes deleted`);
      setSelected([]);
      setConfirmBulkDelete(false);
      fetchData();
    } catch { toast.error('Bulk delete failed'); }
    finally { setActionLoading(false); }
  };

  const handleExport = async () => {
    try {
      toast.loading('Preparing export…');
      const res = await athleteService.exportData(filters);
      const csv = [
        Object.keys(res.data[0] || {}).join(','),
        ...(res.data || []).map((r) => Object.values(r).map((v) => `"${v ?? ''}"`).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'athletes.csv'; a.click();
      toast.dismiss();
      toast.success('Export ready');
    } catch { toast.error('Export failed'); }
  };

  const COLUMNS = [
    {
      key: 'athlete_code', label: 'ID', sortable: true, width: '120px',
      render: (v) => <span className="font-mono text-xs font-semibold text-primary">{v}</span>,
    },
    {
      key: 'full_name', label: 'Athlete', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">
            {v?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-foreground">{v}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'sport_name', label: 'Sport', render: (v) => v || '—' },
    { key: 'category_name', label: 'Category', render: (v) => v || '—' },
    { key: 'gender', label: 'Gender', render: (v) => <span className="capitalize">{v}</span> },
    { key: 'age', label: 'Age', render: (v) => v ? `${v} yr` : '—' },
    { key: 'coach_name', label: 'Coach', render: (v) => v || <span className="text-muted-foreground">Unassigned</span> },
    { key: 'medical_status', label: 'Medical', render: (v) => <MedicalBadge status={v} /> },
    { key: 'current_status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <RowActions
          athlete={row}
          role={role}
          onView={(a) => navigate(`/athletes/${a.id}`)}
          onEdit={(a) => navigate(`/athletes/${a.id}/edit`)}
          onArchive={(a) => setConfirmArchive(a)}
          onDelete={(a) => setConfirmDelete(a)}
        />
      ),
    },
  ];

  const filterDefs = [
    {
      key: 'sport_id', label: 'Sport', type: 'select',
      options: sports.map((s) => ({ value: s.id, label: s.name })),
    },
    {
      key: 'gender', label: 'Gender', type: 'select',
      options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }],
    },
    {
      key: 'medical_status', label: 'Medical', type: 'select',
      options: [
        { value: 'fit', label: 'Fit' }, { value: 'unfit', label: 'Unfit' },
        { value: 'injured', label: 'Injured' }, { value: 'under_observation', label: 'Under Observation' },
      ],
    },
  ];

  return (
    <div className="fade-in space-y-5">
      <PageHeader
        title="Athletes"
        subtitle="Manage athlete profiles, sports assignments, and lifecycle."
        breadcrumb="Management"
        actions={
          <>
            {role === 'admin' && (
              <>
                <Button variant="outline" size="sm" leftIcon={Upload} onClick={() => navigate('/athletes/import')}>
                  Import
                </Button>
                <Button variant="outline" size="sm" leftIcon={Download} onClick={handleExport}>
                  Export
                </Button>
                <Button size="sm" leftIcon={Plus} onClick={() => navigate('/athletes/add')}>
                  Add Athlete
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="accent"
              leftIcon={Sparkles}
              onClick={() => setAiModalOpen(true)}
            >
              AI Generate List
            </Button>
          </>
        }
      />

      {/* Search + Filters */}
      <div className="ui-card p-4 space-y-3">
        <SearchFilterBar
          search={search}
          onSearch={handleSearchChange}
          filters={filterDefs}
          filterValues={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={() => { setFilters({}); setSearch(''); }}
          placeholder="Search by name, ID or email…"
          rightSlot={
            role === 'admin' && (
              <button
                type="button"
                onClick={() => navigate('/athletes/archived')}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Archive size={13} /> Archived
              </button>
            )
          }
        />

        {/* Bulk Action Bar */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
            <UserCheck size={15} className="text-primary" />
            <span className="font-medium text-primary">{selected.length} selected</span>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelected([])}>Deselect</Button>
              {role === 'admin' && (
                <Button size="sm" variant="danger" leftIcon={Trash2} onClick={() => setConfirmBulkDelete(true)}>
                  Delete Selected
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        selectable={role === 'admin'}
        selectedIds={selected}
        onSelectionChange={setSelected}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        onRowClick={(row) => navigate(`/athletes/${row.id}`)}
        emptyText="No athletes found. Add your first athlete to get started."
      />

      {/* Pagination */}
      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Athlete"
        message={`Are you sure you want to permanently delete "${confirmDelete?.full_name}"? This cannot be undone.`}
        confirmText="Delete"
      />
      <ConfirmDialog
        open={!!confirmArchive}
        onClose={() => setConfirmArchive(null)}
        onConfirm={handleArchive}
        loading={actionLoading}
        variant="outline"
        title="Archive Athlete"
        message={`Archive "${confirmArchive?.full_name}"? You can restore them later.`}
        confirmText="Archive"
      />
      <ConfirmDialog
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
        loading={actionLoading}
        title="Bulk Delete"
        message={`Delete ${selected.length} selected athletes? This cannot be undone.`}
        confirmText={`Delete ${selected.length} Athletes`}
      />

      {/* AI Generate Modal */}
      <AiAthleteListModal open={aiModalOpen} onClose={() => setAiModalOpen(false)} sports={sports} />
    </div>
  );
};

export default AthleteList;
