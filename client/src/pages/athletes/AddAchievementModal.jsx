// ─── pages/athletes/AddAchievementModal.jsx ─────────────
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, X, Calendar, Award, Medal, MapPin, User, Activity, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import { sportService } from '../../services/sportService';
import Button from '../../components/ui/Button';

const COMPETITION_LEVELS = [
  { value: 'zonal', label: 'Zonal' },
  { value: 'district', label: 'District' },
  { value: 'division', label: 'Division' },
  { value: 'state', label: 'State' },
  { value: 'national', label: 'National' },
  { value: 'international', label: 'International' },
  { value: 'academy', label: 'Academy / Club' },
];

const STANDARD_POSITIONS = [
  '1st Place (Gold Medal)',
  '2nd Place (Silver Medal)',
  '3rd Place (Bronze Medal)',
  '4th Place',
  'Finalist',
  'Semi-Finalist',
  'Quarter-Finalist',
  'Winner / Champion',
  'Runner-Up',
  'MVP / Best Player',
  'Participant',
];

const AWARD_TYPES = [
  { value: 'medal', label: 'Medal (Gold / Silver / Bronze)' },
  { value: 'trophy', label: 'Trophy / Cup' },
  { value: 'certificate', label: 'Certificate / Citation' },
  { value: 'award', label: 'Special Award / MVP' },
  { value: 'record', label: 'State / National Record' },
  { value: 'other', label: 'Other Distinction' },
];

const AddAchievementModal = ({ isOpen, onClose, athlete = null, athletes = [], onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [sports, setSports] = useState([]);
  const [athletesList, setAthletesList] = useState([]);
  const [customPosition, setCustomPosition] = useState(false);

  const [formData, setFormData] = useState({
    athlete_id: athlete?.id || '',
    event_name: '',
    title: '',
    achievement_date: new Date().toISOString().split('T')[0],
    sport_id: athlete?.sport_id || '',
    level: 'district',
    position: '1st Place (Gold Medal)',
    custom_position: '',
    achievement_type: 'medal',
    description: '',
  });

  // Sync athlete prop changes
  useEffect(() => {
    if (athlete) {
      setFormData((prev) => ({
        ...prev,
        athlete_id: athlete.id || '',
        sport_id: athlete.sport_id || prev.sport_id || '',
      }));
    }
  }, [athlete]);

  // Load sports and athletes list if needed
  useEffect(() => {
    if (!isOpen) return;

    // Load sports safely
    sportService.listSports({ limit: 100 })
      .then((res) => {
        const raw = res?.data?.data || res?.data || [];
        setSports(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setSports([]));

    // Load athletes list if not supplied via props and no single athlete locked
    if (!athlete && (!Array.isArray(athletes) || athletes.length === 0)) {
      athleteService.list({ limit: 200 })
        .then((res) => {
          const raw = res?.data?.data || res?.data || [];
          setAthletesList(Array.isArray(raw) ? raw : []);
        })
        .catch(() => setAthletesList([]));
    } else if (Array.isArray(athletes) && athletes.length > 0) {
      setAthletesList(athletes);
    }
  }, [isOpen, athlete, athletes]);

  // Safe athlete name & initials
  const athleteDisplayName = useMemo(() => {
    if (!athlete) return '';
    return athlete.full_name?.trim() || `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Athlete';
  }, [athlete]);

  const athleteInitials = useMemo(() => {
    if (!athleteDisplayName) return 'A';
    return athleteDisplayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'A';
  }, [athleteDisplayName]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'athlete_id') {
        const found = athletesList.find((a) => String(a.id) === String(value));
        if (found?.sport_id) {
          updated.sport_id = found.sport_id;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.athlete_id) {
      toast.error('Please select an athlete');
      return;
    }
    if (!formData.event_name.trim()) {
      toast.error('Please enter the event / competition name');
      return;
    }

    setLoading(true);
    try {
      const finalPosition = customPosition ? formData.custom_position.trim() : formData.position;
      const payload = {
        athlete_id: Number(formData.athlete_id),
        event_name: formData.event_name.trim(),
        competition_name: formData.event_name.trim(),
        title: formData.title.trim() || `${finalPosition || 'Winner'} - ${formData.event_name.trim()}`,
        achievement_date: formData.achievement_date || new Date().toISOString().split('T')[0],
        sport_id: formData.sport_id ? Number(formData.sport_id) : null,
        level: formData.level || 'district',
        position: finalPosition || 'Winner',
        achievement_type: formData.achievement_type || 'medal',
        description: formData.description.trim(),
      };

      await athleteService.addAchievement(payload);
      toast.success('Achievement recorded successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to record achievement');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-500">
              <Trophy size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Record Athlete Achievement</h3>
              <p className="text-xs text-muted-foreground">Log tournament medals, titles, records, and podium placements.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Athlete Selection (if not locked) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Athlete <span className="text-destructive">*</span>
            </label>
            {athlete ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                  {athleteInitials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{athleteDisplayName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {athlete.athlete_code || 'ATH'} • {athlete.sport_name || 'Sport'}
                  </p>
                </div>
              </div>
            ) : (
              <select
                name="athlete_id"
                value={formData.athlete_id}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- Select Athlete --</option>
                {athletesList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Athlete'} ({a.athlete_code || 'ATH'}) {a.sport_name ? `- ${a.sport_name}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Event / Competition Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Event / Competition Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              name="event_name"
              value={formData.event_name}
              onChange={handleChange}
              placeholder="e.g. State Youth Athletics Championship 2026"
              required
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Title / Discipline & Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Achievement Title / Discipline
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. 100m Sprint Gold / Singles Winner"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Date of Achievement <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                name="achievement_date"
                value={formData.achievement_date}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Sport & Category / Level */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Sport
              </label>
              <select
                name="sport_id"
                value={formData.sport_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- Match Athlete Sport --</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Competition Category / Level <span className="text-destructive">*</span>
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {COMPETITION_LEVELS.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Position / Rank */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Position / Podium Placement <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() => setCustomPosition(!customPosition)}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                {customPosition ? 'Choose from list' : '+ Enter custom position'}
              </button>
            </div>

            {customPosition ? (
              <input
                type="text"
                name="custom_position"
                value={formData.custom_position}
                onChange={handleChange}
                placeholder="e.g. 1st Place / Gold Medal, 5th in Heats, MVP"
                required
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {STANDARD_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            )}
          </div>

          {/* Award Type & Remarks */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Award Type
              </label>
              <select
                name="achievement_type"
                value={formData.achievement_type}
                onChange={handleChange}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {AWARD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Remarks / Description (Optional)
              </label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Additional notes, timing record, score breakdown..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" leftIcon={Trophy} loading={loading}>
              Save Achievement
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddAchievementModal;
