import React from 'react';
import { Construction } from 'lucide-react';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';

const ModulePlaceholder = ({
  title = 'Module Coming Soon',
  description = 'This module is part of the next release and will include full management, filters, and analytics.',
}) => {
  const navigate = useNavigate();

  return (
    <div className="page-shell max-w-3xl">
      <div>
        <h2 className="page-title">{title}</h2>
        <p className="text-small text-muted mt-1">Module preview</p>
      </div>
      <Card>
        <EmptyState
          icon={Construction}
          title={`${title} — Next Phase`}
          description={description}
          minHeight={280}
          action={
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          }
        />
      </Card>
    </div>
  );
};

export default ModulePlaceholder;
