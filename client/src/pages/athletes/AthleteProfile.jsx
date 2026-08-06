// ─── pages/athletes/AthleteProfile.jsx ───────────────────
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Edit, Activity, Calendar, Award, HeartPulse,
  User, MapPin, ShieldCheck, Mail, Phone, CalendarRange, Droplets,
  Ruler, Weight, Dna,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

/* ─── Sub-components ────────────────────────────────────── */

const StatCard = ({ label, value, subtext, icon: Icon }) => (
  <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-xs transition-shadow hover:shadow-md">
    {Icon && (
      <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={18} />
      </div>
    )}
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{value || '—'}</p>
    {subtext && <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{subtext}</p>}
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border/50 py-2.5 last:border-0">
    <dt className="flex shrink-0 items-center gap-2 text-xs font-semibold text-muted-foreground">
      {Icon && <Icon size={13} className="text-primary/70" />}
      {label}
    </dt>
    <dd className="truncate text-right text-sm font-semibold text-foreground">{value || '—'}</dd>
  </div>
);

const SectionCard = ({ title, icon: Icon, iconClass = 'text-primary', children }) => (
  <div className="ui-card p-6">
    <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
      {Icon && (
        <span className={`flex size-7 items-center justify-center rounded-lg bg-primary/10 ${iconClass}`}>
          <Icon size={15} />
        </span>
      )}
      <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h3>
    </div>
    <dl className="space-y-0">{children}</dl>
  </div>
);

/* ─── Main Component ─────────────────────────────────────── */

const AthleteProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        const res = await athleteService.getById(id);
        setAthlete(res.data);
      } catch (err) {
        toast.error('Failed to load athlete profile');
        navigate('/athletes');
      } finally {
        setLoading(false);
      }
    };
    fetchAthlete();
  }, [id, navigate]);

  if (loading) return <LoadingSkeleton />;
  if (!athlete) return null;

  const fullName   = athlete.full_name?.trim() || 'Unknown Athlete';
  const initials   = fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AP';

  const TABS = [
    { id: 'overview',     label: 'Overview',        icon: User       },
    { id: 'medical',      label: 'Medical History', icon: HeartPulse },
    { id: 'achievements', label: 'Achievements',    icon: Award      },
    { id: 'history',      label: 'Activity Log',    icon: Calendar   },
  ];

  return (
    <div className="fade-in space-y-6 pb-16">

      {/* ── 1. Page Title (restored) ─────────────────────── */}
      <PageHeader
        title="Athlete Profile"
        subtitle="View complete athlete details, stats, and history."
        breadcrumb="Athletes"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={ChevronLeft}
              onClick={() => navigate('/athletes')}
            >
              Back to List
            </Button>
            <Button
              size="sm"
              leftIcon={Edit}
              onClick={() => navigate(`/athletes/${id}/edit`)}
            >
              Edit Profile
            </Button>
          </div>
        }
      />

      {/* ── 2. Profile Hero Card ─────────────────────────── */}
      <div className="ui-card overflow-hidden">

        {/* ── Gradient Banner (decorative only) ── */}
        <div className="relative h-28 w-full bg-gradient-navy">
          <div className="absolute -right-10 -top-10 size-52 rounded-full bg-white/5" />
          <div className="absolute right-12 top-6 size-28 rounded-full bg-white/5" />
          <div className="absolute left-1/3 -bottom-6 size-32 rounded-full bg-white/5" />
        </div>

        {/* ── Content Area (avatar lifted, identity in normal flow) ── */}
        <div className="px-6 pb-8 sm:px-8">

          {/*
            Layout strategy:
            - Avatar is pulled up with -mt-16 on its OWN wrapper so only it overlaps the banner.
            - The identity block (name, ID, badges) stays in normal flow BELOW the banner.
            - On sm+ screens we use a flex row so avatar sits to the left of the identity column.
            - This completely prevents any overlap between the ID badge and the avatar.
          */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">

            {/* ── Avatar column (lifted over banner) ── */}
            <div className="relative shrink-0 self-start -mt-16">
              {/* Avatar box */}
              <div className="grid size-28 select-none place-items-center rounded-2xl bg-gradient-primary text-3xl font-extrabold text-white shadow-xl ring-4 ring-card">
                {initials}
              </div>
              {/* Online/status dot */}
              <span
                className={`absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-card ${
                  athlete.current_status === 'active' ? 'bg-success' : 'bg-muted-foreground'
                }`}
                title={`Status: ${athlete.current_status}`}
              />
            </div>

            {/* ── Identity column (always below banner, never collides with avatar) ── */}
            <div className="flex-1 min-w-0 space-y-2.5 pt-3 text-center sm:text-left">

              {/* ATHLETE NAME — primary heading, most prominent element */}
              <h2 className="break-words text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                {fullName}
              </h2>

              {/* Athlete ID — on its own row, clearly below the name */}
              {athlete.athlete_code && (
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="text-xs font-semibold text-muted-foreground">Athlete ID:</span>
                  <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                    {athlete.athlete_code}
                  </span>
                </div>
              )}

              {/* Sport / Category / Academy — metadata row */}
              {(athlete.sport_name || athlete.category_name || athlete.academy_name) && (
                <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-medium text-muted-foreground sm:justify-start">
                  {athlete.sport_name && (
                    <span className="flex items-center gap-1.5">
                      <Activity size={13} className="shrink-0 text-primary" />
                      Sport: {athlete.sport_name}
                    </span>
                  )}
                  {athlete.category_name && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-border">•</span>
                      {athlete.category_name}
                    </span>
                  )}
                  {athlete.academy_name && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-border">•</span>
                      {athlete.academy_name}
                    </span>
                  )}
                </p>
              )}

              {/* Status / meta badges — always on their own row */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 sm:justify-start">
                <Badge
                  variant={
                    athlete.medical_status === 'fit'
                      ? 'success'
                      : athlete.medical_status === 'injured'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  Medical: {athlete.medical_status?.replace(/_/g, ' ')}
                </Badge>
                <Badge variant={athlete.current_status === 'active' ? 'success' : 'secondary'}>
                  {athlete.current_status === 'active' ? '● Active' : athlete.current_status}
                </Badge>
                {athlete.gender && (
                  <Badge variant="primary" className="capitalize">
                    {athlete.gender}
                  </Badge>
                )}
                {athlete.blood_group && (
                  <Badge variant="info">{athlete.blood_group}</Badge>
                )}
                {athlete.coach_name && (
                  <Badge variant="secondary">Coach: {athlete.coach_name}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Tab Navigation ─────────────────────────────── */}
      <div className="flex gap-0.5 overflow-x-auto border-b border-border pb-px">
        {TABS.map(({ id: tid, label, icon: Icon }) => {
          const active = activeTab === tid;
          return (
            <button
              key={tid}
              onClick={() => setActiveTab(tid)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
                active
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── 4. Tab Content ────────────────────────────────── */}
      <div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Age"    value={athlete.age ? `${athlete.age} yrs` : '—'} subtext="Years"          icon={User}   />
              <StatCard label="Height" value={athlete.height_cm ? `${athlete.height_cm} cm` : '—'} subtext="Centimeters"  icon={Ruler}  />
              <StatCard label="Weight" value={athlete.weight_kg ? `${athlete.weight_kg} kg` : '—'} subtext="Kilograms"    icon={Weight} />
              <StatCard label="BMI"    value={athlete.bmi || '—'} subtext="Body Mass Index" icon={Dna}    />
            </div>

            {/* Information cards */}
            <div className="grid gap-5 md:grid-cols-2">
              <SectionCard title="Personal Information" icon={User}>
                <InfoRow icon={Mail}          label="Email"        value={athlete.email} />
                <InfoRow icon={Phone}         label="Phone"        value={athlete.phone} />
                <InfoRow icon={CalendarRange} label="Date of Birth" value={athlete.date_of_birth ? new Date(athlete.date_of_birth).toLocaleDateString() : null} />
                <InfoRow icon={User}          label="Gender"       value={athlete.gender ? athlete.gender.charAt(0).toUpperCase() + athlete.gender.slice(1) : null} />
                <InfoRow icon={Droplets}      label="Blood Group"  value={athlete.blood_group} />
              </SectionCard>

              <SectionCard title="Academy & Emergency Contact" icon={Activity}>
                <InfoRow icon={ShieldCheck}   label="Assigned Coach"   value={athlete.coach_name || 'Unassigned'} />
                <InfoRow icon={CalendarRange} label="Joining Date"     value={athlete.joining_date ? new Date(athlete.joining_date).toLocaleDateString() : null} />
                <InfoRow icon={User}          label="Guardian Name"    value={athlete.guardian_name} />
                <InfoRow icon={Phone}         label="Guardian Contact" value={athlete.guardian_phone} />
                <InfoRow icon={MapPin}        label="Location"         value={athlete.city ? `${athlete.city}${athlete.state ? `, ${athlete.state}` : ''}` : null} />
              </SectionCard>
            </div>
          </div>
        )}

        {/* MEDICAL HISTORY */}
        {activeTab === 'medical' && (
          <div className="ui-card p-6">
            <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <HeartPulse size={15} />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Medical Records & Conditions</h3>
            </div>
            {athlete.medical_history?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {athlete.medical_history.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground">{record.condition_name}</p>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {new Date(record.record_date).toLocaleDateString()} &bull; {record.condition_type}
                        </p>
                      </div>
                      <Badge variant={record.severity === 'severe' ? 'danger' : 'warning'}>
                        {record.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No medical history records found for this athlete.
              </div>
            )}
          </div>
        )}

        {/* ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div className="ui-card p-6">
            <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <Award size={15} />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Competitions & Achievements</h3>
            </div>
            {athlete.achievements?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {athlete.achievements.map((ach) => (
                  <div key={ach.id} className="flex gap-4 rounded-xl border border-border bg-background p-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-warning/15 text-xl">
                      🏆
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{ach.title}</p>
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                        {ach.competition_name} &bull; {new Date(ach.achievement_date).toLocaleDateString()}
                      </p>
                      {ach.description && (
                        <p className="mt-2 text-xs leading-relaxed text-foreground/75">{ach.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No achievements recorded yet.
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY LOG */}
        {activeTab === 'history' && (
          <div className="ui-card p-6">
            <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar size={15} />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Activity Log & Timeline</h3>
            </div>
            {athlete.history?.length > 0 ? (
              <div className="relative space-y-5 pl-7 before:absolute before:bottom-2 before:left-3 before:top-2 before:w-0.5 before:bg-border">
                {athlete.history.map((event) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-7 top-1 size-3.5 rounded-full border-2 border-card bg-primary shadow" />
                    <p className="text-sm font-semibold text-foreground">{event.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()} &bull; {event.changed_by_name || 'System'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No history events logged yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteProfile;
