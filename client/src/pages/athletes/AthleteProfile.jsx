// ─── pages/athletes/AthleteProfile.jsx ───────────────────
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, Activity, Calendar, Award, HeartPulse, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const StatBox = ({ label, value }) => (
  <div className="rounded-xl border border-border bg-card p-4 text-center">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-1 text-lg font-bold text-foreground">{value || '—'}</p>
  </div>
);

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

  return (
    <div className="fade-in space-y-6 pb-10">
      <PageHeader
        title="Athlete Profile"
        breadcrumb="Athletes"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={ChevronLeft} onClick={() => navigate('/athletes')}>Back</Button>
            <Button size="sm" leftIcon={Edit} onClick={() => navigate(`/athletes/${id}/edit`)}>Edit Profile</Button>
          </>
        }
      />

      {/* Profile Header */}
      <div className="ui-card flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-navy" />
        <div className="relative mt-8 sm:mt-4 grid size-24 shrink-0 place-items-center rounded-full bg-gradient-primary border-4 border-card text-2xl font-bold text-white shadow-md">
          {athlete.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <div className="relative sm:mt-12 flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-foreground">{athlete.full_name}</h2>
          <p className="text-muted-foreground">{athlete.athlete_code} • {athlete.sport_name || 'No Sport Assigned'}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Badge variant={athlete.medical_status === 'fit' ? 'success' : 'warning'}>Med: {athlete.medical_status}</Badge>
            <Badge variant={athlete.current_status === 'active' ? 'success' : 'secondary'}>{athlete.current_status}</Badge>
            <Badge variant="primary">{athlete.category_name || 'No Category'}</Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {['overview', 'medical', 'achievements', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBox label="Age" value={`${athlete.age} yrs`} />
              <StatBox label="Height" value={`${athlete.height_cm || '-'} cm`} />
              <StatBox label="Weight" value={`${athlete.weight_kg || '-'} kg`} />
              <StatBox label="BMI" value={athlete.bmi || '-'} />
            </div>
            <div className="ui-card p-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-4 flex items-center gap-2 font-semibold"><User size={16}/> Personal Info</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Email:</dt><dd>{athlete.email}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Phone:</dt><dd>{athlete.phone || '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">DOB:</dt><dd>{athlete.date_of_birth ? new Date(athlete.date_of_birth).toLocaleDateString() : '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Blood Group:</dt><dd>{athlete.blood_group || '—'}</dd></div>
                </dl>
              </div>
              <div>
                <h3 className="mb-4 flex items-center gap-2 font-semibold"><Activity size={16}/> Academy Details</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Coach:</dt><dd>{athlete.coach_name || 'Unassigned'}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Joining Date:</dt><dd>{athlete.joining_date ? new Date(athlete.joining_date).toLocaleDateString() : '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Guardian:</dt><dd>{athlete.guardian_name || '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Location:</dt><dd>{athlete.city ? `${athlete.city}, ${athlete.state}` : '—'}</dd></div>
                </dl>
              </div>
            </div>
          </>
        )}

        {activeTab === 'medical' && (
          <div className="ui-card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold"><HeartPulse size={16}/> Medical History</h3>
            {athlete.medical_history?.length > 0 ? (
              <div className="space-y-4">
                {athlete.medical_history.map((record) => (
                  <div key={record.id} className="rounded-lg border border-border p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{record.condition_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(record.record_date).toLocaleDateString()} • {record.condition_type}</p>
                      </div>
                      <Badge variant={record.severity === 'severe' ? 'danger' : 'warning'}>{record.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No medical history records found.</p>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="ui-card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold"><Award size={16}/> Achievements</h3>
            {athlete.achievements?.length > 0 ? (
              <div className="space-y-4">
                {athlete.achievements.map((ach) => (
                  <div key={ach.id} className="flex gap-4 rounded-lg border border-border p-4">
                    <div className="mt-1 text-2xl">🏆</div>
                    <div>
                      <p className="font-medium">{ach.title}</p>
                      <p className="text-xs text-muted-foreground">{ach.competition_name} • {new Date(ach.achievement_date).toLocaleDateString()}</p>
                      {ach.description && <p className="mt-2 text-sm">{ach.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No achievements recorded yet.</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="ui-card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold"><Calendar size={16}/> Timeline</h3>
            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-border">
              {athlete.history?.map((event) => (
                <div key={event.id} className="relative pl-10">
                  <div className="absolute left-3 top-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-card" />
                  <p className="text-sm font-medium">{event.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()} by {event.changed_by_name || 'System'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteProfile;
