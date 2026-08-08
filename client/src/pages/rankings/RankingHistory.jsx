import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Trophy, Calendar } from 'lucide-react';
import { rankingService } from '../../services/rankingService';
import { athleteService } from '../../services/athleteService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const RankingHistory = () => {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [hRes, aRes] = await Promise.all([
          rankingService.getHistory(athleteId).catch(() => ({ data: [] })),
          athleteService.getAthleteById(athleteId).catch(() => ({ data: null })),
        ]);
        setHistory(hRes.data || []);
        setAthlete(aRes.data);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    if (athleteId) load();
  }, [athleteId]);

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Ranking History - ${athlete?.first_name} ${athlete?.last_name}`}
        subtitle={`Athlete Code: ${athlete?.athlete_code} • Sport: ${athlete?.sport_name || 'General'}`}
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/rankings')}>
            <ArrowLeft size={14} className="mr-1.5" /> Back to Leaderboard
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground">Ranking Progression Over Time</h3>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">No historical ranking data available for this athlete.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="rank_date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
              <YAxis reversed domain={[1, 'dataMax']} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} label={{ value: 'Rank Position (1 is best)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--muted-foreground)' } }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
              <Line type="monotone" dataKey="rank_position" stroke="#6366f1" strokeWidth={3} name="Rank #" />
              <Line type="monotone" dataKey="ranking_score" stroke="#10b981" strokeWidth={2} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default RankingHistory;
