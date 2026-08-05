import React from 'react';

const VARIANTS = {
  blue: 'badge-blue',
  green: 'badge-green',
  amber: 'badge-amber',
  red: 'badge-red',
  gray: 'badge-gray',
  success: 'badge-green',
  warning: 'badge-amber',
  danger: 'badge-red',
  primary: 'badge-blue',
};

const Badge = ({ children, variant = 'gray', className = '', ...props }) => (
  <span className={`badge ${VARIANTS[variant] || VARIANTS.gray} ${className}`} {...props}>
    {children}
  </span>
);

export default Badge;
