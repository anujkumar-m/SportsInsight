// ─── pages/selectors/EditSelector.jsx ──────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ChevronLeft, User, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectorService } from '../../services/selectorService';
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

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    designation: '', organization: '', sport_expertise: '', years_experience: '',
    is_active: 1
  });

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
            sport_expertise: data.sport_expertise || '',
            years_experience: data.years_experience ?? '',
            is_active: data.is_active ?? 1,
          });
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

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required';
    if (!form.last_name.trim()) e.last_name = 'Last name is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
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

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Edit Selector"
        subtitle="Update selector details and assignments."
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
            <Field label="Sport Expertise">
              <input className={inputCls()} placeholder="e.g. Football, Athletics" value={form.sport_expertise} onChange={set('sport_expertise')} />
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
