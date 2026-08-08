import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fitnessService } from '../../services/fitnessService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const FitnessReports = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fitnessService.getAssessments({ limit: 50 });
        setAssessments(res.data?.assessments || []);
      } catch (e) {
        toast.error('Failed to load fitness reports.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fitness Evaluation Reports & Scorecards"
        subtitle="Printable and exportable official fitness assessment report sheets for coaches and selectors."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/fitness')}>
              <ArrowLeft size={14} className="mr-1.5" /> Back to List
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Printer size={14} className="mr-1.5" /> Print Reports
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {assessments.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 print:border-black">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">{a.first_name} {a.last_name}</h3>
                <p className="text-xs text-muted-foreground">Code: {a.athlete_code} • {a.sport_name}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Fitness Score</span>
                <div className="text-xl font-extrabold text-primary">{Math.round(a.overall_fitness_score || 0)} / 100</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><strong>Assessment Date:</strong> {new Date(a.assessment_date).toLocaleDateString()}</div>
              <div><strong>BMI:</strong> {a.bmi || 'N/A'}</div>
              <div><strong>Strength:</strong> {a.strength_score} pts</div>
              <div><strong>Endurance:</strong> {a.endurance_score} pts</div>
              <div><strong>Stamina:</strong> {a.stamina_score} pts</div>
              <div><strong>Agility:</strong> {a.agility_score} pts</div>
              <div><strong>Flexibility:</strong> {a.flexibility_score} pts</div>
              <div><strong>Speed:</strong> {a.speed_score} pts</div>
            </div>

            {a.notes && (
              <div className="text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-lg italic">
                Notes: "{a.notes}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FitnessReports;
