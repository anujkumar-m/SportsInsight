// ─── pages/athletes/AthleteList.jsx ──────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Download, Upload, Trash2, Archive, RefreshCw,
  Sparkles, Eye, Pencil, MoreVertical, UserCheck, MessageSquare, X, Star, Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import { sportService } from '../../services/sportService';
import { coachService } from '../../services/coachService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AiAthleteListModal from './AiAthleteListModal';
import ImportAthleteModal from './ImportAthleteModal';
import AddAchievementModal from './AddAchievementModal';

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
const RowActions = ({ athlete, onView, onEdit, onArchive, onDelete, onFeedback, onAddAchievement, role }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = React.useRef(null);

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const menuHeight = 210;
      const openUpward = rect.bottom + menuHeight > windowHeight;
      setCoords({
        top: openUpward ? Math.max(8, rect.top - menuHeight) : rect.bottom + 2,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        title="Options"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-[998]"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            style={{ position: 'fixed', top: `${coords.top}px`, right: `${coords.right}px` }}
            className="z-[999] min-w-[175px] rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card p-1.5 shadow-xl space-y-0.5"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onView(athlete);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-secondary text-gray-800 dark:text-foreground transition-colors"
            >
              <Eye size={13} className="text-gray-500 dark:text-muted-foreground" /> View Profile
            </button>
            {(role === 'admin' || role === 'coach' || role === 'head_coach') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onAddAchievement(athlete);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium transition-colors"
              >
                <Trophy size={13} /> Add Achievement
              </button>
            )}
            {(role === 'admin' || role === 'coach' || role === 'head_coach') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onEdit(athlete);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-secondary text-gray-800 dark:text-foreground transition-colors"
              >
                <Pencil size={13} className="text-gray-500 dark:text-muted-foreground" /> Edit
              </button>
            )}
            {(role === 'admin' || role === 'coach' || role === 'head_coach') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onFeedback(athlete);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-primary/10 text-primary font-medium transition-colors"
              >
                <MessageSquare size={13} /> Give Feedback
              </button>
            )}
            {role === 'admin' && athlete.current_status !== 'archived' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onArchive(athlete);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-warning hover:bg-warning/10 transition-colors"
              >
                <Archive size={13} /> Archive
              </button>
            )}
            {role === 'admin' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onDelete(athlete);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
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
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Achievement Modal State
  const [achievementModalOpen, setAchievementModalOpen] = useState(false);
  const [selectedAchievementAthlete, setSelectedAchievementAthlete] = useState(null);

  // Feedback Modal State
  const [feedbackAthlete, setFeedbackAthlete] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    remark_type: 'performance',
    remarks: '',
    rating: 8.0,
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (feedbackAthlete) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [feedbackAthlete]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.remarks.trim()) {
      toast.error('Please enter feedback content.');
      return;
    }
    setSubmittingFeedback(true);
    try {
      await coachService.createRemark({
        athlete_id: feedbackAthlete.id,
        remark_type: feedbackForm.remark_type,
        remarks: feedbackForm.remarks.trim(),
        rating: Number(feedbackForm.rating) || 8.0,
        remark_date: new Date().toISOString().split('T')[0],
      });
      toast.success(`Feedback recorded for ${feedbackAthlete.full_name || 'athlete'}!`);
      setFeedbackAthlete(null);
      setFeedbackForm({ remark_type: 'performance', remarks: '', rating: 8.0 });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

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
          onAddAchievement={(a) => {
            setSelectedAchievementAthlete(a);
            setAchievementModalOpen(true);
          }}
          onFeedback={(a) => {
            setFeedbackAthlete(a);
            setFeedbackForm({ remark_type: 'Performance', remarks: '', rating: 8.0 });
          }}
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
            {(role === 'admin' || role === 'coach' || role === 'head_coach') && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={Trophy}
                className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                onClick={() => {
                  setSelectedAchievementAthlete(null);
                  setAchievementModalOpen(true);
                }}
              >
                Add Achievement
              </Button>
            )}
            {role === 'admin' && (
              <>
                <Button variant="outline" size="sm" leftIcon={Upload} onClick={() => setImportModalOpen(true)}>
                  Import
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

      {/* Import Athletes Modal */}
      <ImportAthleteModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Give Feedback Modal Portal */}
      {feedbackAthlete &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 w-screen h-screen overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Full-viewport edge-to-edge backdrop */}
            <div
              className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setFeedbackAthlete(null)}
              aria-hidden="true"
            />

            {/* Modal Dialog Box */}
            <div className="relative z-10 w-full max-w-lg my-auto animate-in fade-in zoom-in-95 duration-150 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl space-y-4 text-gray-900">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Give Athlete Feedback</h2>
                  <p className="text-xs text-gray-500">
                    Provide evaluation for <span className="font-semibold text-gray-800">{feedbackAthlete.full_name}</span> ({feedbackAthlete.athlete_code || feedbackAthlete.sport_name})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackAthlete(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {/* Category selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Feedback Category <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'performance', label: 'Performance', desc: 'Skill, tactics & match play' },
                      { key: 'fitness', label: 'Fitness', desc: 'Strength, stamina & recovery' },
                      { key: 'behavior', label: 'Behavior & Discipline', desc: 'Punctuality, teamwork & mindset' },
                      { key: 'general', label: 'General Feedback', desc: 'Overall guidance & notes' },
                    ].map((cat) => {
                      const selected = feedbackForm.remark_type === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setFeedbackForm((prev) => ({ ...prev, remark_type: cat.key }))}
                          className={`text-left p-2.5 rounded-xl border transition-all text-xs ${
                            selected
                              ? 'border-primary bg-primary/10 text-gray-900 font-semibold shadow-xs ring-1 ring-primary'
                              : 'border-gray-200 bg-gray-50/70 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <div className="font-bold text-gray-800">{cat.label}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{cat.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating slider / score */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Performance / Attitude Rating
                    </label>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      <Star size={12} className="fill-primary text-primary" /> {feedbackForm.rating} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={feedbackForm.rating}
                    onChange={(e) => setFeedbackForm((prev) => ({ ...prev, rating: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Remarks content */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Feedback Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={feedbackForm.remarks}
                    onChange={(e) => setFeedbackForm((prev) => ({ ...prev, remarks: e.target.value }))}
                    placeholder={`Write detailed ${feedbackForm.remark_type} remarks, instructions, or encouragement for ${feedbackAthlete.full_name}...`}
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFeedbackAthlete(null)}
                    disabled={submittingFeedback}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    loading={submittingFeedback}
                    leftIcon={MessageSquare}
                  >
                    Submit Feedback
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Add Achievement Modal */}
      <AddAchievementModal
        isOpen={achievementModalOpen}
        onClose={() => setAchievementModalOpen(false)}
        athlete={selectedAchievementAthlete}
        athletes={data}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default AthleteList;
