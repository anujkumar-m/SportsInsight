import React from 'react';

/**
 * Reusable surface card — shadow, border, rounded-xl, optional hover.
 */
const Card = ({
  children,
  className = '',
  padding = true,
  hover = false,
  as: Tag = 'div',
  ...props
}) => (
  <Tag
    className={`ui-card ${padding ? 'card-section' : ''} ${hover ? 'card-hover' : ''} ${className}`}
    {...props}
  >
    {children}
  </Tag>
);

export const CardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex flex-wrap items-start justify-between gap-3 mb-5 ${className}`}>
    <div className="min-w-0">
      {title && <h3 className="card-title">{title}</h3>}
      {subtitle && <p className="text-small text-muted mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

export default Card;
