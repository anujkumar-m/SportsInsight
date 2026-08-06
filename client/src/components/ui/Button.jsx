import React from 'react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  success: 'btn-success',
  warning: 'btn-warning',
  danger: 'btn-danger',
  destructive: 'btn-danger',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  accent: 'btn-accent',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

/**
 * Consistent button system — Primary / Secondary / Success / Warning / Danger / Outline / Ghost / Accent
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
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      className={`btn-base ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      style={style}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block size-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
          aria-hidden
        />
      ) : (
        LeftIcon && <LeftIcon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      )}
      {children && <span>{children}</span>}
      {!loading && RightIcon && <RightIcon className="size-4 shrink-0" strokeWidth={2} aria-hidden />}
    </button>
  );
};

export default Button;

