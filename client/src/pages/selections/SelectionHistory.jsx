import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { selectionService } from '../../services/selectionService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const SelectionHistory = () => {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    selectionService.getHistory({})
      .then(r => setHistory(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Selection Audit Trail & History"
        subtitle="Historical selection recommendations, trial results, and decisions"
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/selections')}>
            <ArrowLeft size={14} className="mr-1.5" /> Back to Dashboard
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">No historical selection decisions logged.</p>
        ) : (
          <div className="space-y-3">
            {history.map((h, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border bg-background space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>{h.first_name} {h.last_name} ({h.athlete_code})</span>
                  <span className="text-primary">{h.selection_score}% Score</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Trial: {h.selection_type} ({h.sport || 'General'})</span>
                  <span>{new Date(h.selection_date).toLocaleDateString()}</span>
                </div>
                {h.remarks && <p className="text-muted-foreground font-normal">{h.remarks}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectionHistory;
