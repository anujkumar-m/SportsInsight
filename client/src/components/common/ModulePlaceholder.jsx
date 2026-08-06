import React from 'react';
import { Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '../widgets';

const ModulePlaceholder = ({
  title = 'Module Coming Soon',
  description = 'This module is part of the next release and will include full management, filters, and analytics.',
}) => {
  const navigate = useNavigate();

  return (
    <Panel title={title} description={description}>
      <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
          <Construction className="size-7" />
        </span>
        <p className="mt-4 text-sm font-medium">{title} — coming soon</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-6 inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-secondary"
        >
          Return to dashboard
        </button>
      </div>
    </Panel>
  );
};

export default ModulePlaceholder;
