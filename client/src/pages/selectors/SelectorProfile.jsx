// ─── pages/selectors/SelectorProfile.jsx ───────────────────
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Edit, Activity, Calendar, Award, User, Mail, Phone,
  ShieldCheck, Briefcase, CheckCircle2, Trophy, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { selectorService } from '../../services/selectorService';
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

const SelectorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selector, setSelector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchSelector = async () => {
      try {
        const res = await selectorService.getById(id);
        setSelector(res.data);
      } catch (err) {
        toast.error('Failed to load selector profile');
        navigate('/selectors');
      } finally {
        setLoading(false);
      }
    };
    fetchSelector();
  }, [id, navigate]);

  if (loading) return <LoadingSkeleton />;
  if (!selector) return null;

  const fullName = selector.full_name?.trim() || `${selector.first_name || ''} ${selector.last_name || ''}`.trim() || 'Unknown Selector';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SE';

  const TABS = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'sports', label: `Assigned Sports (${selector.sports?.length || 0})`, icon: Activity },
    { id: 'history', label: `Selection History (${selector.history?.length || 0})`, icon: Trophy },
  ];

  return (
    <div className="fade-in space-y-6 pb-16">
      {/* ── 1. Page Header ─────────────────────────────── */}
      <PageHeader
        title="Selector Profile"
        subtitle="View selector details, sport assignments, and evaluation history."
        breadcrumb="Selectors"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={ChevronLeft}
              onClick={() => navigate('/selectors')}
            >
              Back to List
            </Button>
            <Button
              size="sm"
              leftIcon={Edit}
              onClick={() => navigate(`/selectors/${id}/edit`)}
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
                  selector.is_active ? 'bg-success' : 'bg-muted-foreground'
                }`}
                title={`Status: ${selector.is_active ? 'Active' : 'Inactive'}`}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2.5 pt-3 text-center sm:text-left">
              <h2 className="break-words text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                {fullName}
              </h2>

              {selector.selector_code && (
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="text-xs font-semibold text-muted-foreground">Selector ID:</span>
                  <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                    {selector.selector_code}
                  </span>
                </div>
              )}

              {(selector.designation || selector.organization || selector.sport_expertise) && (
                <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-medium text-muted-foreground sm:justify-start">
                  {selector.designation && (
                    <span className="flex items-center gap-1.5">
                      <Award size={13} className="shrink-0 text-primary" />
                      {selector.designation}
                    </span>
                  )}
                  {selector.organization && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-border">•</span>
                      {selector.organization}
                    </span>
                  )}
                  {selector.sport_expertise && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-border">•</span>
                      Expertise: {selector.sport_expertise}
                    </span>
                  )}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 sm:justify-start">
                <Badge variant={selector.is_active ? 'success' : 'secondary'}>
                  {selector.is_active ? '● Active' : 'Inactive'}
                </Badge>
                {selector.years_experience > 0 && (
                  <Badge variant="primary">
                    {selector.years_experience} Yrs Experience
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
              <StatCard label="Selections Made" value={selector.history?.length || 0} subtext="Evaluated Records" icon={Trophy} />
              <StatCard label="Experience" value={selector.years_experience ? `${selector.years_experience} yrs` : '—'} subtext="Selection Experience" icon={Briefcase} />
              <StatCard label="Assigned Sports" value={selector.sports?.length || 0} subtext="Sports Categories" icon={Activity} />
              <StatCard label="Status" value={selector.is_active ? 'Active' : 'Inactive'} subtext="System Record" icon={ShieldCheck} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <SectionCard title="Personal Information" icon={User}>
                <InfoRow icon={Mail} label="Email" value={selector.email} />
                <InfoRow icon={Phone} label="Phone" value={selector.phone} />
                <InfoRow icon={CheckCircle2} label="Account Status" value={selector.is_active ? 'Active' : 'Inactive'} />
              </SectionCard>

              <SectionCard title="Professional Background" icon={Briefcase}>
                <InfoRow icon={Award} label="Designation" value={selector.designation} />
                <InfoRow icon={Briefcase} label="Organization" value={selector.organization} />
                <InfoRow icon={Activity} label="Sport Expertise" value={selector.sport_expertise} />
                <InfoRow icon={Calendar} label="Years Experience" value={selector.years_experience ? `${selector.years_experience} years` : null} />
              </SectionCard>
            </div>
          </div>
        )}

        {/* ASSIGNED SPORTS */}
        {activeTab === 'sports' && (
          <div className="ui-card p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Activity size={15} />
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Assigned Sports Jurisdiction</h3>
              </div>
              <Badge variant="primary">{selector.sports?.length || 0} Sports</Badge>
            </div>

            {selector.sports?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selector.sports.map((sp) => (
                  <div key={sp.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                      🏆
                    </span>
                    <div>
                      <p className="font-bold text-foreground text-sm">{sp.sport_name}</p>
                      <p className="text-xs text-muted-foreground">Assigned: {new Date(sp.assigned_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No specific sports currently assigned to this selector.
              </div>
            )}
          </div>
        )}

        {/* SELECTION HISTORY */}
        {activeTab === 'history' && (
          <div className="ui-card p-6">
            <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <Trophy size={15} />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Selection & Evaluation History</h3>
            </div>

            {selector.history?.length > 0 ? (
              <div className="space-y-3">
                {selector.history.map((sh) => (
                  <div key={sh.id} className="rounded-xl border border-border bg-background p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-foreground text-sm">{sh.athlete_name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{sh.notes || 'Evaluation completed'}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{new Date(sh.created_at).toLocaleDateString()}</span>
                      <Badge variant={sh.action === 'selected' ? 'success' : sh.action === 'recommended' ? 'primary' : 'secondary'} className="capitalize">
                        {sh.action}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No selection history records found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectorProfile;
