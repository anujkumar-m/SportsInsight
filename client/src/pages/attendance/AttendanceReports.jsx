import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../../services/attendanceService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';

const AttendanceReports = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await attendanceService.getReport();
        setReport(res.data || []);
      } catch (e) {
        toast.error('Failed to load attendance report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Generating attendance intelligence report...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Reports & AI Intelligence"
        subtitle="Consistency scores, selection impact assessment, and automated attendance alerts."
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/attendance')}>Back to Records</Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {report.map((item) => {
          const ai = item.aiAnalysis;
          return (
            <div key={item.athlete_id} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">{item.first_name} {item.last_name}</h3>
                  <p className="text-xs text-muted-foreground">{item.athlete_code} • {item.sport_name || 'General'}</p>
                </div>
                <Badge variant={ai?.attendancePercentage >= 85 ? 'success' : ai?.attendancePercentage >= 75 ? 'info' : 'danger'}>
                  Grade {ai?.attendanceGrade || 'A'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-muted-foreground font-medium">Attendance Rate</div>
                  <div className="text-lg font-extrabold text-primary">{ai?.attendancePercentage || 100}%</div>
                </div>
                <div className="rounded-xl bg-background p-3 border border-border">
                  <div className="text-muted-foreground font-medium">Consistency Score</div>
                  <div className="text-lg font-extrabold text-emerald-500">{ai?.consistencyScore || 100} pts</div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Present: {item.present_days || 0} days</span>
                  <span>Absent: {item.absent_days || 0} days</span>
                  <span>Leave: {item.leave_days || 0} days</span>
                </div>
              </div>

              {/* AI Alerts Section */}
              {ai?.alerts && ai.alerts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  {ai.alerts.map((a, idx) => (
                    <div key={idx} className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-400 space-y-0.5">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> {a.title}
                      </div>
                      <p className="text-[11px] opacity-90">{a.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Selection Impact */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">Selection Impact:</span>
                <Badge variant={ai?.selectionImpact === 'Positive' ? 'success' : ai?.selectionImpact === 'Neutral' ? 'secondary' : 'danger'}>
                  {ai?.selectionImpact || 'Positive'} Impact
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceReports;
