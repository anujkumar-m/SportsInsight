import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Sparkles, Trophy, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { performanceService } from '../../services/performanceService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const PerformanceTimeline = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimeline() {
      try {
        const res = await performanceService.getRecords({ limit: 50 });
        setRecords(res.data?.records || []);
      } catch (e) {
        toast.error('Failed to load performance timeline.');
      } finally {
        setLoading(false);
      }
    }
    loadTimeline();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading performance timeline...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Timeline"
        subtitle="Chronological audit feed of all performance records and AI evaluations."
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/performance')}>Back to Records</Button>
        }
      />

      <div className="relative border-l-2 border-primary/30 ml-4 space-y-6 pl-6">
        {records.map((r) => (
          <div key={r.id} className="relative group">
            <div className="absolute -left-[31px] top-1.5 size-4 rounded-full border-2 border-primary bg-background group-hover:bg-primary transition-colors" />

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {r.profile_photo ? (
                    <img src={r.profile_photo} alt="" className="size-8 rounded-full object-cover" />
                  ) : (
                    <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {r.first_name?.[0]}{r.last_name?.[0]}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{r.first_name} {r.last_name}</h4>
                    <p className="text-xs text-muted-foreground">{r.sport_name} • {r.athlete_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={13} /> {new Date(r.record_date).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div>
                  <span className="text-xs text-muted-foreground">Metric Assessed:</span>
                  <div className="text-base font-bold text-foreground">{r.metric_name}: <span className="text-primary">{r.metric_value} {r.metric_unit}</span></div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">AI Score</span>
                  <div className="text-lg font-extrabold text-foreground">{r.performance_score ?? 75} / 100</div>
                </div>
              </div>

              {r.ai_analysis?.reason && (
                <div className="text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-lg">
                  <Sparkles size={12} className="inline mr-1 text-primary" /> {r.ai_analysis.reason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceTimeline;
