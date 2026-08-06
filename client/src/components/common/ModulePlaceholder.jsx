import React from 'react';
import { Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '../widgets';
import PageHeader from './PageHeader';
import Button from '../ui/Button';

const ModulePlaceholder = ({
  title = 'Module Coming Soon',
  description = 'This module is part of the next release and will include full management, filters, and analytics.',
}) => {
  const navigate = useNavigate();

  return (
    <div className="fade-in space-y-6">
      <PageHeader title={title} subtitle={description} breadcrumb="Module" />
      <Panel title={title} description={description}>
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center p-6">
          <span className="grid size-16 place-items-center rounded-2xl bg-secondary text-muted-foreground shadow-xs">
            <Construction className="size-8" />
          </span>
          <p className="mt-4 text-base font-semibold text-foreground">{title} — coming soon</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="mt-6"
          >
            Return to dashboard
          </Button>
        </div>
      </Panel>
    </div>
  );
};

export default ModulePlaceholder;

