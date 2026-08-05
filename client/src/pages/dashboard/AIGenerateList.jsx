import React, { useState, useEffect } from 'react';
import { Brain, Filter, Download, Save, RefreshCcw, AlertTriangle, TrendingUp, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dashboardAPI from '../../services/dashboard.service';

const AIGenerateList = () => {
  const [listTypes, setListTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [filters, setFilters] = useState({
    listType: '',
    sportId: '',
    categoryId: '',
    gender: '',
    ageMin: '',
    ageMax: '',
  });

  useEffect(() => {
    dashboardAPI.getListTypes().then(res => setListTypes(res.data.listTypes || [])).catch(() => {});
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!filters.listType) {
      toast.error('Please select a list type');
      return;
    }
    
    setLoading(true);
    try {
      const payload = { ...filters };
      // clean up empty filters
      Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k] });
      
      const res = await dashboardAPI.generateAIList(payload);
      setResult(res.data);
      toast.success('List generated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to generate list');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    toast.success('Exporting to PDF... (Simulation)');
  };

  const handleExportExcel = () => {
    toast.success('Exporting to Excel... (Simulation)');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                <Brain className="text-blue-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold font-display">AI Selection Intelligence</h2>
            </div>
            <p className="text-blue-200 max-w-2xl">
              Generate intelligent athlete lists using advanced statistical analysis of performance, fitness, attendance, and consistency data.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
              <Filter size={18} className="text-gray-400" />
              <h3 className="font-semibold text-gray-800">Generation Parameters</h3>
            </div>

            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">List Type <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    className="input-field appearance-none"
                    value={filters.listType}
                    onChange={(e) => setFilters({...filters, listType: e.target.value})}
                  >
                    <option value="">-- Select List Type --</option>
                    {listTypes.map(t => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sport (Optional)</label>
                <select 
                  className="input-field"
                  value={filters.sportId}
                  onChange={(e) => setFilters({...filters, sportId: e.target.value})}
                >
                  <option value="">All Sports</option>
                  <option value="1">Athletics</option>
                  <option value="2">Swimming</option>
                  <option value="3">Football</option>
                  <option value="4">Cricket</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                <select 
                  className="input-field"
                  value={filters.gender}
                  onChange={(e) => setFilters({...filters, gender: e.target.value})}
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Age</label>
                  <input type="number" className="input-field" placeholder="10" 
                    value={filters.ageMin} onChange={(e) => setFilters({...filters, ageMin: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Age</label>
                  <input type="number" className="input-field" placeholder="40" 
                    value={filters.ageMax} onChange={(e) => setFilters({...filters, ageMax: e.target.value})} />
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
        <div className="lg:col-span-3">
          {!result && !loading ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Brain className="text-blue-500" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Analyze</h3>
              <p className="text-gray-500 max-w-sm">Select parameters on the left and click Generate to run the AI selection algorithms over athlete historical data.</p>
            </div>
          ) : loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 h-full min-h-[400px] flex flex-col items-center justify-center p-8">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                <Brain className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Analyzing Athlete Data...</h3>
              <p className="text-sm text-gray-500">Evaluating performance, fitness, and consistency records.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden fade-in">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-display">{result.listType}</h3>
                  <p className="text-sm text-gray-500 mt-1">Generated based on {result.algorithm} • {result.total} athletes found</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleExportPDF} className="btn-outline !py-2 !px-3 text-sm">
                    <Download size={16} /> PDF
                  </button>
                  <button onClick={handleExportExcel} className="btn-outline !py-2 !px-3 text-sm">
                    <Download size={16} /> Excel
                  </button>
                  <button className="btn-primary !py-2 !px-4 text-sm bg-slate-900 hover:bg-slate-800 border-none">
                    <Save size={16} /> Save List
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-gray-100">
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Rank</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Athlete</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Category</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase text-center">Score</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">AI Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {result.athletes.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-gray-500">
                          No athletes match the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      result.athletes.map((athlete) => (
                        <tr key={athlete.athleteId} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm">
                              #{athlete.rank}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                                {athlete.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{athlete.name}</p>
                                <p className="text-xs text-gray-500">{athlete.athleteCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm font-medium text-gray-900">{athlete.sport}</p>
                            <p className="text-xs text-gray-500">{athlete.category} • {athlete.gender}</p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className={`inline-flex flex-col items-center justify-center w-14 h-14 rounded-full border-4 ${athlete.selectionScore >= 80 ? 'border-green-500' : athlete.selectionScore >= 60 ? 'border-blue-500' : 'border-yellow-500'}`}>
                              <span className="font-bold text-gray-900">{athlete.selectionScore}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700">{athlete.reason}</p>
                              {athlete.activeInjuries > 0 && (
                                <p className="text-xs text-red-600 flex items-center gap-1 font-medium bg-red-50 inline-flex px-2 py-0.5 rounded">
                                  <AlertTriangle size={12} /> {athlete.activeInjuries} Active Injury
                                </p>
                              )}
                              <div className="flex gap-2 text-xs">
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">Perf: {athlete.performanceScore}</span>
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">Fit: {athlete.fitnessScore}</span>
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">Att: {athlete.attendanceScore}%</span>
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
