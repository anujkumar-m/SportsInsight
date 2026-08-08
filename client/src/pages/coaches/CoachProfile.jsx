// ─── pages/coaches/CoachProfile.jsx ───────────────────
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Edit, Activity, Calendar, Award, User, Mail, Phone,
  CalendarRange, ShieldCheck, Briefcase, Users, FileText, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { coachService } from '../../services/coachService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

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

const CoachProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCoach = async () => {
      try {
        const res = await coachService.getById(id);
        setCoach(res.data);
      } catch (err) {
        toast.error('Failed to load coach profile');
        navigate('/coaches');
      } finally {
        setLoading(false);
      }
    };
    fetchCoach();
  }, [id, navigate]);

  if (loading) return <LoadingSkeleton />;
  if (!coach) return null;

  const fullName = coach.full_name?.trim() || 'Unknown Coach';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CO';

  const TABS = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'athletes', label: `Assigned Athletes (${coach.athletes?.length || 0})`, icon: Users },
    { id: 'certificates', label: 'Certificates & Remarks', icon: Award },
    { id: 'history', label: 'Activity Log', icon: Calendar },
  ];

  return (
    <div className="fade-in space-y-6 pb-16">
      {/* ── 1. Page Header ─────────────────────────────── */}
      <PageHeader
        title="Coach Profile"
        subtitle="View coach details, qualifications, and assigned athletes."
        breadcrumb="Coaches"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={ChevronLeft}
              onClick={() => navigate('/coaches')}
            >
              Back to List
            </Button>
            <Button
              size="sm"
              leftIcon={Edit}
              onClick={() => navigate(`/coaches/${id}/edit`)}
            >
              Edit Profile
            </Button>
          </div>
        }
      />

      {/* ── 2. Hero Card ─────────────────────────────── */}
      <div className="ui-card overflow-hidden">
        <div className="relative h-28 w-full bg-gradient-navy">
          <div className="absolute -right-10 -top-10 size-52 rounded-full bg-white/5" />
          <div className="absolute right-12 top-6 size-28 rounded-full bg-white/5" />
        </div>

        <div className="px-6 pb-8 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative shrink-0 self-start -mt-16">
              <div className="grid size-28 select-none place-items-center rounded-2xl bg-gradient-primary text-3xl font-extrabold text-white shadow-xl ring-4 ring-card">
                {initials}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-card ${
                  coach.current_status === 'active' ? 'bg-success' : 'bg-muted-foreground'
                }`}
                title={`Status: ${coach.current_status}`}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2.5 pt-3 text-center sm:text-left">
              <h2 className="break-words text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                {fullName}
              </h2>

              {coach.coach_code && (
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="text-xs font-semibold text-muted-foreground">Coach ID:</span>
                  <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                    {coach.coach_code}
                  </span>
                </div>
              )}

              {(coach.sport_name || coach.specialization || coach.qualification) && (
                <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-medium text-muted-foreground sm:justify-start">
                  {coach.sport_name && (
                    <span className="flex items-center gap-1.5">
                      <Activity size={13} className="shrink-0 text-primary" />
                      Sport: {coach.sport_name}
                    </span>
                  )}
                  {coach.specialization && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-border">•</span>
                      {coach.specialization}
                    </span>
                  )}
                  {coach.qualification && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-border">•</span>
                      {coach.qualification}
                    </span>
                  )}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 sm:justify-start">
                <Badge variant={coach.current_status === 'active' ? 'success' : 'secondary'}>
                  {coach.current_status === 'active' ? '● Active' : coach.current_status}
                </Badge>
                {coach.experience_years > 0 && (
                  <Badge variant="primary">
                    {coach.experience_years} Yrs Experience
                  </Badge>
                )}
                {coach.gender && (
                  <Badge variant="info" className="capitalize">
                    {coach.gender}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Tabs ─────────────────────────────── */}
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

      {/* ── 4. Tab Content ─────────────────────────────── */}
      <div>
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Assigned Squad" value={coach.athletes?.length || 0} subtext="Active Athletes" icon={Users} />
              <StatCard label="Experience" value={coach.experience_years ? `${coach.experience_years} yrs` : '—'} subtext="Years Coaching" icon={Briefcase} />
              <StatCard label="Primary Sport" value={coach.sport_name || '—'} subtext="Specialization Field" icon={Activity} />
              <StatCard label="Status" value={coach.current_status || 'Active'} subtext="System Record" icon={ShieldCheck} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <SectionCard title="Personal Information" icon={User}>
                <InfoRow icon={Mail} label="Email" value={coach.email} />
                <InfoRow icon={Phone} label="Phone" value={coach.phone} />
                <InfoRow icon={CalendarRange} label="Date of Birth" value={coach.date_of_birth ? new Date(coach.date_of_birth).toLocaleDateString() : null} />
                <InfoRow icon={User} label="Gender" value={coach.gender ? coach.gender.charAt(0).toUpperCase() + coach.gender.slice(1) : null} />
                <InfoRow icon={CalendarRange} label="Joining Date" value={coach.joining_date ? new Date(coach.joining_date).toLocaleDateString() : null} />
              </SectionCard>

              <SectionCard title="Professional Background" icon={Briefcase}>
                <InfoRow icon={Activity} label="Sport" value={coach.sport_name} />
                <InfoRow icon={Award} label="Qualification" value={coach.qualification} />
                <InfoRow icon={Briefcase} label="Specialization" value={coach.specialization} />
                <InfoRow icon={CheckCircle2} label="Status" value={coach.current_status} />
              </SectionCard>
            </div>
          </div>
        )}

        {/* ASSIGNED ATHLETES */}
        {activeTab === 'athletes' && (
          <div className="ui-card p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users size={15} />
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Assigned Athlete Squad</h3>
              </div>
              <Badge variant="primary">{coach.athletes?.length || 0} Athletes</Badge>
            </div>

            {coach.athletes?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {coach.athletes.map((ath) => (
                  <div
                    key={ath.id}
                    onClick={() => navigate(`/athletes/${ath.id}`)}
                    className="flex items-center gap-3.5 rounded-xl border border-border bg-background p-4 cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                      {ath.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate text-sm">{ath.full_name}</p>
                      <p className="text-xs text-muted-foreground">{ath.sport_name} {ath.category_name ? `• ${ath.category_name}` : ''}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={ath.medical_status === 'fit' ? 'success' : 'warning'} className="text-[10px]">
                          {ath.medical_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No athletes currently assigned to this coach.
              </div>
            )}
          </div>
        )}

        {/* CERTIFICATES & REMARKS */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="ui-card p-6">
              <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-warning/15 text-warning">
                  <Award size={15} />
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Certificates</h3>
              </div>
              {coach.certificates?.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {coach.certificates.map((cert) => (
                    <div key={cert.id} className="rounded-xl border border-border bg-background p-4">
                      <p className="font-bold text-foreground">{cert.certificate_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{cert.issuing_body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No certificates uploaded for this coach.
                </div>
              )}
            </div>

            <div className="ui-card p-6">
              <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText size={15} />
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Coach Remarks Log</h3>
              </div>
              {coach.remarks?.length > 0 ? (
                <div className="space-y-3">
                  {coach.remarks.map((rem) => (
                    <div key={rem.id} className="rounded-xl border border-border bg-background p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-foreground">{rem.athlete_name}</p>
                        <span className="text-xs text-muted-foreground">{new Date(rem.remark_date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rem.remarks}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No remarks submitted yet.
                </div>
              )}
            </div>
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
            {coach.history?.length > 0 ? (
              <div className="relative space-y-5 pl-7 before:absolute before:bottom-2 before:left-3 before:top-2 before:w-0.5 before:bg-border">
                {coach.history.map((event) => (
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

export default CoachProfile;
