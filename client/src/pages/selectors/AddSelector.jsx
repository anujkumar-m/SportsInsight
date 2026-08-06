// ─── pages/selectors/AddSelector.jsx ──────────────────────────────
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectorService } from '../../services/selectorService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const FormSection = ({ title, children }) => (
  <div className="ui-card p-6 space-y-4">
    <h3 className="section-title text-base border-b border-border pb-3">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="field-label">
      {label}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
    {children}
    {error && <p className="field-error">{error}</p>}
  </div>
);

const inputCls = 'h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow';

const AddSelector = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    designation: '', organization: '', sport_expertise: '', years_experience: '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required';
    if (!form.last_name.trim()) e.last_name = 'Last name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await selectorService.create(form);
      toast.success(`Selector created! Code: ${result.data?.selector_code}`);
      navigate('/selectors');
    } catch (err) {
      toast.error(err?.message || 'Failed to create selector');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in space-y-5">
      <PageHeader
        title="Add Selector"
        subtitle="Register a new selection committee member."
        breadcrumb="Selectors"
        actions={
          <Button variant="outline" size="sm" leftIcon={ChevronLeft} onClick={() => navigate('/selectors')}>
            Back to List
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection title="Personal Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First Name" required error={errors.first_name}>
              <input className={inputCls} placeholder="First name" value={form.first_name} onChange={set('first_name')} />
            </Field>
            <Field label="Last Name" required error={errors.last_name}>
              <input className={inputCls} placeholder="Last name" value={form.last_name} onChange={set('last_name')} />
            </Field>
            <Field label="Email" required error={errors.email}>
              <input type="email" className={inputCls} placeholder="selector@email.com" value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Phone">
              <input className={inputCls} placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Professional Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Designation">
              <input className={inputCls} placeholder="e.g. Chief Selector, Technical Director" value={form.designation} onChange={set('designation')} />
            </Field>
            <Field label="Organization">
              <input className={inputCls} placeholder="e.g. State Sports Association" value={form.organization} onChange={set('organization')} />
            </Field>
            <Field label="Sport Expertise">
              <input className={inputCls} placeholder="e.g. Football, Athletics" value={form.sport_expertise} onChange={set('sport_expertise')} />
            </Field>
            <Field label="Experience (Years)">
              <input type="number" className={inputCls} placeholder="10" value={form.years_experience} onChange={set('years_experience')} />
            </Field>
          </div>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/selectors')}>Cancel</Button>
          <Button type="submit" leftIcon={UserPlus} loading={loading}>Create Selector</Button>
        </div>
      </form>
    </div>
  );
};

export default AddSelector;
