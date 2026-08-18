import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fitnessService } from '../../services/fitnessService';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/common/PageHeader';

const FitnessHistory = () => {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [athlete, setAthlete] = useState(null);
  const [historyData, setHistoryData] = useState({ assessments: [], timeline: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [athRes, fitRes] = await Promise.all([
          athleteService.getById(athleteId).catch(() => ({ data: null })),
          fitnessService.getHistory(athleteId).catch(() => ({ data: { assessments: [], timeline: [] } })),
        ]);
        const athleteObj = athRes?.data?.data || athRes?.data || null;
        const fitObj = fitRes?.data?.data || fitRes?.data || { assessments: [], timeline: [] };

        setAthlete(athleteObj);
        setHistoryData({
          assessments: Array.isArray(fitObj?.assessments) ? fitObj.assessments : Array.isArray(fitObj) ? fitObj : [],
          timeline: Array.isArray(fitObj?.timeline) ? fitObj.timeline : [],
        });
      } catch (e) {
        toast.error('Failed to load fitness history.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [athleteId]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading fitness history...</div>;

  const assessments = historyData.assessments || [];
  const timeline = historyData.timeline || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Fitness History - ${athlete?.first_name} ${athlete?.last_name}`}
        subtitle={`Athlete Code: ${athlete?.athlete_code} • ${athlete?.sport_name || 'General'}`}
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/fitness')}>Back to Assessments</Button>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">Historical Fitness Progress</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((a) => {
            const ai = a.ai_analysis;
            return (
              <div key={a.id} className="rounded-xl border border-border bg-background p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-xs text-muted-foreground">{new Date(a.assessment_date).toLocaleDateString()}</span>
                  <Badge variant="success">Grade {ai?.fitnessGrade || 'A'}</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-medium">Overall Score</span>
                  <span className="text-xl font-black text-primary">{Math.round(a.overall_fitness_score || 0)} / 100</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>Strength: <span className="font-bold text-foreground">{a.strength_score}</span></div>
                  <div>Endurance: <span className="font-bold text-foreground">{a.endurance_score}</span></div>
                  <div>Stamina: <span className="font-bold text-foreground">{a.stamina_score}</span></div>
                  <div>Agility: <span className="font-bold text-foreground">{a.agility_score}</span></div>
                </div>

                {ai?.coachRecommendation && (
                  <div className="text-[11px] text-muted-foreground bg-secondary/50 p-2 rounded-lg">
                    <Sparkles size={11} className="inline mr-1 text-primary" /> {ai.coachRecommendation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FitnessHistory;
