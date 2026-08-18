import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Medal,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { rankingService } from '../../services/rankingService';
import { sportService } from '../../services/sportService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const RankingDashboard = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [rankings, setRankings] = useState([]);
  const [sports, setSports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Filters: 1. Sport (dropdown), 2. Category (dropdown checkbox)
  const [sportId, setSportId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef(null);

  // Load available sports and categories
  useEffect(() => {
    Promise.all([
      sportService.listSports().catch(() => ({ data: [] })),
      sportService.listCategories({ limit: 100 }).catch(() => ({ data: [] })),
    ]).then(([sportRes, catRes]) => {
      setSports(sportRes.data || []);
      setCategories(catRes.data || []);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter available categories based on currently selected sport
  const visibleCategories = categories.filter((c) => {
    if (!sportId) return true;
    return String(c.sport_id) === String(sportId);
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        rankType: 'overall',
        sportId: sportId || undefined,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds.join(',') : undefined,
      };

      const rankRes = await rankingService.getRankings(params).catch(() => ({ data: { rankings: [] } }));
      const rawList = rankRes.data?.rankings || rankRes.data || [];

      // Deduplicate by athlete identifier (preserve highest score/most recent)
      const seen = new Set();
      const uniqueList = [];
      for (const item of rawList) {
        const key = item.athlete_id || item.athlete_code || `${item.first_name}_${item.last_name}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueList.push(item);
        }
      }

      // Sort by ranking score descending
      uniqueList.sort((a, b) => Number(b.ranking_score || 0) - Number(a.ranking_score || 0));

      // Compute ranks with tie-handling (equal score -> same rank, next rank skipped e.g. 1, 1, 3, 4)
      let currentRank = 1;
      const rankedList = uniqueList.map((r, idx) => {
        const score = Number(r.ranking_score || 0);
        if (idx > 0) {
          const prevScore = Number(uniqueList[idx - 1].ranking_score || 0);
          if (score < prevScore) {
            currentRank = idx + 1;
          }
        }
        return { ...r, rank_position: currentRank };
      });

      setRankings(rankedList);
    } catch (e) {
      toast.error('Failed to load rankings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sportId, selectedCategoryIds]);

  const handleSportChange = (newSportId) => {
    setSportId(newSportId);
    // Reset selected categories that are no longer valid for this sport
    if (newSportId) {
      setSelectedCategoryIds((prev) =>
        prev.filter((id) => categories.some((c) => c.id === id && String(c.sport_id) === String(newSportId)))
      );
    }
  };

  const handleToggleCategory = (catId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSelectAllCategories = () => {
    const allVisibleIds = visibleCategories.map((c) => c.id);
    setSelectedCategoryIds(allVisibleIds);
  };

  const handleClearCategories = () => {
    setSelectedCategoryIds([]);
  };

  // Quick preset filter (e.g. "U-17", "U-19", "Male", "Female")
  const handleApplyPreset = (filterKey) => {
    const isFemaleCategory = (c) => {
      const g = (c.gender || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      return g === 'female' || /\b(female|girls?|women|woman)\b/i.test(n);
    };

    const isMaleCategory = (c) => {
      if (isFemaleCategory(c)) return false;
      const g = (c.gender || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      return g === 'male' || /\b(male|boys?|men|man)\b/i.test(n);
    };

    let matched = [];
    if (filterKey === 'U-14') {
      matched = visibleCategories.filter((c) => /\bu[-/ ]?14\b/i.test(c.name || '') || (c.age_max && c.age_max <= 14));
    } else if (filterKey === 'U-17') {
      matched = visibleCategories.filter((c) => /\bu[-/ ]?17\b/i.test(c.name || '') || (c.age_max && c.age_max <= 17 && (!c.age_min || c.age_min >= 14)));
    } else if (filterKey === 'U-19') {
      matched = visibleCategories.filter((c) => /\bu[-/ ]?19\b/i.test(c.name || '') || (c.age_max && c.age_max <= 19 && (!c.age_min || c.age_min >= 17)));
    } else if (filterKey === 'Senior') {
      matched = visibleCategories.filter((c) => /\bsenior\b/i.test(c.name || '') || (c.age_min && c.age_min >= 19));
    } else if (filterKey === 'Male') {
      matched = visibleCategories.filter(isMaleCategory);
    } else if (filterKey === 'Female') {
      matched = visibleCategories.filter(isFemaleCategory);
    }
    const matchedIds = matched.map((c) => c.id);
    setSelectedCategoryIds(matchedIds);
  };

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      const res = await rankingService.calculate();
      toast.success(res.data.message || 'Rankings recalculated!');
      loadData();
    } catch (e) {
      toast.error('Failed to recalculate rankings.');
    } finally {
      setCalculating(false);
    }
  };

  // Category dropdown button label
  const getCategoryDropdownLabel = () => {
    if (selectedCategoryIds.length === 0) return 'All Categories';
    if (selectedCategoryIds.length === 1) {
      const cat = categories.find((c) => c.id === selectedCategoryIds[0]);
      return cat?.name || '1 Category Selected';
    }
    return `${selectedCategoryIds.length} Categories Selected`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academy Leaderboard & Rankings"
        subtitle="Auto-calculated rankings using formula: 50% Performance + 30% Fitness + 20% Consistency Score"
        action={
          role !== 'athlete' && (
            <Button size="sm" leftIcon={RefreshCw} loading={calculating} onClick={handleRecalculate}>
              Recalculate Rankings
            </Button>
          )
        }
      />

      {/* Filter Bar (Sports Dropdown & Category Multi-Select Checkbox Dropdown) */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={14} className="text-primary" /> Filter Rankings:
            </span>

            {/* 1. Sports Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sports-filter-select" className="text-xs font-medium text-muted-foreground">
                Sport:
              </label>
              <select
                id="sports-filter-select"
                value={sportId}
                onChange={(e) => handleSportChange(e.target.value)}
                className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground transition focus:border-primary focus:outline-none"
              >
                <option value="">All Sports</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Category Dropdown Checkbox */}
            <div className="relative" ref={categoryDropdownRef}>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Category:
                </label>
                <button
                  id="category-dropdown-btn"
                  type="button"
                  onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                  className={`inline-flex h-9 min-w-[200px] items-center justify-between gap-2 rounded-xl border px-3 text-xs font-medium transition ${
                    selectedCategoryIds.length > 0
                      ? 'border-primary/50 bg-primary/5 text-foreground'
                      : 'border-border bg-background text-foreground hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers size={13} className="text-primary shrink-0" />
                    <span className="truncate">{getCategoryDropdownLabel()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {selectedCategoryIds.length > 0 && (
                      <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {selectedCategoryIds.length}
                      </span>
                    )}
                    {categoryDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>
              </div>

              {/* Checkbox Dropdown Popover */}
              {categoryDropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl">
                  {/* Presets / Tags */}
                  <div className="mb-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Quick Presets
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {['U-14', 'U-17', 'U-19', 'Senior', 'Male', 'Female'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground transition hover:bg-primary/20 hover:text-primary"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center justify-between border-y border-border/50 py-2 text-xs">
                    <span className="font-semibold text-foreground">
                      Categories ({visibleCategories.length})
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllCategories}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-border">|</span>
                      <button
                        type="button"
                        onClick={handleClearCategories}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Checkbox List */}
                  <div className="mt-2 max-h-56 overflow-y-auto space-y-1 pr-1">
                    {visibleCategories.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        No categories found for this sport.
                      </p>
                    ) : (
                      visibleCategories.map((cat) => {
                        const checked = selectedCategoryIds.includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition cursor-pointer ${
                              checked ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-secondary'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleCategory(cat.id)}
                              className="size-3.5 rounded border-border text-primary focus:ring-primary"
                            />
                            <div className="flex-1 truncate">
                              <span className="truncate">{cat.name}</span>
                              <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                                {cat.gender ? `(${cat.gender})` : ''} {cat.age_min || cat.age_max ? `• ${cat.age_min || 0}-${cat.age_max || 'open'}y` : ''}
                              </span>
                            </div>
                            {checked && <Check size={13} className="text-primary shrink-0" />}
                          </label>
                        );
                      })
                    )}
                  </div>

                  {/* Footer button */}
                  <div className="mt-3 pt-2 border-t border-border/50 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="w-full text-xs h-7"
                    >
                      Apply Filter
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Clear All Filters Button if active */}
            {(sportId || selectedCategoryIds.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSportId('');
                  setSelectedCategoryIds([]);
                }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition underline ml-2"
              >
                <X size={12} /> Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Formula breakdown card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-xl bg-primary/10 p-3 border border-primary/20">
            <span className="font-black text-primary text-base">50%</span>
            <p className="font-semibold text-foreground mt-0.5">Performance Score</p>
            <p className="text-[11px] text-muted-foreground">Match & Metric averages</p>
          </div>
          <div className="rounded-xl bg-cyan-500/10 p-3 border border-cyan-500/20">
            <span className="font-black text-cyan-500 text-base">30%</span>
            <p className="font-semibold text-foreground mt-0.5">Fitness Score</p>
            <p className="text-[11px] text-muted-foreground">Strength, stamina & BMI</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/20">
            <span className="font-black text-amber-500 text-base">20%</span>
            <p className="font-semibold text-foreground mt-0.5">Consistency Score</p>
            <p className="text-[11px] text-muted-foreground">Attendance & discipline</p>
          </div>
        </div>
      </div>

      {/* Rankings Leaderboard Table */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : rankings.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground rounded-2xl border border-border bg-card">
          No rankings found for the selected sports / categories. Click 'Recalculate Rankings' or adjust filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                {['Rank', 'Athlete', 'Sport / Category', 'Perf (50%)', 'Fitness (30%)', 'Consistency (20%)', 'Overall Score', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rankings.map((r, idx) => (
                <tr key={idx} className="hover:bg-secondary/30 transition">
                  <td className="px-4 py-3 font-black text-lg">
                    {r.rank_position === 1 ? (
                      <span className="text-amber-500 flex items-center gap-1"><Trophy size={16} /> #1</span>
                    ) : r.rank_position === 2 ? (
                      <span className="text-slate-400 flex items-center gap-1"><Medal size={16} /> #2</span>
                    ) : r.rank_position === 3 ? (
                      <span className="text-amber-700 flex items-center gap-1"><Medal size={16} /> #3</span>
                    ) : (
                      `#${r.rank_position}`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground">{r.first_name} {r.last_name}</div>
                    <div className="text-[11px] text-muted-foreground">{r.athlete_code}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{r.sport || 'General'}</div>
                    <div className="text-[10px]">{r.category || 'Open'}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">{r.performance_score || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-cyan-500">{r.fitness_score || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-amber-500">{r.consistency_score || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20">
                      {r.ranking_score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.medical_status === 'fit' ? 'success' : 'danger'}>
                      {r.medical_status || 'Active'}
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

export default RankingDashboard;
