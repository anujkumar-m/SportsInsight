// ─── pages/athletes/AthleteProfile.jsx ───────────────────
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Edit, Activity, Calendar, Award, HeartPulse,
  User, MapPin, ShieldCheck, Mail, Phone, CalendarRange, Droplets,
  Ruler, Weight, Dna, Gauge, TrendingUp, CalendarCheck, MessageSquare,
  Sparkles, AlertTriangle, ShieldAlert, CheckCircle2, Trophy, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

/* ─── Sub-components ────────────────────────────────────── */

const StatCard = ({ label, value, subtext, icon: Icon, tone = 'default' }) => {
  const toneClasses = {
    default: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-destructive bg-destructive/10',
    info: 'text-info bg-info/10',
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-xs transition-shadow hover:shadow-md">
      {Icon && (
        <div className={`mx-auto mb-2 flex size-9 items-center justify-center rounded-xl ${toneClasses[tone] || toneClasses.default}`}>
          <Icon size={18} />
        </div>
      )}
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{value || '—'}</p>
      {subtext && <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{subtext}</p>}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border/50 py-2.5 last:border-0">
    <dt className="flex shrink-0 items-center gap-2 text-xs font-semibold text-muted-foreground">
      {Icon && <Icon size={13} className="text-primary/70" />}
      {label}
    </dt>
    <dd className="truncate text-right text-sm font-semibold text-foreground">{value || '—'}</dd>
  </div>
);

const SectionCard = ({ title, icon: Icon, iconClass = 'text-primary', action, children }) => (
  <div className="ui-card p-6">
    <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className={`flex size-7 items-center justify-center rounded-lg bg-primary/10 ${iconClass}`}>
            <Icon size={15} />
          </span>
        )}
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h3>
      </div>
      {action}
    </div>
    <dl className="space-y-0">{children}</dl>
  </div>
);

/* ─── Main Component ─────────────────────────────────────── */

const AthleteProfile = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const effectiveId = id || (role === 'athlete' ? 'me' : user?.athlete_id || user?.id);

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        const res = await athleteService.getById(effectiveId);
        setAthlete(res.data);
      } catch (err) {
        toast.error('Failed to load athlete profile');
        if (role !== 'athlete') navigate('/athletes');
      } finally {
        setLoading(false);
      }
    };
    fetchAthlete();
  }, [effectiveId, navigate, role]);

  if (loading) return <LoadingSkeleton />;
  if (!athlete) {
    return (
      <div className="ui-card p-12 text-center">
        <User className="mx-auto size-12 text-muted-foreground/40 mb-3" />
        <h3 className="text-base font-bold text-foreground">Athlete Profile Not Found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">No athlete profile record matches your account.</p>
        <Button size="sm" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const fullName = athlete.full_name?.trim() || `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Athlete';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AP';

  const TABS = [
    { id: 'overview',     label: 'Overview',              icon: User },
    { id: 'performance',  label: `Performance (${athlete.performance_records?.length || 0})`, icon: TrendingUp },
    { id: 'fitness',      label: `Fitness (${athlete.fitness_assessments?.length || 0})`,       icon: Gauge },
    { id: 'attendance',   label: 'Attendance Stats',      icon: CalendarCheck },
    { id: 'medical',      label: `Medical & Injuries (${(athlete.medical_history?.length || 0) + (athlete.injuries?.length || 0)})`, icon: HeartPulse },
    { id: 'feedback',     label: `Coach Feedback (${athlete.coach_remarks?.length || 0})`, icon: MessageSquare },
    { id: 'achievements', label: `Achievements & Trials (${(athlete.achievements?.length || 0) + (athlete.selections?.length || 0)})`, icon: Award },
    { id: 'history',      label: 'Activity Log',          icon: Calendar },
  ];

  const latestFitness = athlete.fitness_assessments?.[0];
  const attendanceRate = athlete.attendance_stats?.attendance_rate ?? 0;

  return (
    <div className="fade-in space-y-6 pb-16">
      {/* ── 1. Page Header ───────────────────────────────── */}
      <PageHeader
        title={role === 'athlete' ? "My Complete Profile" : "Athlete Profile Details"}
        subtitle="Complete personal information, vitals, medical history, performance metrics, and intelligence logs."
        breadcrumb={role === 'athlete' ? "Profile" : "Athletes"}
        actions={
          <div className="flex items-center gap-2.5">
            {role !== 'athlete' && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={ChevronLeft}
                onClick={() => navigate('/athletes')}
              >
                Back to List
              </Button>
            )}
            {(role === 'admin' || role === 'coach' || role === 'head_coach') && (
              <Button
                size="sm"
                leftIcon={Edit}
                onClick={() => navigate(`/athletes/${athlete.id}/edit`)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        }
      />

      {/* ── 2. Profile Hero Card ─────────────────────────── */}
      <div className="ui-card overflow-hidden shadow-md">
        {/* Gradient Banner */}
        <div className="relative h-28 w-full bg-gradient-navy">
          <div className="absolute -right-10 -top-10 size-52 rounded-full bg-white/5" />
          <div className="absolute right-12 top-6 size-28 rounded-full bg-white/5" />
          <div className="absolute left-1/3 -bottom-6 size-32 rounded-full bg-white/5" />
        </div>

        {/* Content Area */}
        <div className="px-6 pb-8 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Avatar Column */}
            <div className="relative shrink-0 self-start -mt-16">
              {athlete.profile_photo ? (
                <img
                  src={athlete.profile_photo}
                  alt={fullName}
                  className="size-28 rounded-2xl object-cover ring-4 ring-card shadow-xl"
                />
              ) : (
                <div className="grid size-28 select-none place-items-center rounded-2xl bg-gradient-primary text-3xl font-extrabold text-white shadow-xl ring-4 ring-card">
                  {initials}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-card ${
                  athlete.current_status === 'active' ? 'bg-success' : 'bg-muted-foreground'
                }`}
                title={`Status: ${athlete.current_status}`}
              />
            </div>

            {/* Identity Column */}
            <div className="flex-1 min-w-0 space-y-2.5 pt-3 text-center sm:text-left">
              <h2 className="break-words text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
                {fullName}
              </h2>

              {athlete.athlete_code && (
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="text-xs font-semibold text-muted-foreground">Athlete Code:</span>
                  <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                    {athlete.athlete_code}
                  </span>
                  {athlete.overall_rank && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Trophy size={13} /> Rank #{athlete.overall_rank}
                    </span>
                  )}
                </div>
              )}

              {(athlete.sport_name || athlete.category_name || athlete.academy_name) && (
                <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-medium text-muted-foreground sm:justify-start">
                  {athlete.sport_name && (
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Activity size={14} className="shrink-0 text-primary" />
                      {athlete.sport_name}
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

              {/* Badges */}
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
                  Medical: {athlete.medical_status?.replace(/_/g, ' ') || 'Fit'}
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

          {/* Medical Reason Banner if not fit */}
          {athlete.medical_status && athlete.medical_status !== 'fit' && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
              <HeartPulse className="size-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Medical Advisory ({athlete.medical_status.replace(/_/g, ' ')}):
                </span>{' '}
                <span className="font-medium">
                  {athlete.medical_reason || 'Currently under medical observation. Please adhere to prescribed rehabilitation.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Tab Navigation ─────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px scrollbar-none">
        {TABS.map(({ id: tid, label, icon: Icon }) => {
          const active = activeTab === tid;
          return (
            <button
              key={tid}
              onClick={() => setActiveTab(tid)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-xl border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all ${
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
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Vitals */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Age" value={athlete.age ? `${athlete.age} yrs` : '—'} subtext="Years" icon={User} />
              <StatCard label="Height" value={athlete.height_cm ? `${athlete.height_cm} cm` : '—'} subtext="Centimeters" icon={Ruler} />
              <StatCard label="Weight" value={athlete.weight_kg ? `${athlete.weight_kg} kg` : '—'} subtext="Kilograms" icon={Weight} />
              <StatCard label="BMI" value={athlete.bmi || '—'} subtext="Body Mass Index" icon={Dna} tone="info" />
            </div>

            {/* Performance & Fitness Quick Glance */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                label="Overall Rank"
                value={athlete.overall_rank ? `#${athlete.overall_rank}` : '—'}
                subtext="Academy Standings"
                icon={Trophy}
                tone="warning"
              />
              <StatCard
                label="Ranking Score"
                value={athlete.overall_ranking_score ? `${athlete.overall_ranking_score}` : '—'}
                subtext="Out of 100"
                icon={TrendingUp}
                tone="primary"
              />
              <StatCard
                label="Fitness Score"
                value={latestFitness ? `${latestFitness.overall_fitness_score}/100` : '—'}
                subtext="Latest Assessment"
                icon={Gauge}
                tone="success"
              />
              <StatCard
                label="Attendance Rate"
                value={`${attendanceRate}%`}
                subtext={`${athlete.attendance_stats?.present_count || 0}/${athlete.attendance_stats?.total_sessions || 0} Sessions`}
                icon={CalendarCheck}
                tone={attendanceRate >= 80 ? 'success' : 'warning'}
              />
            </div>

            {/* Detailed Info Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              <SectionCard title="Personal & Physical Details" icon={User}>
                <InfoRow icon={Mail} label="Email" value={athlete.email} />
                <InfoRow icon={Phone} label="Phone Number" value={athlete.phone} />
                <InfoRow icon={CalendarRange} label="Date of Birth" value={athlete.date_of_birth ? new Date(athlete.date_of_birth).toLocaleDateString() : null} />
                <InfoRow icon={User} label="Gender" value={athlete.gender ? athlete.gender.toUpperCase() : null} />
                <InfoRow icon={Droplets} label="Blood Group" value={athlete.blood_group} />
                <InfoRow icon={Ruler} label="Height / Weight" value={athlete.height_cm && athlete.weight_kg ? `${athlete.height_cm} cm / ${athlete.weight_kg} kg` : null} />
              </SectionCard>

              <SectionCard title="Academy, Coaching & Discipline" icon={Activity}>
                <InfoRow icon={Activity} label="Primary Sport" value={athlete.sport_name} />
                <InfoRow icon={User} label="Age Category" value={athlete.category_name} />
                <InfoRow icon={ShieldCheck} label="Assigned Coach" value={athlete.coach_name || 'Unassigned'} />
                <InfoRow icon={CalendarRange} label="Registration Date" value={athlete.registration_date ? new Date(athlete.registration_date).toLocaleDateString() : null} />
                <InfoRow icon={CalendarRange} label="Joining Date" value={athlete.joining_date ? new Date(athlete.joining_date).toLocaleDateString() : null} />
                <InfoRow icon={ShieldCheck} label="Academy / Center" value={athlete.academy_name} />
              </SectionCard>

              <SectionCard title="Health & Medical Status" icon={HeartPulse}>
                <InfoRow icon={HeartPulse} label="Current Medical Status" value={athlete.medical_status?.toUpperCase() || 'FIT'} />
                <InfoRow icon={AlertTriangle} label="Medical Reason / Diagnosis" value={athlete.medical_reason || 'Cleared / None'} />
                <InfoRow icon={ShieldAlert} label="Active Injuries" value={athlete.injuries?.filter(i => i.recovery_status !== 'recovered').length ? `${athlete.injuries.filter(i => i.recovery_status !== 'recovered').length} active` : '0 (None)'} />
              </SectionCard>

              <SectionCard title="Guardian & Address Information" icon={MapPin}>
                <InfoRow icon={User} label="Guardian Name" value={athlete.guardian_name} />
                <InfoRow icon={Phone} label="Guardian Contact" value={athlete.guardian_phone} />
                <InfoRow icon={MapPin} label="Residential Address" value={athlete.address} />
                <InfoRow icon={MapPin} label="City / State" value={athlete.city ? `${athlete.city}${athlete.state ? `, ${athlete.state}` : ''}` : null} />
                <InfoRow icon={MapPin} label="District / Pincode" value={athlete.district ? `${athlete.district}${athlete.pincode ? ` - ${athlete.pincode}` : ''}` : null} />
              </SectionCard>
            </div>
          </div>
        )}

        {/* ── PERFORMANCE TAB ── */}
        {activeTab === 'performance' && (
          <div className="ui-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Performance Evaluations</h3>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{athlete.performance_records?.length || 0} records logged</span>
            </div>

            {athlete.performance_records?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/40 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Sport / Discipline</th>
                      <th className="p-3">Metric Name</th>
                      <th className="p-3">Value</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-medium">
                    {athlete.performance_records.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(p.record_date).toLocaleDateString()}</td>
                        <td className="p-3 font-semibold text-foreground">{p.sport_name || athlete.sport_name}</td>
                        <td className="p-3 font-bold text-primary">{p.metric_name}</td>
                        <td className="p-3">{p.metric_value} {p.metric_unit || ''}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs ${
                            p.performance_score >= 80 ? 'bg-success/10 text-success' : p.performance_score >= 60 ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                          }`}>
                            {p.performance_score}/100
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No performance records recorded yet.
              </div>
            )}
          </div>
        )}

        {/* ── FITNESS TAB ── */}
        {activeTab === 'fitness' && (
          <div className="space-y-6">
            {latestFitness && (
              <div className="ui-card p-6">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="size-5 text-success" />
                    <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Latest Fitness Assessment Snapshot</h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Assessed on {new Date(latestFitness.assessment_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  <StatCard label="Overall Score" value={`${latestFitness.overall_fitness_score}/100`} tone="success" />
                  <StatCard label="Strength" value={`${latestFitness.strength_score || 0}/100`} />
                  <StatCard label="Endurance" value={`${latestFitness.endurance_score || 0}/100`} />
                  <StatCard label="Stamina" value={`${latestFitness.stamina_score || 0}/100`} />
                  <StatCard label="Flexibility" value={`${latestFitness.flexibility_score || 0}/100`} />
                  <StatCard label="Agility" value={`${latestFitness.agility_score || 0}/100`} />
                  <StatCard label="Speed" value={`${latestFitness.speed_score || 0}/100`} />
                  <StatCard label="VO2 Max" value={latestFitness.vo2_max ? `${latestFitness.vo2_max} ml/kg/min` : '—'} />
                  <StatCard label="Resting HR" value={latestFitness.resting_heart_rate ? `${latestFitness.resting_heart_rate} bpm` : '—'} />
                  <StatCard label="Body Fat" value={latestFitness.body_fat_percentage ? `${latestFitness.body_fat_percentage}%` : '—'} />
                  <StatCard label="Reaction Time" value={latestFitness.reaction_time_ms ? `${latestFitness.reaction_time_ms} ms` : '—'} />
                  <StatCard label="Recovery Rate" value={latestFitness.recovery_rate_bpm ? `${latestFitness.recovery_rate_bpm} bpm` : '—'} />
                </div>
              </div>
            )}

            <div className="ui-card p-6">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Fitness Assessment History</h3>
                <span className="text-xs text-muted-foreground">{athlete.fitness_assessments?.length || 0} assessments</span>
              </div>

              {athlete.fitness_assessments?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Overall Score</th>
                        <th className="p-3">Strength</th>
                        <th className="p-3">Endurance</th>
                        <th className="p-3">Speed</th>
                        <th className="p-3">VO2 Max</th>
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-medium">
                      {athlete.fitness_assessments.map((f) => (
                        <tr key={f.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(f.assessment_date).toLocaleDateString()}</td>
                          <td className="p-3">
                            <span className="font-bold text-success">{f.overall_fitness_score}/100</span>
                          </td>
                          <td className="p-3">{f.strength_score || 0}</td>
                          <td className="p-3">{f.endurance_score || 0}</td>
                          <td className="p-3">{f.speed_score || 0}</td>
                          <td className="p-3">{f.vo2_max || '—'}</td>
                          <td className="p-3 text-muted-foreground truncate max-w-xs">{f.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No fitness assessments recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ATTENDANCE TAB ── */}
        {activeTab === 'attendance' && (
          <div className="ui-card p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <CalendarCheck className="size-5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Attendance & Commitment Record</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Attendance Rate" value={`${attendanceRate}%`} tone={attendanceRate >= 80 ? 'success' : 'warning'} />
              <StatCard label="Total Sessions" value={athlete.attendance_stats?.total_sessions || 0} />
              <StatCard label="Present Count" value={athlete.attendance_stats?.present_count || 0} tone="success" />
              <StatCard label="Absences / Leave" value={(athlete.attendance_stats?.absent_count || 0) + (athlete.attendance_stats?.leave_count || 0)} tone="danger" />
            </div>
          </div>
        )}

        {/* ── MEDICAL & INJURIES TAB ── */}
        {activeTab === 'medical' && (
          <div className="space-y-6">
            <div className="ui-card p-6">
              <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
                <HeartPulse size={18} className="text-destructive" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Active & Past Injury Records</h3>
              </div>

              {athlete.injuries?.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {athlete.injuries.map((inj) => (
                    <div key={inj.id} className="rounded-xl border border-border bg-background p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-foreground text-sm">{inj.injury_type}</p>
                          <p className="text-xs text-muted-foreground">{inj.body_part} &bull; {new Date(inj.injury_date).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={inj.recovery_status === 'recovered' ? 'success' : inj.severity === 'severe' ? 'danger' : 'warning'}>
                          {inj.recovery_status || inj.severity}
                        </Badge>
                      </div>
                      {inj.diagnosis && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Diagnosis:</span> {inj.diagnosis}</p>}
                      {inj.treatment && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Treatment:</span> {inj.treatment}</p>}
                      {inj.doctor_name && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Physician:</span> {inj.doctor_name} ({inj.hospital || 'Academy Medical'})</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No injury records logged. Athlete is healthy!
                </div>
              )}
            </div>

            <div className="ui-card p-6">
              <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
                <AlertTriangle size={18} className="text-warning" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Medical History & Condition Notes</h3>
              </div>

              {athlete.medical_history?.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {athlete.medical_history.map((record) => (
                    <div key={record.id} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-foreground">{record.condition_name}</p>
                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {new Date(record.record_date).toLocaleDateString()} &bull; {record.condition_type}
                          </p>
                          {record.notes && <p className="mt-2 text-xs text-foreground/80 leading-relaxed">{record.notes}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No past medical condition notes found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FEEDBACK & REMARKS TAB ── */}
        {activeTab === 'feedback' && (
          <div className="ui-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <MessageSquare className="size-5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Coach Evaluations & Remarks</h3>
            </div>

            {athlete.coach_remarks?.length > 0 ? (
              <div className="space-y-3">
                {athlete.coach_remarks.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border border-border bg-background space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{r.coach_name || 'Coach'}</span>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase">{r.category || 'General'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(r.remark_date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-foreground/85 leading-relaxed italic">"{r.remarks}"</p>
                    {r.rating && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                        <span>★ Rating:</span>
                        <span>{r.rating}/10</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No coach remarks received yet.
              </div>
            )}
          </div>
        )}

        {/* ── ACHIEVEMENTS & SELECTIONS TAB ── */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="ui-card p-6">
              <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
                <Trophy size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Medals & Achievements</h3>
              </div>

              {athlete.achievements?.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {athlete.achievements.map((ach) => (
                    <div key={ach.id} className="flex gap-4 rounded-xl border border-border bg-background p-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-2xl">
                        🏆
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{ach.title}</p>
                        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                          {ach.competition_name} &bull; {new Date(ach.achievement_date).toLocaleDateString()}
                        </p>
                        {ach.description && <p className="mt-2 text-xs leading-relaxed text-foreground/80">{ach.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No achievements recorded yet.
                </div>
              )}
            </div>

            <div className="ui-card p-6">
              <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
                <Sparkles size={18} className="text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Selection Trial Nominations</h3>
              </div>

              {athlete.selections?.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {athlete.selections.map((sel) => (
                    <div key={sel.id} className="rounded-xl border border-border bg-background p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-foreground text-sm">{sel.selection_type}</span>
                        <Badge variant={sel.status === 'selected' || sel.status === 'strongly_recommended' ? 'success' : 'primary'}>
                          {sel.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Date: {new Date(sel.selection_date).toLocaleDateString()}</p>
                      <p className="text-xs text-primary font-semibold">Selection Score: {sel.selection_score}% &bull; Confidence: {sel.confidence_score}%</p>
                      {sel.remarks && <p className="text-xs text-foreground/80 italic">"{sel.remarks}"</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No selection trial nominations recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIVITY LOG TAB ── */}
        {activeTab === 'history' && (
          <div className="ui-card p-6">
            <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
              <Calendar size={18} className="text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Profile Timeline & Audit Log</h3>
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
              <div className="py-12 text-center text-xs text-muted-foreground">
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
