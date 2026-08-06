import React from 'react';
import { useNavigate } from 'react-router-dom';

const VARIANT_CLASS = {
  primary: 'btn-primary',
  emerald: 'btn-outline',
  purple: 'btn-outline',
  default: 'btn-outline',
};

const QuickActionsBar = ({ actions = [] }) => {
  const navigate = useNavigate();
  if (!actions.length) return null;

  return (
    <div className="ui-card card-section fade-in">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Quick Actions</h4>
        <span className="text-xs text-brand font-medium">1-click workflows</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          const key = action.primary ? 'primary' : (action.variant || 'default');
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (action.path) navigate(action.path);
                else if (action.onClick) action.onClick();
              }}
              className={`${VARIANT_CLASS[key] || VARIANT_CLASS.default} !h-10`}
            >
              {Icon && <Icon size={16} strokeWidth={2} />}
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionsBar;
