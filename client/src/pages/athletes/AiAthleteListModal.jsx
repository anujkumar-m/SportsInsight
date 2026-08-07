// ─── pages/athletes/AiAthleteListModal.jsx ───────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Sparkles, Download, Save, Filter, Search, TrendingUp,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const AI_LIST_TYPES = [
  { value: 'top_performers', label: 'Top Performers', icon: '🏆', color: 'from-yellow-400/20 to-amber-500/10' },
  { value: 'most_improved', label: 'Most Improved', icon: '📈', color: 'from-emerald-400/20 to-green-500/10' },
  { value: 'highest_attendance', label: 'Highest Attendance', icon: '📅', color: 'from-purple-400/20 to-violet-500/10' },
  { value: 'best_fitness', label: 'Best Fitness', icon: '💪', color: 'from-blue-400/20 to-cyan-500/10' },
  { value: 'injury_free', label: 'Injury Free', icon: '🛡️', color: 'from-emerald-400/20 to-teal-500/10' },
  { value: 'recovery_ready', label: 'Recovery Ready', icon: '🩺', color: 'from-pink-400/20 to-rose-500/10' },
  { value: 'selection_ready', label: 'Selection Ready', icon: '🎯', color: 'from-teal-400/20 to-cyan-500/10' },
  { value: 'high_potential', label: 'High Potential Athletes', icon: '⚡', color: 'from-orange-400/20 to-red-500/10' },
  { value: 'underperforming', label: 'Underperforming Athletes', icon: '⚠️', color: 'from-red-400/20 to-orange-500/10' },
  { value: 'future_medal', label: 'Future Medal Winners', icon: '🥇', color: 'from-gold-400/20 to-yellow-500/10' },
  { value: 'future_national', label: 'Future National Players', icon: '🇮🇳', color: 'from-indigo-400/20 to-blue-500/10' },
];

const ConfidenceBar = ({ score }) => {
  const color = score >= 75 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-destructive';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{score}%</span>
    </div>
  );
};

const AiAthleteListModal = ({ open, onClose, sports = [], initialListType = 'top_performers' }) => {
  const [listType, setListType] = useState(initialListType);
  const [sportId, setSportId] = useState('');
  const [resultLimit, setResultLimit] = useState(20);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedId, setExpandedId] = useState(null);

  const handleGenerate = useCallback(async (targetType = listType) => {
    setGenerating(true);
    setResults(null);
    try {
      const res = await athleteService.generateList({
        list_type: targetType,
        sport_id: sportId || undefined,
        limit: resultLimit,
      });
      setResults(res.data || []);
      if (!res.data?.length) toast('No athletes match the criteria for this list type.', { icon: '📊' });
    } catch {
      toast.error('AI generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [listType, sportId, resultLimit]);

  useEffect(() => {
    if (open) {
      const targetType = initialListType || 'top_performers';
      setListType(targetType);
      handleGenerate(targetType);
    } else {
      setResults(null);
    }
  }, [open, initialListType]);

  if (!open) return null;

  const selectedType = AI_LIST_TYPES.find((t) => t.value === listType) || AI_LIST_TYPES[0];

  const filteredResults = (results || [])
    .filter((a) => !search || a.full_name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === 'desc'
      ? b.confidence_score - a.confidence_score
      : a.confidence_score - b.confidence_score
    );

  const handleExportCsv = () => {
    if (!results?.length) return;
    const headers = ['Rank','Athlete','Sport','Category','Gender','Age','Confidence Score (%)','Reason','Suggestion'];
    const rows = filteredResults.map((a, i) => [
      i + 1, a.full_name, a.sport_name, a.category_name, a.gender, a.age,
      a.confidence_score, `"${a.reason}"`, `"${a.improvement_suggestions}"`
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `AI_${listType}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    toast.success('CSV exported');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 pt-10" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-5xl rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-gradient-primary px-6 py-5 rounded-t-2xl">
          <span className="grid size-10 place-items-center rounded-xl bg-white/20">
            <Sparkles size={20} className="text-white" />
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">AI Generate Athlete List</h2>
            <p className="text-sm text-white/70">AI analyzes performance, fitness, attendance, rankings, and coach ratings</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* List Type Selector */}
          <div>
            <label className="field-label mb-3">Select List Type</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {AI_LIST_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setListType(t.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs font-medium transition-all
                    ${listType === t.value
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-secondary'
                    }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="field-label">Filter by Sport</label>
              <select
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Sports</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px]">
              <label className="field-label">Result Limit</label>
              <select
                value={resultLimit}
                onChange={(e) => setResultLimit(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {[10, 20, 30, 50].map((n) => <option key={n} value={n}>Top {n}</option>)}
              </select>
            </div>
            <Button
              leftIcon={Sparkles}
              loading={generating}
              onClick={handleGenerate}
              className="bg-gradient-primary text-white border-0"
            >
              {generating ? 'Analysing…' : 'Generate List'}
            </Button>
          </div>

          {/* Results */}
          {results !== null && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="section-title text-base">{selectedType?.icon} {selectedType?.label}</h3>
                  <Badge variant="primary">{filteredResults.length} athletes</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search results…"
                      className="h-8 rounded-lg border border-border bg-background pl-7 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
                  >
                    Score {sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                  </button>
                  <Button size="sm" variant="outline" leftIcon={Download} onClick={handleExportCsv}>
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Results Table */}
              {filteredResults.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <span className="text-4xl mb-3">📊</span>
                  <p className="text-sm text-muted-foreground">No athletes match the current criteria.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto">
                  {filteredResults.map((athlete, idx) => (
                    <div
                      key={athlete.id}
                      className="rounded-xl border border-border bg-background transition-all hover:border-primary/30"
                    >
                      {/* Collapsed Row */}
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === athlete.id ? null : athlete.id)}
                        className="flex w-full items-center gap-4 p-4 text-left"
                      >
                        <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${idx < 3 ? 'bg-gradient-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                          {idx + 1}
                        </span>
                        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                          {athlete.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-semibold text-sm text-foreground">{athlete.full_name}</p>
                          <p className="text-xs text-muted-foreground">{athlete.sport_name} · {athlete.category_name} · Age {athlete.age}</p>
                        </div>
                        <ConfidenceBar score={athlete.confidence_score} />
                        <ChevronDown
                          size={14}
                          className={`ml-2 text-muted-foreground transition-transform ${expandedId === athlete.id ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Expanded Details */}
                      {expandedId === athlete.id && (
                        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 animate-fade-in">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                              { label: 'Avg Performance', value: `${Number(athlete.avg_performance || 0).toFixed(1)}` },
                              { label: 'Avg Fitness', value: `${Number(athlete.avg_fitness || 0).toFixed(1)}` },
                              { label: 'Attendance', value: `${Number(athlete.attendance_rate || 0).toFixed(0)}%` },
                              { label: 'Coach Rating', value: `${Number(athlete.avg_coach_rating || 0).toFixed(1)}/5` },
                            ].map((stat) => (
                              <div key={stat.label} className="rounded-lg bg-secondary/50 p-3">
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className="mt-0.5 text-sm font-bold text-foreground">{stat.value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Reasoning</span>
                              <p className="mt-1 text-sm text-foreground">{athlete.reason}</p>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-success uppercase tracking-wide">Improvement Suggestions</span>
                              <p className="mt-1 text-sm text-foreground">{athlete.improvement_suggestions}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAthleteListModal;
