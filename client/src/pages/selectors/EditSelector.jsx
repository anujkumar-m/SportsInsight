// ─── pages/selectors/EditSelector.jsx ──────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ChevronLeft, User, Award, ChevronDown, Check, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectorService } from '../../services/selectorService';
import { sportService } from '../../services/sportService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const FormSection = ({ title, icon: Icon, children }) => (
  <div className="ui-card p-6 space-y-5">
    <div className="flex items-center gap-2 border-b border-border pb-3">
      {Icon && <Icon className="size-5 text-primary" />}
      <h3 className="section-title text-base font-bold">{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, required, error, children }) => (
  <div className="space-y-1.5">
    <label className="field-label">
      {label}
      {required && <span className="ml-1 text-destructive font-bold">*</span>}
    </label>
    {children}
    {error && <p className="field-error flex items-center gap-1">{error}</p>}
  </div>
);

const inputCls = (error) =>
  `input-field ${error ? '!border-destructive focus:!ring-destructive/20' : ''}`;
const selectCls = (error) => `${inputCls(error)} cursor-pointer`;

const EditSelector = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [sports, setSports] = useState([]);
  const [selectedSportIds, setSelectedSportIds] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchSport, setSearchSport] = useState('');
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    designation: '', organization: '', years_experience: '',
    is_active: 1
  });

  useEffect(() => {
    sportService.listSports({ limit: 100 })
      .then((res) => {
        const list = res.data?.data || res.data?.sports || res.data || [];
        setSports(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSelector = async () => {
      try {
        const res = await selectorService.getById(id);
        const data = res.data;
        if (data) {
          setForm({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            phone: data.phone || '',
            designation: data.designation || '',
            organization: data.organization || '',
            years_experience: data.years_experience ?? '',
            is_active: data.is_active ?? 1,
          });

          if (Array.isArray(data.sports) && data.sports.length > 0) {
            setSelectedSportIds(data.sports.map((s) => s.sport_id || s.id));
          } else if (data.sport_expertise) {
            const expNames = data.sport_expertise.split(',').map((s) => s.trim().toLowerCase());
            sportService.listSports({ limit: 100 }).then((sRes) => {
              const all = sRes.data?.data || sRes.data || [];
              const matched = all.filter((s) => expNames.includes(s.name?.toLowerCase())).map((s) => s.id);
              if (matched.length > 0) setSelectedSportIds(matched);
            }).catch(() => {});
          }
        }
      } catch (err) {
        toast.error('Failed to load selector details');
        navigate('/selectors');
      } finally {
        setLoading(false);
      }
    };
    fetchSelector();
  }, [id, navigate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleSport = (sportId) => {
    setSelectedSportIds((prev) =>
      prev.includes(sportId) ? prev.filter((sId) => sId !== sportId) : [...prev, sportId]
    );
  };

  const selectAllSports = () => {
    setSelectedSportIds(sports.map((s) => s.id));
  };

  const clearAllSports = () => {
    setSelectedSportIds([]);
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required';
    if (!form.last_name.trim()) e.last_name = 'Last name is required';
    if (selectedSportIds.length === 0) e.sport_expertise = 'Please select at least one sport expertise';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const selectedSportNames = sports
        .filter((s) => selectedSportIds.includes(s.id))
        .map((s) => s.name)
        .join(', ');

      const payload = {
        ...form,
        sport_ids: selectedSportIds,
        sport_expertise: selectedSportNames,
      };
      if (payload.years_experience === '') payload.years_experience = null;

      await selectorService.update(id, payload);
      toast.success('Selector updated successfully');
      navigate(`/selectors/${id}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to update selector');
    } finally {
      setSaving(false);
    }
  };

  const filteredSports = sports.filter((s) =>
    s.name.toLowerCase().includes(searchSport.toLowerCase())
  );

  const selectedSportObjects = sports.filter((s) => selectedSportIds.includes(s.id));

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="fade-in space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Edit Selector"
        subtitle="Update selector details and assigned sport expertise."
        breadcrumb="Selectors"
        actions={
          <Button variant="outline" size="sm" leftIcon={ChevronLeft} onClick={() => navigate('/selectors')}>
            Back to List
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Personal Information" icon={User}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="First Name" required error={errors.first_name}>
              <input className={inputCls(errors.first_name)} placeholder="First name" value={form.first_name} onChange={set('first_name')} />
            </Field>
            <Field label="Last Name" required error={errors.last_name}>
              <input className={inputCls(errors.last_name)} placeholder="Last name" value={form.last_name} onChange={set('last_name')} />
            </Field>
            <Field label="Phone">
              <input className={inputCls()} placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Professional Details" icon={Award}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Designation">
              <input className={inputCls()} placeholder="e.g. Chief Selector, Technical Director" value={form.designation} onChange={set('designation')} />
            </Field>
            <Field label="Organization">
              <input className={inputCls()} placeholder="e.g. State Sports Association" value={form.organization} onChange={set('organization')} />
            </Field>
            <Field label="Experience (Years)">
              <input type="number" className={inputCls()} placeholder="10" value={form.years_experience} onChange={set('years_experience')} />
            </Field>
            <Field label="Status">
              <select className={selectCls()} value={form.is_active} onChange={set('is_active')}>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </Field>

            {/* Sports Expertise Dropdown with Checkbox List */}
            <div className="sm:col-span-2 lg:col-span-3 space-y-1.5" ref={dropdownRef}>
              <label className="field-label">
                Sports Expertise (Assigned Sports)
                <span className="ml-1 text-destructive font-bold">*</span>
                <span className="text-[11px] font-normal text-muted-foreground ml-2">
                  (Only athletes of the selected sports will be shown to this selector)
                </span>
              </label>

              <div className="relative">
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border bg-background text-left flex items-center justify-between gap-2 transition-all ${
                    errors.sport_expertise
                      ? 'border-destructive focus:ring-2 focus:ring-destructive/20'
                      : dropdownOpen
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
                    {selectedSportObjects.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Select sports expertise...</span>
                    ) : (
                      selectedSportObjects.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20"
                        >
                          {s.name}
                          <span
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSport(s.id);
                            }}
                            className="hover:text-destructive transition-colors ml-0.5"
                          >
                            <X size={12} />
                          </span>
                        </span>
                      ))
                    )}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-border bg-card shadow-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    {/* Search & Bulk Action Bar */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search sports..."
                          value={searchSport}
                          onChange={(e) => setSearchSport(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={selectAllSports}
                        className="px-2 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={clearAllSports}
                        className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
                      >
                        Clear
                      </button>
                    </div>

                    {/* Checkbox List */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-border/40 pr-1 space-y-0.5">
                      {filteredSports.length === 0 ? (
                        <div className="py-4 text-center text-xs text-muted-foreground">No sports found.</div>
                      ) : (
                        filteredSports.map((sport) => {
                          const isSelected = selectedSportIds.includes(sport.id);
                          return (
                            <label
                              key={sport.id}
                              className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-secondary/60 text-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSport(sport.id)}
                                  className="size-4 rounded border-border text-primary focus:ring-primary/20"
                                />
                                <span className="text-xs font-semibold">{sport.name}</span>
                              </div>
                              {isSelected && <Check size={14} className="text-primary shrink-0" />}
                            </label>
                          );
                        })
                      )}
                    </div>

                    {/* Footer Summary */}
                    <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground px-1">
                      <span>{selectedSportIds.length} of {sports.length} selected</span>
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(false)}
                        className="font-bold text-primary hover:underline"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {errors.sport_expertise && (
                <p className="field-error flex items-center gap-1">{errors.sport_expertise}</p>
              )}
            </div>
          </div>
        </FormSection>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" type="button" onClick={() => navigate('/selectors')}>Cancel</Button>
          <Button type="submit" leftIcon={Save} loading={saving}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default EditSelector;
