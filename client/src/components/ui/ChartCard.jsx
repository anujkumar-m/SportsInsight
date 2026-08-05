import React from 'react';
import Card, { CardHeader } from './Card';
import Badge from './Badge';

/**
 * Chart container with consistent header, padding, and height.
 */
const ChartCard = ({
  title,
  subtitle,
  badge,
  badgeVariant = 'blue',
  action,
  children,
  className = '',
  height,
}) => (
  <Card className={`flex flex-col ${className}`} hover>
    <CardHeader
      title={title}
      subtitle={subtitle}
      action={
        action || (badge ? <Badge variant={badgeVariant}>{badge}</Badge> : null)
      }
    />
    <div className="flex-1 w-full min-h-0" style={height ? { minHeight: height } : undefined}>
      {children}
    </div>
  </Card>
);

export default ChartCard;
