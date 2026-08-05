import React from 'react';
import { ROLE_COLORS } from '../../theme';

/**
 * Initials avatar with optional role color.
 */
const Avatar = ({
  firstName = '',
  lastName = '',
  name,
  role = 'admin',
  size = 32,
  className = '',
}) => {
  const initials = name
    ? name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const color = ROLE_COLORS[role]?.primary || ROLE_COLORS.admin.primary;
  const fontSize = Math.max(10, Math.round(size * 0.35));

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: color, fontSize }}
      aria-hidden
    >
      {initials || '?'}
    </div>
  );
};

export default Avatar;
