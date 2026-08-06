// ─── pages/coaches/AddCoach.jsx ──────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { coachService } from '../../services/coachService';
import { sportService } from '../../services/sportService';
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
const selectCls = `${inputCls} cursor-pointer`;

const AddCoach = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [sports, setSports] = useState([]);

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    sport_id: '', qualification: '', experience_years: '', specialization: '',
    date_of_birth: '', gender: 'male', address: '', joining_date: '',
  });

  useEffect(() => {
    sportService.listSports({ limit: 100 }).then((r) => setSports(r.data || [])).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required';
    if (!form.last_name.trim()) e.last_name = 'Last name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (!form.sport_id) e.sport_id = 'Sport is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await coachService.create(form);
      toast.success(`Coach created! Code: ${result.data?.coach_code}`);
      navigate('/coaches');
    } catch (err) {
      toast.error(err?.message || 'Failed to create coach');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in space-y-5">
      <PageHeader
        title="Add Coach"
        subtitle="Register a new coach to the academy."
        breadcrumb="Coaches"
        actions={
          <Button variant="outline" size="sm" leftIcon={ChevronLeft} onClick={() => navigate('/coaches')}>
            Back to List
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection title="Personal Information">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="First Name" required error={errors.first_name}>
              <input className={inputCls} placeholder="First name" value={form.first_name} onChange={set('first_name')} />
            </Field>
            <Field label="Last Name" required error={errors.last_name}>
              <input className={inputCls} placeholder="Last name" value={form.last_name} onChange={set('last_name')} />
            </Field>
            <Field label="Email" required error={errors.email}>
              <input type="email" className={inputCls} placeholder="coach@email.com" value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Phone">
              <input className={inputCls} placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="Date of Birth">
              <input type="date" className={inputCls} value={form.date_of_birth} onChange={set('date_of_birth')} />
            </Field>
            <Field label="Gender">
              <select className={selectCls} value={form.gender} onChange={set('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
        </FormSection>

        <FormSection title="Professional Details">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Sport" required error={errors.sport_id}>
              <select className={selectCls} value={form.sport_id} onChange={set('sport_id')}>
                <option value="">Select Sport</option>
                {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Qualification">
              <input className={inputCls} placeholder="e.g. NIS Diploma, AFC License" value={form.qualification} onChange={set('qualification')} />
            </Field>
            <Field label="Specialization">
              <input className={inputCls} placeholder="e.g. Strength & Conditioning" value={form.specialization} onChange={set('specialization')} />
            </Field>
            <Field label="Experience (Years)">
              <input type="number" className={inputCls} placeholder="5" value={form.experience_years} onChange={set('experience_years')} />
            </Field>
            <Field label="Joining Date">
              <input type="date" className={inputCls} value={form.joining_date} onChange={set('joining_date')} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Address">
          <Field label="Full Address">
            <textarea className={`${inputCls} h-20 py-2`} placeholder="Residential address" value={form.address} onChange={set('address')} />
          </Field>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/coaches')}>Cancel</Button>
          <Button type="submit" leftIcon={UserPlus} loading={loading}>Create Coach</Button>
        </div>
      </form>
    </div>
  );
};

export default AddCoach;
