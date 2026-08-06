import React, { forwardRef } from 'react';

/**
 * Labeled form input with optional icon and error message.
 */
const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  rightElement,
  className = '',
  id,
  required,
  ...props
}, ref) => {
  const inputId = id || props.name;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
          {required && <span className="ml-1 text-destructive font-bold" aria-hidden>*</span >}
        </label>
      )}
      <div className={Icon || rightElement ? 'input-icon-wrap' : ''}>
        {Icon && (
          <span className="input-icon" aria-hidden>
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input-field ${Icon ? 'pl-9' : ''} ${
            error
              ? '!border-destructive focus:!ring-destructive/20'
              : ''
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          required={required}
          {...props}
        />
        {rightElement}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className="field-hint">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

