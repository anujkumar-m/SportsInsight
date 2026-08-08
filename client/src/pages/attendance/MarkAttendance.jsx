import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle2, UserCheck, Calendar } from 'lucide-react';
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

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadSquad() {
      try {
        const res = await athleteService.getAthletes({ limit: 200 });
        const list = res.data?.athletes || res.data || [];
        setAthletes(list);

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
          <Button variant="outline" size="sm" onClick={() => navigate('/attendance')}>
            <ArrowLeft size={14} className="mr-1.5" /> Back to Records
          </Button>
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
          <Button type="submit" loading={loading}>
            <Save size={14} className="mr-1.5" /> Submit Attendance
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MarkAttendance;
