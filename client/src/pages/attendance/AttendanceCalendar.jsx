import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../../services/attendanceService';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';

const AttendanceCalendar = () => {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [athletes, setAthletes] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAthletes() {
      try {
        const res = await athleteService.getAthletes({ limit: 150 });
        const list = res.data?.athletes || res.data || [];
        setAthletes(list);
        if (list.length > 0) setSelectedAthlete(list[0].id);
      } catch (e) {
        console.error(e);
      }
    }
    loadAthletes();
  }, []);

  useEffect(() => {
    async function fetchCalendarLogs() {
      if (!selectedAthlete) return;
      setLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dateFrom = `${year}-${month}-01`;
        const lastDay = new Date(year, currentDate.getMonth() + 1, 0).getDate();
        const dateTo = `${year}-${month}-${lastDay}`;

        const res = await attendanceService.getRecords({
          athleteId: selectedAthlete,
          dateFrom,
          dateTo,
          limit: 100,
        });
        setLogs(res.data?.records || []);
      } catch (e) {
        toast.error('Failed to load calendar data.');
      } finally {
        setLoading(false);
      }
    }
    fetchCalendarLogs();
  }, [selectedAthlete, currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map day -> status
  const statusMap = {};
  logs.forEach((l) => {
    const d = new Date(l.attendance_date).getDate();
    statusMap[d] = l;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Calendar View"
        subtitle="Visual monthly attendance log and status distribution for selected athlete."
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/attendance')}>
            <ArrowLeft size={14} className="mr-1.5" /> Back to Records
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon size={20} className="text-primary" />
            <select
              value={selectedAthlete}
              onChange={(e) => setSelectedAthlete(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-semibold min-w-[200px]"
            >
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>{a.first_name} {a.last_name} ({a.athlete_code})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-base font-bold text-foreground min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground uppercase border-b border-border pb-2">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-20 rounded-xl bg-secondary/20" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const logEntry = statusMap[dayNum];
            const status = logEntry?.status;

            return (
              <div
                key={dayNum}
                className={`h-20 rounded-xl border p-2 flex flex-col justify-between text-left transition-all ${
                  logEntry
                    ? status === 'present'
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : status === 'absent'
                      ? 'border-rose-500/30 bg-rose-500/10'
                      : status === 'leave'
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : 'border-indigo-500/30 bg-indigo-500/10'
                    : 'border-border bg-background'
                }`}
              >
                <span className="text-xs font-bold text-foreground">{dayNum}</span>
                {logEntry ? (
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      status === 'present' ? 'text-emerald-500' : status === 'absent' ? 'text-rose-500' : 'text-amber-500'
                    }`}>
                      {status}
                    </span>
                    {logEntry.remarks && <p className="text-[9px] text-muted-foreground line-clamp-1">{logEntry.remarks}</p>}
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">No Log</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
