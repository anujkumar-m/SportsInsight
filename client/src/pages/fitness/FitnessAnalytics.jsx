import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Heart, Zap, ShieldAlert, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { fitnessService } from '../../services/fitnessService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const FitnessAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fitnessService.getAnalytics();
        setData(res.data);
      } catch (e) {
        toast.error('Failed to load fitness analytics.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading fitness analytics...</div>;

  const { summary, trends } = data || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fitness Analytics & Parameter Breakdown"
        subtitle="Academy-wide fitness parameter distribution and strength/endurance trends."
        action={
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/fitness')}>Back to List</Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase">Avg Strength Score</div>
          <div className="text-3xl font-extrabold text-foreground">{Math.round(summary?.avg_strength || 0)} / 100</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase">Avg Endurance Score</div>
          <div className="text-3xl font-extrabold text-primary">{Math.round(summary?.avg_endurance || 0)} / 100</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase">Avg Agility Score</div>
          <div className="text-3xl font-extrabold text-emerald-500">{Math.round(summary?.avg_agility || 0)} / 100</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase">Avg Flexibility Score</div>
          <div className="text-3xl font-extrabold text-indigo-500">{Math.round(summary?.avg_flexibility || 0)} / 100</div>
        </div>
      </div>
    </div>
  );
};

export default FitnessAnalytics;
