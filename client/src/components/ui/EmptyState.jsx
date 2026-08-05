import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = 'There is no data to display.',
  action,
  className = '',
  minHeight = 180,
}) => (
  <div className={`empty-state ${className}`} style={{ minHeight }} role="status">
    <div className="empty-state-icon">
      <Icon size={22} strokeWidth={1.75} />
    </div>
    <p className="empty-state-title">{title}</p>
    {description && <p className="empty-state-desc">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
