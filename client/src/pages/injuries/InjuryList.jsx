import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, HeartPulse, Activity, ShieldAlert, FilePlus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { injuryService } from '../../services/injuryService';
import { athleteService } from '../../services/athleteService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const SeverityBadge = ({ severity }) => {
  const map = {
    minor: 'info',
    moderate: 'warning',
    severe: 'danger',
    critical: 'danger',
  };
  return <Badge variant={map[severity] || 'secondary'}>{severity}</Badge>;
};

const AvailabilityBadge = ({ status }) => {
  const map = {
    fit: 'success',
    unfit: 'danger',
    restricted: 'warning',
    under_observation: 'info',
  };
  return <Badge variant={map[status] || 'secondary'}>{status?.replace('_', ' ')}</Badge>;
};

const InjuryList = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [injuries, setInjuries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [athleteId, setAthleteId] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAthletes = async () => {
    try {
      const res = await athleteService.getAthletes({ limit: 150 });
      setAthletes(res.data?.athletes || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInjuries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await injuryService.getInjuries({
        page,
        limit,
        search,
        severity: severity || undefined,
        availabilityStatus: availabilityStatus || undefined,
        athleteId: athleteId || undefined,
      });
      setInjuries(res.data.injuries);
      setTotal(res.data.pagination.total);
    } catch (e) {
      toast.error('Failed to load injury register.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, severity, availabilityStatus, athleteId]);

  useEffect(() => {
    fetchAthletes();
  }, []);

  useEffect(() => {
    fetchInjuries();
  }, [fetchInjuries]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await injuryService.delete(confirmDelete.id);
      toast.success('Injury record deleted.');
      setConfirmDelete(null);
      fetchInjuries();
    } catch (e) {
      toast.error('Failed to delete injury record.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'athlete',
      label: 'Athlete',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          {row.profile_photo ? (
            <img src={row.profile_photo} alt="" className="size-9 rounded-full object-cover border border-border" />
          ) : (
            <div className="grid size-9 place-items-center rounded-full bg-rose-500/10 text-rose-500 font-bold text-xs">
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
      key: 'injury_details',
      label: 'Injury & Body Part',
      render: (_, row) => (
        <div>
          <div className="font-medium text-foreground text-sm">{row.injury_type}</div>
          <div className="text-xs text-muted-foreground">{row.body_part || 'General'}</div>
        </div>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (_, row) => <SeverityBadge severity={row.severity} />,
    },
    {
      key: 'availability_status',
      label: 'Availability',
      render: (_, row) => <AvailabilityBadge status={row.availability_status} />,
    },
    {
      key: 'ai_recovery',
      label: 'AI Recovery Prediction',
      render: (_, row) => {
        const ai = row.ai_analysis;
        return (
          <div className="space-y-1 max-w-xs text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">{ai?.recoveryPercentage || 0}% Recovered</span>
              <span className="text-[10px] text-muted-foreground">Return: {ai?.expectedReturnDate || 'TBD'}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${ai?.recoveryPercentage || 0}%` }} />
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center justify-between">
              <span>Reinjury Risk: <strong className={ai?.reinjuryProbability > 40 ? 'text-rose-500' : 'text-emerald-500'}>{ai?.reinjuryProbability || 10}%</strong></span>
              <span>Readiness: {ai?.trainingReadiness || 0}%</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/injuries/recovery/${r.id}`); }}
            title="Recovery Tracker & Checkups"
            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors font-medium text-xs flex items-center gap-1"
          >
            <Activity size={14} /> Recovery
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/injuries/history/${r.athlete_id}`); }}
            title="View Medical History"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Eye size={14} />
          </button>
          {(role === 'admin' || role === 'coach') && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/injuries/${r.id}/edit`); }}
                title="Edit Injury"
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(r); }}
                title="Delete Injury"
                className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Injury Management & Recovery Tracking"
        subtitle="Monitor active injuries, doctor checkups, reinjury risk probabilities, and return-to-play timelines."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {(role === 'admin' || role === 'coach') && (
              <Button size="sm" onClick={() => navigate('/injuries/add')}>
                <Plus size={14} className="mr-1.5" /> Record New Injury
              </Button>
            )}
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search athlete, injury type, body part..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Severities</option>
          <option value="minor">Minor</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={availabilityStatus}
          onChange={(e) => { setAvailabilityStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Availability Statuses</option>
          <option value="fit">Fit for Play</option>
          <option value="unfit">Unfit / Out</option>
          <option value="restricted">Restricted Training</option>
          <option value="under_observation">Under Observation</option>
        </select>
        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSeverity(''); setAvailabilityStatus(''); setAthleteId(''); }}>
          <RefreshCw size={13} className="mr-1" /> Reset
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={injuries}
        loading={loading}
        emptyMessage="No injury records found."
      />

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / limit) || 1}
        onPageChange={setPage}
        totalEntries={total}
        limit={limit}
        onLimitChange={setLimit}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Injury Record"
        message={`Are you sure you want to delete injury record for ${confirmDelete?.first_name}?`}
        confirmText="Delete Record"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default InjuryList;
