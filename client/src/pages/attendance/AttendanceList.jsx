import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar as CalendarIcon, FileText, Trash2, RefreshCw, X, UserCheck, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
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

  // Row Details Modal
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  // Prevent background scroll when modal open
  useEffect(() => {
    if (selectedAttendance) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = orig; };
    }
  }, [selectedAttendance]);

  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [status, setStatus] = useState('');
  const [athleteId, setAthleteId] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Provide Attendance Popup/Modal state
  const [isProvideModalOpen, setIsProvideModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalSession, setModalSession] = useState('Morning');
  const [studentSelection, setStudentSelection] = useState('all'); // 'all' or 'specific'
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [modalAttendanceMap, setModalAttendanceMap] = useState({});
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  const fetchAthletes = async () => {
    try {
      const res = await athleteService.getAthletes({ limit: 200 });
      const list = res.data?.athletes || res.data || (Array.isArray(res) ? res : []);
      setAthletes(list);
      if (list.length > 0 && !selectedStudentId) {
        setSelectedStudentId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to load athletes:', e);
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
        session: sessionFilter || undefined,
        status: status || undefined,
        athleteId: athleteId || undefined,
      });
      const recordList = res?.data?.data?.records || res?.data?.records || res?.records || (Array.isArray(res?.data) ? res.data : []);
      const totalCount = res?.data?.data?.pagination?.total ?? res?.data?.pagination?.total ?? res?.pagination?.total ?? recordList.length;
      setRecords(recordList);
      setTotal(totalCount);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, date, sessionFilter, status, athleteId]);

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

  const openProvideModal = () => {
    setModalDate(new Date().toISOString().split('T')[0]);
    setModalSession('Morning');
    setStudentSelection('all');
    if (athletes.length > 0) {
      setSelectedStudentId(athletes[0].id);
    }
    const initialMap = {};
    athletes.forEach((a) => {
      initialMap[a.id] = ''; // default unselected / dash
    });
    setModalAttendanceMap(initialMap);
    setIsProvideModalOpen(true);
  };

  const modalDisplayAthletes = studentSelection === 'all'
    ? athletes
    : athletes.filter((a) => String(a.id) === String(selectedStudentId));

  const handleSaveAttendance = async () => {
    if (modalDisplayAthletes.length === 0) {
      toast.error('No students selected.');
      return;
    }

    const payload = modalDisplayAthletes.map((a) => ({
      athlete_id: a.id,
      attendance_date: modalDate,
      session: modalSession,
      status: modalAttendanceMap[a.id] || 'present',
      remarks: '',
    }));

    setSubmittingAttendance(true);
    try {
      await attendanceService.markAttendance(payload);
      toast.success('Attendance saved successfully!');
      setIsProvideModalOpen(false);
      fetchRecords();
    } catch (err) {
      toast.error(err?.message || 'Failed to save attendance.');
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const columns = [
    {
      key: 'athlete',
      label: 'Athlete',
      width: role === 'athlete' ? '34%' : '30%',
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
            <div className="text-xs text-muted-foreground">{row.athlete_code} • {row.sport_name || 'Athletics'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'attendance_date',
      label: 'Date',
      width: role === 'athlete' ? '22%' : '16%',
      render: (_, row) => <span className="text-xs text-muted-foreground">{new Date(row.attendance_date).toLocaleDateString()}</span>,
    },
    {
      key: 'session',
      label: 'Session',
      width: role === 'athlete' ? '22%' : '16%',
      render: (_, row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-secondary text-foreground border border-border">
          {row.session || 'Morning'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: role === 'athlete' ? '22%' : '16%',
      render: (_, row) => <AttendanceStatusBadge status={row.status} />,
    },
    ...(role !== 'athlete'
      ? [
          {
            key: 'remarks',
            label: 'Remarks',
            width: '16%',
            render: (_, row) => <span className="text-xs text-muted-foreground italic">{row.remarks || '—'}</span>,
          },
          {
            key: 'actions',
            label: '',
            width: '6%',
            render: (_, row) => (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(row);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        subtitle="Track daily training participation, unexcused absences, and athlete consistency scores."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/attendance/calendar')}
              className="rounded-xl border-border bg-card/60 backdrop-blur-sm text-foreground hover:bg-secondary hover:text-primary transition-all duration-200"
              leftIcon={CalendarIcon}
            >Calendar View</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/attendance/reports')}
              className="rounded-xl border-border bg-card/60 backdrop-blur-sm text-foreground hover:bg-secondary hover:text-primary transition-all duration-200"
              leftIcon={FileText}
            >Reports &amp; AI Alerts</Button>
            {role !== 'athlete' && (
              <button
                type="button"
                onClick={openProvideModal}
                className="inline-flex items-center justify-center gap-2 flex-nowrap whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs px-4 py-2.5 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 border border-emerald-400/30 cursor-pointer shrink-0"
              >
                <UserCheck size={16} className="shrink-0 text-emerald-100" />
                <span className="whitespace-nowrap">Provide Attendance</span>
              </button>
            )}
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search date, status..."
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
          value={sessionFilter}
          onChange={(e) => { setSessionFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Sessions</option>
          <option value="Morning">Morning</option>
          <option value="Evening">Evening</option>
        </select>
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
        {athletes.length > 0 && (
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
        )}
          <Button variant="ghost" size="sm" leftIcon={RefreshCw} onClick={() => { setSearch(''); setDate(''); setSessionFilter(''); setStatus(''); setAthleteId(''); }}>
            Reset
          </Button>
      </div>

      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        onRowClick={(row) => setSelectedAttendance(row)}
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

      {/* Provide Attendance Popup / Modal */}
      {isProvideModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProvideModalOpen(false)} />
          <div className="relative z-10 w-full max-w-3xl animate-fade-in rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Provide Attendance</h2>
                <p className="text-xs text-muted-foreground">Select session, date, and mark attendance for assigned students.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProvideModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Controls Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-secondary/30 p-4 rounded-xl border border-border">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Date:</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Session:</label>
                <select
                  value={modalSession}
                  onChange={(e) => setModalSession(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Students:</label>
                <select
                  value={studentSelection}
                  onChange={(e) => {
                    setStudentSelection(e.target.value);
                    if (e.target.value === 'specific' && athletes.length > 0 && !selectedStudentId) {
                      setSelectedStudentId(athletes[0].id);
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Students</option>
                  <option value="specific">Specific Student</option>
                </select>
              </div>
            </div>

            {studentSelection === 'specific' && (
              <div className="bg-secondary/20 p-3 rounded-lg border border-border flex items-center gap-3">
                <label className="text-xs font-semibold text-foreground whitespace-nowrap">Select Student:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.first_name} {a.last_name} ({a.athlete_code || a.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Students Table */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/60 text-xs font-semibold text-muted-foreground uppercase border-b border-border sticky top-0 bg-card z-10">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Sport</th>
                    <th className="px-4 py-3">Attendance</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {modalDisplayAthletes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    modalDisplayAthletes.map((a, idx) => {
                      const currentStatus = modalAttendanceMap[a.id];
                      return (
                        <tr key={a.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {a.first_name} {a.last_name}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{a.sport_name || 'Athletics'}</td>
                          <td className="px-4 py-3">
                            {currentStatus === 'present' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Present
                              </span>
                            ) : currentStatus === 'absent' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                Absent
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-medium">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setModalAttendanceMap((prev) => ({ ...prev, [a.id]: 'present' }))}
                                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-background text-foreground border-border hover:bg-emerald-500/10 hover:border-emerald-500/30'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => setModalAttendanceMap((prev) => ({ ...prev, [a.id]: 'absent' }))}
                                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                    : 'bg-background text-foreground border-border hover:bg-rose-500/10 hover:border-rose-500/30'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setIsProvideModalOpen(false)} disabled={submittingAttendance}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveAttendance} loading={submittingAttendance}>
                Save Attendance
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Attendance Record"
        message={`Are you sure you want to delete the attendance record for ${confirmDelete?.first_name} ${confirmDelete?.last_name} on ${confirmDelete?.attendance_date ? new Date(confirmDelete.attendance_date).toLocaleDateString() : ''}?`}
        confirmText="Delete Record"
        loading={actionLoading}
      />

      {/* Attendance Record Details Modal Portal */}
      {selectedAttendance &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 w-screen h-screen overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Full-viewport edge-to-edge backdrop */}
            <div
              className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedAttendance(null)}
              aria-hidden="true"
            />

            {/* Modal Dialog Box */}
            <div className="relative z-10 w-full max-w-lg my-auto animate-in fade-in zoom-in-95 duration-150 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl space-y-5 text-gray-900">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Attendance Log Details</h2>
                    <p className="text-xs text-gray-500">
                      {selectedAttendance.first_name} {selectedAttendance.last_name} · <span className="font-semibold text-gray-700">{selectedAttendance.athlete_code}</span> ({selectedAttendance.sport_name || 'Athletics'})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAttendance(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Attendance Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Attendance Status</div>
                  <div className="mt-1.5">
                    <AttendanceStatusBadge status={selectedAttendance.status} />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Session Time</div>
                  <div className="mt-1 text-sm font-bold text-gray-900 capitalize flex items-center gap-1.5">
                    <Clock size={13} className="text-gray-400" />
                    {selectedAttendance.session || 'Morning Session'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Attendance Date</div>
                  <div className="mt-1 text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <CalendarIcon size={13} className="text-gray-400" />
                    {selectedAttendance.attendance_date ? new Date(selectedAttendance.attendance_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Sport / Squad</div>
                  <div className="mt-1 text-sm font-semibold text-gray-800">
                    {selectedAttendance.sport_name || 'Athletics Team'}
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <MessageSquare size={14} className="text-primary" /> Attendance Remarks & Coach Notes
                </div>
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 text-xs text-gray-800 leading-relaxed italic">
                  {selectedAttendance.remarks?.trim() ? (
                    `"${selectedAttendance.remarks.trim()}"`
                  ) : (
                    <span className="text-gray-400 not-italic">No specific remarks logged for this attendance record.</span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedAttendance(null)}
                  className="border-gray-200 text-gray-700 hover:bg-gray-100"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AttendanceList;
