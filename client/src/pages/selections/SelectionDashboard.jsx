import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, CheckCircle2, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectionService } from '../../services/selectionService';
import { sportService } from '../../services/sportService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const SelectionDashboard = () => {
  const navigate = useNavigate();

  const [selections, setSelections] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState('');
  const [sportId, setSportId] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [selRes, sportRes] = await Promise.all([
          selectionService.getSelections({ status, sportId }).catch(() => ({ data: { selections: [] } })),
          sportService.listSports().catch(() => ({ data: [] })),
        ]);
        setSelections(selRes.data?.selections || selRes.data || []);
        setSports(sportRes.data || []);
      } catch (e) {
        toast.error('Failed to load selection data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [status, sportId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Selection Intelligence Command"
        subtitle="AI-assisted objective selection using 40% Perf + 30% Fitness + 20% Attendance + 10% Coach Rating"
        action={
          <Button size="sm" leftIcon={Sparkles} onClick={() => navigate('/selections/recommended')}>AI Recommendation Engine</Button>
        }
      />

      {/* Formula & Filters Header */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
            >
              <option value="">All Statuses</option>
              <option value="selected">Selected</option>
              <option value="recommended">Recommended</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="pending">Pending Review</option>
            </select>

            <select
              value={sportId}
              onChange={(e) => setSportId(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
            >
              <option value="">All Sports</option>
              {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Selection Formula Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-xl bg-primary/10 p-2.5 border border-primary/20">
            <span className="font-bold text-primary">40% Performance</span>
          </div>
          <div className="rounded-xl bg-cyan-500/10 p-2.5 border border-cyan-500/20">
            <span className="font-bold text-cyan-500">30% Fitness</span>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-2.5 border border-amber-500/20">
            <span className="font-bold text-amber-500">20% Attendance</span>
          </div>
          <div className="rounded-xl bg-violet-500/10 p-2.5 border border-violet-500/20">
            <span className="font-bold text-violet-500">10% Coach Rating</span>
          </div>
        </div>
      </div>

      {/* Selections Table */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : selections.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground rounded-2xl border border-border bg-card">
          No selection records found for these filters. Click 'AI Recommendation Engine' above to generate.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                {['Athlete', 'Sport / Category', 'Selection Score', 'Confidence', 'Perf (40%)', 'Fitness (30%)', 'Att (20%)', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {selections.map(sel => (
                <tr key={sel.id} className="hover:bg-secondary/30 transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground">{sel.first_name} {sel.last_name}</div>
                    <div className="text-[11px] text-muted-foreground">{sel.athlete_code}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{sel.sport || 'General'}</div>
                    <div className="text-[10px]">{sel.category || 'Open'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20">
                      {sel.selection_score}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-emerald-500">
                    {sel.confidence_score}% Confidence
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{sel.performance_score}%</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{sel.fitness_score}%</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{sel.attendance_score}%</td>
                  <td className="px-4 py-3">
                    <Badge variant={sel.status === 'selected' ? 'success' : sel.status === 'recommended' ? 'info' : 'warning'}>
                      {sel.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SelectionDashboard;
