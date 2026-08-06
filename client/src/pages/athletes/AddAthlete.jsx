// ─── pages/athletes/AddAthlete.jsx ───────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, UserPlus, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import { sportService } from '../../services/sportService';
import { coachService } from '../../services/coachService';
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

const AddAthlete = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [sports, setSports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    date_of_birth: '', gender: 'male', blood_group: '',
    height_cm: '', weight_kg: '',
    sport_id: '', category_id: '', coach_id: '',
    address: '', city: '', state: '', district: '', pincode: '',
    academy_name: '', guardian_name: '', guardian_phone: '',
    joining_date: '', medical_status: 'fit',
  });

  useEffect(() => {
    sportService.listSports({ limit: 100 }).then((r) => setSports(r.data || [])).catch(() => {});
    coachService.list({ limit: 100 }).then((r) => setCoaches(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.sport_id) { setCategories([]); return; }
    sportService.listCategories({ sport_id: form.sport_id, limit: 100 })
      .then((r) => setCategories(r.data || [])).catch(() => {});
  }, [form.sport_id]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required';
    if (!form.last_name.trim()) e.last_name = 'Last name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (!form.date_of_birth) e.date_of_birth = 'Date of birth is required';
    if (form.height_cm && (Number(form.height_cm) < 50 || Number(form.height_cm) > 250)) e.height_cm = 'Height must be between 50–250 cm';
    if (form.weight_kg && (Number(form.weight_kg) < 20 || Number(form.weight_kg) > 200)) e.weight_kg = 'Weight must be between 20–200 kg';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await athleteService.create(form);
      toast.success(`Athlete created! Code: ${result.data?.athlete_code}. Default password: ${result.data?.defaultPassword}`);
      navigate('/athletes');
    } catch (err) {
      toast.error(err?.message || 'Failed to create athlete');
    } finally {
      setLoading(false);
    }
  };

  const bmi = form.height_cm && form.weight_kg
    ? (Number(form.weight_kg) / ((Number(form.height_cm) / 100) ** 2)).toFixed(1)
    : null;

  return (
    <div className="fade-in space-y-5">
      <PageHeader
        title="Add Athlete"
        subtitle="Register a new athlete into the academy system."
        breadcrumb="Athletes"
        actions={
          <Button variant="outline" size="sm" leftIcon={ChevronLeft} onClick={() => navigate('/athletes')}>
            Back to List
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Info */}
        <FormSection title="Personal Information">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="First Name" required error={errors.first_name}>
              <input className={inputCls} placeholder="First name" value={form.first_name} onChange={set('first_name')} />
            </Field>
            <Field label="Last Name" required error={errors.last_name}>
              <input className={inputCls} placeholder="Last name" value={form.last_name} onChange={set('last_name')} />
            </Field>
            <Field label="Email" required error={errors.email}>
              <input type="email" className={inputCls} placeholder="athlete@email.com" value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Phone">
              <input className={inputCls} placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="Date of Birth" required error={errors.date_of_birth}>
              <input type="date" className={inputCls} value={form.date_of_birth} onChange={set('date_of_birth')} />
            </Field>
            <Field label="Gender">
              <select className={selectCls} value={form.gender} onChange={set('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Blood Group">
              <select className={selectCls} value={form.blood_group} onChange={set('blood_group')}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>

        {/* Physical Stats */}
        <FormSection title="Physical Information">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Height (cm)" error={errors.height_cm}>
              <input type="number" className={inputCls} placeholder="175" value={form.height_cm} onChange={set('height_cm')} />
            </Field>
            <Field label="Weight (kg)" error={errors.weight_kg}>
              <input type="number" className={inputCls} placeholder="70" value={form.weight_kg} onChange={set('weight_kg')} />
            </Field>
            <Field label="BMI (Auto)">
              <div className={`${inputCls} flex items-center bg-secondary text-muted-foreground cursor-not-allowed`}>
                {bmi ? (
                  <span className="font-semibold text-foreground">
                    {bmi}{' '}
                    <span className={`text-xs ${Number(bmi) < 18.5 ? 'text-info' : Number(bmi) < 25 ? 'text-success' : Number(bmi) < 30 ? 'text-warning' : 'text-destructive'}`}>
                      ({Number(bmi) < 18.5 ? 'Underweight' : Number(bmi) < 25 ? 'Normal' : Number(bmi) < 30 ? 'Overweight' : 'Obese'})
                    </span>
                  </span>
                ) : '—'}
              </div>
            </Field>
          </div>
        </FormSection>

        {/* Sport & Academy */}
        <FormSection title="Sport & Academy">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Sport">
              <select className={selectCls} value={form.sport_id} onChange={set('sport_id')}>
                <option value="">Select Sport</option>
                {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select className={selectCls} value={form.category_id} onChange={set('category_id')} disabled={!form.sport_id}>
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Coach">
              <select className={selectCls} value={form.coach_id} onChange={set('coach_id')}>
                <option value="">Assign Coach (Optional)</option>
                {coaches.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </Field>
            <Field label="Academy Name">
              <input className={inputCls} placeholder="Academy / Institution name" value={form.academy_name} onChange={set('academy_name')} />
            </Field>
            <Field label="Joining Date">
              <input type="date" className={inputCls} value={form.joining_date} onChange={set('joining_date')} />
            </Field>
            <Field label="Medical Status">
              <select className={selectCls} value={form.medical_status} onChange={set('medical_status')}>
                <option value="fit">Fit</option>
                <option value="unfit">Unfit</option>
                <option value="injured">Injured</option>
                <option value="under_observation">Under Observation</option>
              </select>
            </Field>
          </div>
        </FormSection>

        {/* Address */}
        <FormSection title="Address">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Address" error={errors.address}>
              <input className={inputCls} placeholder="Street address" value={form.address} onChange={set('address')} />
            </Field>
            <Field label="City">
              <input className={inputCls} placeholder="City" value={form.city} onChange={set('city')} />
            </Field>
            <Field label="District">
              <input className={inputCls} placeholder="District" value={form.district} onChange={set('district')} />
            </Field>
            <Field label="State">
              <input className={inputCls} placeholder="State" value={form.state} onChange={set('state')} />
            </Field>
            <Field label="Pincode">
              <input className={inputCls} placeholder="PIN Code" value={form.pincode} onChange={set('pincode')} />
            </Field>
          </div>
        </FormSection>

        {/* Guardian */}
        <FormSection title="Guardian Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Guardian Name">
              <input className={inputCls} placeholder="Parent / Guardian full name" value={form.guardian_name} onChange={set('guardian_name')} />
            </Field>
            <Field label="Guardian Contact">
              <input className={inputCls} placeholder="+91 XXXXX XXXXX" value={form.guardian_phone} onChange={set('guardian_phone')} />
            </Field>
          </div>
        </FormSection>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/athletes')}>Cancel</Button>
          <Button type="submit" leftIcon={UserPlus} loading={loading}>
            Create Athlete
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddAthlete;
