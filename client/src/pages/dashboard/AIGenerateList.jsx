import React, { useState, useEffect } from 'react';
import { Brain, Filter, Download, Save, RefreshCcw, AlertTriangle, ChevronDown, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dashboardAPI from '../../services/dashboard.service';

const AIGenerateList = () => {
  const [listTypes, setListTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    listType: '',
    sportId: '',
    categoryId: '',
    gender: '',
    ageMin: '',
    ageMax: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    dashboardAPI.getListTypes()
      .then((res) => setListTypes(res?.data?.listTypes || res?.listTypes || []))
      .catch(() => {});
  }, []);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!filters.listType) {
      toast.error('Please select a list type');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...filters };
      Object.keys(payload).forEach((k) => {
        if (!payload[k]) delete payload[k];
      });

      const res = await dashboardAPI.generateAIList(payload);
      setResult(res?.data || res);
      toast.success('AI Athlete List generated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate list');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveList = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const payload = { ...filters, save: true };
      const res = await dashboardAPI.generateAIList(payload);
      toast.success('Generated List saved to Academy History!');
    } catch (err) {
      toast.error('Failed to save list');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (!result || !result.athletes || result.athletes.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Rank',
      'Athlete Code',
      'Name',
      'Sport',
      'Category',
      'Age',
      'Gender',
      'Coach',
      'Performance Score',
      'Fitness Score',
      'Attendance Score (%)',
      'Selection Score',
      'Confidence Score (%)',
      'Reason',
      'Suggested Improvement',
    ];

    const rows = result.athletes.map((a) => [
      a.rank,
      `"${a.athleteCode}"`,
      `"${a.name}"`,
      `"${a.sport}"`,
      `"${a.category}"`,
      a.age,
      a.gender,
      `"${a.coach}"`,
      a.performanceScore,
      a.fitnessScore,
      a.attendanceScore,
      a.selectionScore,
      a.confidenceScore,
      `"${a.reason}"`,
      `"${a.suggestedImprovement}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${result.listType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Excel/CSV export downloaded!');
  };

  const handleExportPDF = () => {
    if (!result || !result.athletes || result.athletes.length === 0) {
      toast.error('No data to export');
      return;
    }

    window.print();
  };

  return (
    <div className="page-shell">
      <div className="ui-card card-section fade-in border-l-4" style={{ borderLeftColor: '#2563EB' }}>
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-50 text-brand rounded-lg flex-shrink-0">
            <Brain size={22} />
          </div>
          <div>
            <h2 className="section-title mb-1">AI Selection & Ranking Intelligence</h2>
            <p className="text-small text-muted max-w-2xl">
              Generate intelligent athlete lists using weighted analysis of performance, fitness, attendance, coach ratings, and injury history.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="lg:col-span-1">
          <div className="ui-card card-section">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
              <Filter size={18} className="text-muted" />
              <h3 className="card-title">Generation Parameters</h3>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  List Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="input-field appearance-none"
                    value={filters.listType}
                    onChange={(e) => setFilters({ ...filters, listType: e.target.value })}
                  >
                    <option value="">-- Select List Type --</option>
                    {listTypes.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Sport</label>
                <select
                  className="input-field"
                  value={filters.sportId}
                  onChange={(e) => setFilters({ ...filters, sportId: e.target.value })}
                >
                  <option value="">All Sports</option>
                  <option value="1">Athletics</option>
                  <option value="2">Swimming</option>
                  <option value="3">Football</option>
                  <option value="4">Cricket</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Gender</label>
                <select
                  className="input-field"
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Min Age</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="10"
                    value={filters.ageMin}
                    onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Max Age</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="40"
                    value={filters.ageMax}
                    onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Date From</label>
                  <input
                    type="date"
                    className="input-field text-xs"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Date To</label>
                  <input
                    type="date"
                    className="input-field text-xs"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !filters.listType}
                className="w-full btn-primary mt-4"
              >
                {loading ? <RefreshCcw className="animate-spin" size={18} /> : <Brain size={18} />}
                {loading ? 'Processing Data...' : 'Generate List'}
              </button>
            </form>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 min-w-0">
          {!result && !loading ? (
            <div className="card border-dashed h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
              <div className="empty-state-icon mb-4" style={{ width: 64, height: 64 }}>
                <Brain className="text-secondary" size={28} />
              </div>
              <h3 className="text-h3 text-text mb-2">Ready to Analyze</h3>
              <p className="text-body text-muted max-w-sm">
                Select list parameters on the left and click Generate List to evaluate historical data using weighted statistical intelligence.
              </p>
            </div>
          ) : loading ? (
            <div className="card h-full min-h-[400px] flex flex-col items-center justify-center p-8">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-secondary rounded-full border-t-transparent animate-spin" />
                <Brain className="absolute inset-0 m-auto text-secondary animate-pulse" size={32} />
              </div>
              <h3 className="text-h3 text-text mb-2">Analyzing Athlete Records...</h3>
              <p className="text-body text-muted">Evaluating performance, fitness scores, attendance, and consistency.</p>
            </div>
          ) : (
            <div className="card overflow-hidden fade-in">
              <div className="p-4 sm:p-6 border-b border-border flex flex-wrap items-center justify-between gap-4 bg-surface">
                <div>
                  <h3 className="text-h3 text-text">{result.listType}</h3>
                  <p className="text-caption text-muted mt-1">
                    Algorithm: {result.algorithm} • Total: {result.total} Athletes
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={handleExportPDF} className="btn-outline !h-9 !px-3 !text-caption">
                    <Download size={14} /> PDF / Print
                  </button>
                  <button type="button" onClick={handleExportCSV} className="btn-outline !h-9 !px-3 !text-caption">
                    <Download size={14} /> Excel (CSV)
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveList}
                    disabled={saving}
                    className="btn-primary !h-9 !px-4 !text-caption"
                    style={{ background: '#0F172A' }}
                  >
                    <Save size={14} /> {saving ? 'Saving...' : 'Save List History'}
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Athlete</th>
                      <th>Sport / Category</th>
                      <th className="text-center">Selection Score</th>
                      <th>AI Analysis & Suggestion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.athletes.length === 0 ? (
                      <tr>
                        <td colSpan="5">
                          <div className="empty-state py-12">
                            <p className="empty-state-desc">No athletes match the selected criteria.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      result.athletes.map((athlete) => (
                        <tr key={athlete.athleteId}>
                          <td>
                            <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-caption">
                              #{athlete.rank}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-100 text-secondary font-bold flex items-center justify-center text-caption">
                                {athlete.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-text text-body">{athlete.name}</p>
                                <p className="text-caption text-muted">{athlete.athleteCode}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="text-body font-medium text-gray-800">{athlete.sport}</p>
                            <p className="text-caption text-muted">{athlete.category} • {athlete.gender}</p>
                          </td>
                          <td className="text-center">
                            <div
                              className={`inline-flex flex-col items-center justify-center w-12 h-12 rounded-full border-4 ${
                                athlete.selectionScore >= 80
                                  ? 'border-emerald-500 text-emerald-700'
                                  : athlete.selectionScore >= 60
                                  ? 'border-blue-500 text-blue-700'
                                  : 'border-amber-500 text-amber-700'
                              }`}
                            >
                              <span className="font-bold text-caption">{athlete.selectionScore}</span>
                            </div>
                            <p className="text-[10px] text-muted mt-1">{athlete.confidenceScore}% Conf.</p>
                          </td>
                          <td>
                            <div className="space-y-1.5">
                              <p className="text-caption text-gray-700 font-medium">{athlete.reason}</p>
                              <p className="text-caption text-muted bg-surface p-2 rounded-lg border border-border">
                                <span className="font-semibold">AI Suggestion:</span> {athlete.suggestedImprovement}
                              </p>
                              {athlete.activeInjuries > 0 && (
                                <p className="text-[11px] text-danger flex items-center gap-1 font-medium bg-red-50 inline-flex px-2 py-0.5 rounded">
                                  <AlertTriangle size={12} /> {athlete.activeInjuries} Active Injury
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 text-[11px] pt-0.5">
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Perf: {athlete.performanceScore}</span>
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Fit: {athlete.fitnessScore}</span>
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Att: {athlete.attendanceScore}%</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIGenerateList;
