import React, { useState } from 'react';
import { X, CheckCircle, Brain, Activity, Heart, Calendar, GitCompare, FileText, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

const QuickActionModal = ({ isOpen, onClose, title, type, data }) => {
  const [formData, setFormData] = useState({
    athleteId: '',
    metricName: '',
    metricValue: '',
    metricUnit: '',
    score: '',
    status: 'present',
    notes: '',
    athlete1Id: '',
    athlete2Id: '',
    listName: '',
    selectionType: 'State Selection',
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success(`${title} processed successfully!`);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
      <div className="bg-card rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-border relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-blue-50 text-secondary rounded-xl flex-shrink-0">
              {type === 'performance' && <Activity size={20} />}
              {type === 'fitness' && <Heart size={20} />}
              {type === 'attendance' && <Calendar size={20} />}
              {type === 'compare' && <GitCompare size={20} />}
              {type === 'report' && <FileText size={20} />}
              {type === 'user' && <UserPlus size={20} />}
              {type === 'selection' && <Brain size={20} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-h3 text-text truncate">{title}</h3>
              <p className="text-caption text-muted">Quick entry form</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted hover:text-text rounded-xl hover:bg-surface transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content depending on action type */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'performance' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Athlete</label>
                <select
                  required
                  className="input-field"
                  value={formData.athleteId}
                  onChange={(e) => setFormData({ ...formData, athleteId: e.target.value })}
                >
                  <option value="">-- Choose Athlete --</option>
                  <option value="1">Arjun Nair (ATH-2024-001)</option>
                  <option value="2">Sneha Patel (ATH-2024-002)</option>
                  <option value="3">Rohit Sharma (ATH-2024-003)</option>
                  <option value="5">Kiran Rao (ATH-2024-005)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Metric Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100m Sprint, Shuttle Run, Goals"
                  className="input-field"
                  value={formData.metricName}
                  onChange={(e) => setFormData({ ...formData, metricName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Metric Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="10.85"
                    className="input-field"
                    value={formData.metricValue}
                    onChange={(e) => setFormData({ ...formData, metricValue: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="seconds, meters, count"
                    className="input-field"
                    value={formData.metricUnit}
                    onChange={(e) => setFormData({ ...formData, metricUnit: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Calculated Score (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="85.5"
                  className="input-field"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                />
              </div>
            </>
          )}

          {type === 'fitness' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Athlete</label>
                <select
                  required
                  className="input-field"
                  value={formData.athleteId}
                  onChange={(e) => setFormData({ ...formData, athleteId: e.target.value })}
                >
                  <option value="">-- Choose Athlete --</option>
                  <option value="1">Arjun Nair (ATH-2024-001)</option>
                  <option value="2">Sneha Patel (ATH-2024-002)</option>
                  <option value="3">Rohit Sharma (ATH-2024-003)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Strength (0-100)</label>
                  <input type="number" min="0" max="100" placeholder="80" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Endurance (0-100)</label>
                  <input type="number" min="0" max="100" placeholder="85" className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Stamina (0-100)</label>
                  <input type="number" min="0" max="100" placeholder="82" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Agility (0-100)</label>
                  <input type="number" min="0" max="100" placeholder="88" className="input-field" />
                </div>
              </div>
            </>
          )}

          {type === 'attendance' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Athlete</label>
                <select
                  required
                  className="input-field"
                  value={formData.athleteId}
                  onChange={(e) => setFormData({ ...formData, athleteId: e.target.value })}
                >
                  <option value="">-- Choose Athlete --</option>
                  <option value="1">Arjun Nair (ATH-2024-001)</option>
                  <option value="2">Sneha Patel (ATH-2024-002)</option>
                  <option value="3">Rohit Sharma (ATH-2024-003)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Attendance Status</label>
                <select
                  className="input-field"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Optional remarks"
                  className="input-field"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </>
          )}

          {type === 'compare' && (
            <>
              <p className="text-xs text-gray-500 mb-3">Select two athletes to compare performance metrics, fitness levels, and AI selection compatibility side by side.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Athlete 1</label>
                  <select required className="input-field" value={formData.athlete1Id} onChange={(e) => setFormData({...formData, athlete1Id: e.target.value})}>
                    <option value="">Select Athlete 1</option>
                    <option value="1">Arjun Nair (Sprint)</option>
                    <option value="2">Sneha Patel (Swim)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Athlete 2</label>
                  <select required className="input-field" value={formData.athlete2Id} onChange={(e) => setFormData({...formData, athlete2Id: e.target.value})}>
                    <option value="">Select Athlete 2</option>
                    <option value="3">Rohit Sharma (Track)</option>
                    <option value="5">Kiran Rao (Football)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {type === 'selection' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Selection Trial / Camp</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Championship Selection 2026"
                  className="input-field"
                  value={formData.listName}
                  onChange={(e) => setFormData({ ...formData, listName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Selection Level</label>
                <select
                  className="input-field"
                  value={formData.selectionType}
                  onChange={(e) => setFormData({ ...formData, selectionType: e.target.value })}
                >
                  <option value="State Selection">State Selection</option>
                  <option value="National Camp">National Camp</option>
                  <option value="Academy Ranking List">Academy Ranking List</option>
                </select>
              </div>
            </>
          )}

          {(type === 'user' || type === 'report') && (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                This quick action will navigate to the full management module for {title}.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Processing...' : 'Submit Quick Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickActionModal;
