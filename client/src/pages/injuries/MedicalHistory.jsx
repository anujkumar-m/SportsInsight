import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartPulse, FileText, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { injuryService } from '../../services/injuryService';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';

const MedicalHistory = () => {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [athlete, setAthlete] = useState(null);
  const [medicalData, setMedicalData] = useState({ injuries: [], medicalHistory: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [athRes, medRes] = await Promise.all([
          athleteService.getAthleteById(athleteId).catch(() => ({ data: null })),
          injuryService.getHistory(athleteId).catch(() => ({ data: { injuries: [], medicalHistory: [] } })),
        ]);
        setAthlete(athRes.data);
        setMedicalData(medRes.data || { injuries: [], medicalHistory: [] });
      } catch (e) {
        toast.error('Failed to load athlete medical history.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [athleteId]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading medical history...</div>;

  const { injuries } = medicalData;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Medical History - ${athlete?.first_name} ${athlete?.last_name}`}
        subtitle={`Athlete Code: ${athlete?.athlete_code} • ${athlete?.sport_name || 'General'}`}
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/injuries')}>Back to Register</Button>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">Complete Injury & Rehabilitation Register</h3>

        {injuries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No historical injury records found for this athlete.</p>
        ) : (
          <div className="space-y-4">
            {injuries.map((inj) => (
              <div key={inj.id} className="rounded-xl border border-border bg-background p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div>
                    <h4 className="text-base font-bold text-foreground">{inj.injury_type} ({inj.body_part || 'General'})</h4>
                    <p className="text-xs text-muted-foreground">Injury Date: {new Date(inj.injury_date).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={inj.severity === 'severe' || inj.severity === 'critical' ? 'danger' : 'warning'}>
                    {inj.severity} Severity
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><strong>Attending Doctor:</strong> {inj.doctor_name || 'N/A'}</div>
                  <div><strong>Hospital:</strong> {inj.hospital || 'N/A'}</div>
                  <div><strong>Recovery Status:</strong> {inj.recovery_status}</div>
                  <div><strong>Availability:</strong> {inj.availability_status}</div>
                </div>

                {inj.diagnosis && (
                  <div className="text-xs text-muted-foreground">
                    <strong>Diagnosis:</strong> {inj.diagnosis}
                  </div>
                )}
                {inj.treatment && (
                  <div className="text-xs text-muted-foreground">
                    <strong>Treatment:</strong> {inj.treatment}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalHistory;
