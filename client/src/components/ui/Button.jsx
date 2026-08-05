import React from 'react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  accent: 'btn-accent',
};

const SIZES = {
  sm: { height: 32, padding: '0 12px', fontSize: 12 },
  md: {},
  lg: { height: 48, padding: '0 20px', fontSize: 16 },
};

/**
 * Consistent button system — Primary / Secondary / Danger / Outline / Ghost
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  style,
  ...props
}) => {
  const sizeStyle = SIZES[size] || {};
  return (
    <button
      type={type}
      className={`${VARIANTS[variant] || VARIANTS.primary} ${className}`}
      disabled={disabled || loading}
      style={{ ...sizeStyle, ...style }}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden
        />
      ) : (
        LeftIcon && <LeftIcon size={16} strokeWidth={2} aria-hidden />
      )}
      {children}
      {!loading && RightIcon && <RightIcon size={16} strokeWidth={2} aria-hidden />}
    </button>
  );
};

export default Button;
