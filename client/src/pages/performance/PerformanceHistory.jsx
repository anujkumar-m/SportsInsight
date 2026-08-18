import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, TrendingUp, TrendingDown, Clock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { performanceService } from '../../services/performanceService';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';

const PerformanceHistory = () => {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [athlete, setAthlete] = useState(null);
  const [historyData, setHistoryData] = useState({ records: [], timeline: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [athRes, histRes] = await Promise.all([
          athleteService.getById(athleteId).catch(() => ({ data: null })),
          performanceService.getHistory(athleteId).catch(() => ({ data: { records: [], timeline: [] } })),
        ]);
        const athleteObj = athRes?.data?.data || athRes?.data || null;
        const histObj = histRes?.data?.data || histRes?.data || { records: [], timeline: [] };

        setAthlete(athleteObj);
        setHistoryData({
          records: Array.isArray(histObj?.records) ? histObj.records : Array.isArray(histObj) ? histObj : [],
          timeline: Array.isArray(histObj?.timeline) ? histObj.timeline : [],
        });
      } catch (e) {
        toast.error('Failed to load athlete performance history.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [athleteId]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading performance history...</div>;
  }

  const records = historyData.records || [];
  const timeline = historyData.timeline || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Performance History - ${athlete?.first_name} ${athlete?.last_name}`}
        subtitle={`Athlete Code: ${athlete?.athlete_code} • ${athlete?.sport_name || 'General'}`}
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/performance')}>Back to Records</Button>
        }
      />

      {/* Historical Summary Header Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {athlete?.profile_photo ? (
            <img src={athlete.profile_photo} alt="" className="size-16 rounded-full object-cover border-2 border-primary" />
          ) : (
            <div className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xl">
              {athlete?.first_name?.[0]}{athlete?.last_name?.[0]}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-foreground">{athlete?.first_name} {athlete?.last_name}</h3>
            <p className="text-xs text-muted-foreground">{athlete?.sport_name} • {athlete?.category_name || 'Senior'}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="primary">{records.length} Performance Records</Badge>
              <Badge variant="success">Active Athlete</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
          <div className="text-center">
            <div className="text-xs text-muted-foreground font-medium">Avg Score</div>
            <div className="text-2xl font-black text-primary">
              {records.length > 0
                ? Math.round(records.reduce((acc, r) => acc + (r.performance_score || 75), 0) / records.length)
                : 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground font-medium">Latest Metric</div>
            <div className="text-sm font-bold text-foreground">
              {records[0]?.metric_name || 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">{records[0]?.metric_value} {records[0]?.metric_unit}</div>
          </div>
        </div>
      </div>

      {/* Performance Records List & AI Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-foreground">Historical Assessments</h3>
          {records.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              No performance records logged yet.
            </div>
          ) : (
            records.map((r) => {
              const ai = r.ai_analysis;
              return (
                <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">{r.sport_name}</span>
                      <h4 className="text-lg font-bold text-foreground">{r.metric_name}: <span className="text-primary">{r.metric_value} {r.metric_unit}</span></h4>
                      <p className="text-xs text-muted-foreground">Assessed on {new Date(r.record_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-foreground">{r.performance_score ?? 75} <span className="text-xs text-muted-foreground">/ 100</span></div>
                      <div className="flex items-center justify-end gap-1 text-xs font-semibold mt-1">
                        {r.improvement_rate > 0 ? (
                          <span className="text-emerald-500 flex items-center"><TrendingUp size={12} className="mr-0.5" /> +{r.improvement_rate}%</span>
                        ) : r.improvement_rate < 0 ? (
                          <span className="text-rose-500 flex items-center"><TrendingDown size={12} className="mr-0.5" /> {r.improvement_rate}%</span>
                        ) : (
                          <span className="text-muted-foreground">Stable</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis Panel */}
                  {ai && (
                    <div className="rounded-lg bg-secondary/50 p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Sparkles size={13} className="text-primary" /> AI Insights ({ai.method || 'Statistical Engine'})
                        </span>
                        <Badge variant={ai.isExceptional ? 'success' : ai.isDeclining ? 'danger' : 'info'}>
                          Confidence: {ai.confidenceScore}%
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{ai.reason}</p>
                      {ai.suggestedImprovements && (
                        <div className="space-y-1 pt-1 border-t border-border/50">
                          <div className="font-semibold text-foreground">Suggested Focus:</div>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                            {ai.suggestedImprovements.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {r.notes && (
                    <div className="text-xs text-muted-foreground border-t border-border pt-2 italic">
                      Coach Remarks: "{r.notes}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Audit Timeline Sidebar */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">Activity Audit Log</h3>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent log history.</p>
            ) : (
              timeline.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <div className="p-1.5 rounded-full bg-primary/10 text-primary mt-0.5">
                    <Clock size={12} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{log.description}</div>
                    <div className="text-[11px] text-muted-foreground">
                      By {log.first_name || 'System'} • {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceHistory;
