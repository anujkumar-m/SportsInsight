import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Plus, X, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../../services/attendanceService';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const MarkAttendance = () => {
  const navigate = useNavigate();

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [athletes, setAthletes] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Provide Attendance Modal state
  const [isProvideModalOpen, setIsProvideModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalSession, setModalSession] = useState('Morning');
  const [studentSelection, setStudentSelection] = useState('all'); // 'all' or 'specific'
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [modalAttendanceMap, setModalAttendanceMap] = useState({});
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadSquad() {
      try {
        const res = await athleteService.getAthletes({ limit: 200 });
        const list = res.data?.athletes || res.data || (Array.isArray(res) ? res : []);
        setAthletes(list);

        if (list.length > 0) {
          setSelectedStudentId(list[0].id);
        }

        const initialMap = {};
        list.forEach((a) => {
          initialMap[a.id] = { status: 'present', remarks: '' };
        });
        setAttendanceMap(initialMap);
      } catch (e) {
        toast.error('Failed to load squad athletes.');
      } finally {
        setFetching(false);
      }
    }
    loadSquad();
  }, []);

  const openProvideModal = () => {
    setModalDate(new Date().toISOString().split('T')[0]);
    setModalSession('Morning');
    setStudentSelection('all');
    if (athletes.length > 0) {
      setSelectedStudentId(athletes[0].id);
    }
    const initialMap = {};
    athletes.forEach((a) => {
      initialMap[a.id] = '';
    });
    setModalAttendanceMap(initialMap);
    setIsProvideModalOpen(true);
  };

  const modalDisplayAthletes = studentSelection === 'all'
    ? athletes
    : athletes.filter((a) => String(a.id) === String(selectedStudentId));

  const handleSaveModalAttendance = async () => {
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
      navigate('/attendance');
    } catch (err) {
      toast.error(err?.message || 'Failed to save attendance.');
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const handleStatusChange = (athleteId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [athleteId]: { ...prev[athleteId], status },
    }));
  };

  const handleRemarksChange = (athleteId, remarks) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [athleteId]: { ...prev[athleteId], remarks },
    }));
  };

  const handleMarkAll = (status) => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { ...updated[id], status };
      });
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (attendanceDate > todayStr) {
      toast.error('Future dates are not allowed for attendance logging.');
      return;
    }

    const payload = athletes.map((a) => ({
      athlete_id: a.id,
      attendance_date: attendanceDate,
      session: 'Morning',
      status: attendanceMap[a.id]?.status || 'present',
      remarks: attendanceMap[a.id]?.remarks || '',
    }));

    setLoading(true);
    try {
      await attendanceService.markAttendance(payload);
      toast.success('Attendance recorded for squad!');
      navigate('/attendance');
    } catch (err) {
      toast.error(err.message || 'Failed to submit attendance.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-muted-foreground">Loading squad...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Mark Squad Attendance"
        subtitle="Bulk attendance logging for daily training sessions."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={openProvideModal}
              className="inline-flex items-center justify-center gap-2 flex-nowrap whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs px-4 py-2.5 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 border border-emerald-400/30 cursor-pointer shrink-0"
            >
              <UserCheck size={16} className="shrink-0 text-emerald-100" />
              <span className="whitespace-nowrap">Provide Attendance</span>
            </button>
            <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/attendance')}
              className="rounded-xl border-border bg-card/60 backdrop-blur-sm text-foreground hover:bg-secondary transition-all duration-200"
            >Back to Records</Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-primary" />
            <div>
              <label className="text-xs font-bold text-foreground">Attendance Date (No Future Dates)</label>
              <input
                type="date"
                required
                max={todayStr}
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="mt-1 block rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Quick Bulk Actions:</span>
            <Button type="button" variant="outline" size="xs" onClick={() => handleMarkAll('present')}>
              All Present
            </Button>
            <Button type="button" variant="outline" size="xs" onClick={() => handleMarkAll('absent')}>
              All Absent
            </Button>
          </div>
        </div>

        {/* Squad Attendance Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {athletes.map((a) => {
              const currentStatus = attendanceMap[a.id]?.status || 'present';
              return (
                <div key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    {a.profile_photo ? (
                      <img src={a.profile_photo} alt="" className="size-9 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {a.first_name?.[0]}{a.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-foreground text-sm">{a.first_name} {a.last_name}</div>
                      <div className="text-xs text-muted-foreground">{a.athlete_code} • {a.sport_name || 'General'}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {['present', 'absent', 'leave', 'half_day', 'late'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(a.id, st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                          currentStatus === st
                            ? st === 'present'
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : st === 'absent'
                              ? 'bg-rose-500 text-white border-rose-500'
                              : st === 'leave'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-indigo-500 text-white border-indigo-500'
                            : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Optional remarks..."
                    value={attendanceMap[a.id]?.remarks || ''}
                    onChange={(e) => handleRemarksChange(a.id, e.target.value)}
                    className="w-full sm:w-48 rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/attendance')}>
            Cancel
          </Button>
          <Button type="submit" leftIcon={Save} loading={loading}>Submit Attendance</Button>
        </div>
      </form>

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
              <Button size="sm" onClick={handleSaveModalAttendance} loading={submittingAttendance}>
                Save Attendance
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
