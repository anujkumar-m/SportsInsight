import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar as CalendarIcon, FileText, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../../services/attendanceService';
import { athleteService } from '../../services/athleteService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AttendanceStatusBadge = ({ status }) => {
  const map = {
    present: { variant: 'success', label: 'Present' },
    absent: { variant: 'danger', label: 'Absent' },
    leave: { variant: 'warning', label: 'Leave' },
    half_day: { variant: 'info', label: 'Half Day' },
    late: { variant: 'secondary', label: 'Late' },
  };
  const item = map[status] || { variant: 'secondary', label: status };
  return <Badge variant={item.variant}>{item.label}</Badge>;
};

const AttendanceList = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
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

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getRecords({
        page,
        limit,
        search,
        date: date || undefined,
        status: status || undefined,
        athleteId: athleteId || undefined,
      });
      setRecords(res.data.records);
      setTotal(res.data.pagination.total);
    } catch (e) {
      toast.error('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, date, status, athleteId]);

  useEffect(() => {
    fetchAthletes();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await attendanceService.delete(confirmDelete.id);
      toast.success('Attendance record deleted successfully.');
      setConfirmDelete(null);
      fetchRecords();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete attendance record.');
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
            <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
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
      key: 'attendance_date',
      label: 'Date',
      render: (_, row) => <span className="text-xs text-muted-foreground">{new Date(row.attendance_date).toLocaleDateString()}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <AttendanceStatusBadge status={row.status} />,
    },
    {
      key: 'remarks',
      label: 'Remarks',
      render: (_, row) => <span className="text-xs text-muted-foreground italic">{row.remarks || '—'}</span>,
    },
    ...(role === 'admin' || role === 'coach' ? [{
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        subtitle="Track daily training participation, unexcused absences, and athlete consistency scores."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/attendance/calendar')}>
              <CalendarIcon size={14} className="mr-1.5" /> Calendar View
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/attendance/reports')}>
              <FileText size={14} className="mr-1.5" /> Reports & AI Alerts
            </Button>
            {(role === 'admin' || role === 'coach') && (
              <Button size="sm" onClick={() => navigate('/attendance/mark')}>
                <Plus size={14} className="mr-1.5" /> Mark Attendance
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
            placeholder="Search athlete..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="leave">Leave</option>
          <option value="half_day">Half Day</option>
          <option value="late">Late</option>
        </select>
        <select
          value={athleteId}
          onChange={(e) => { setAthleteId(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground min-w-[160px]"
        >
          <option value="">All Athletes</option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setDate(''); setStatus(''); setAthleteId(''); }}>
          <RefreshCw size={13} className="mr-1" /> Reset
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        emptyMessage="No attendance records found."
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
        title="Delete Attendance Record"
        message={`Are you sure you want to delete the attendance record for ${confirmDelete?.first_name} ${confirmDelete?.last_name} on ${confirmDelete?.attendance_date ? new Date(confirmDelete.attendance_date).toLocaleDateString() : ''}?`}
        confirmText="Delete Record"
        loading={actionLoading}
      />
    </div>
  );
};

export default AttendanceList;
