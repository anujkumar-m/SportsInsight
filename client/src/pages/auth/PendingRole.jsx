import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PendingRole = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-warning/10 ring-8 ring-warning/5">
          <Clock className="size-10 text-warning" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Role Assignment Pending
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your account has been created successfully but a role hasn&apos;t been assigned yet.
          Please contact the academy administrator to assign your role.
        </p>

        {/* User info card */}
        {user && (
          <div className="mt-6 rounded-xl border border-border bg-card p-4 text-left">
            <div className="flex items-center gap-3">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.firstName}
                  className="size-10 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {(user.firstName?.[0] || '?').toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                Unassigned
              </span>
            </div>
          </div>
        )}

        {/* Info steps */}
        <div className="mt-6 grid gap-3 text-left">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
            <div>
              <p className="text-sm font-medium text-foreground">Contact the admin</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ask the academy administrator to assign you a role (Athlete, Coach, or State Selector).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
            <div>
              <p className="text-sm font-medium text-foreground">Sign in again</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Once the admin assigns your role, sign out and sign back in with Google to access your dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Admin contact hint */}
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-dashed border-border bg-card/50 px-4 py-3">
          <Mail className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {(import.meta.env.VITE_ADMIN_EMAIL || 'samshibin1125@gmail.com').split(',').length > 1 ? 'Admin accounts: ' : 'Admin account: '}
            <span className="font-medium text-foreground">
              {(import.meta.env.VITE_ADMIN_EMAIL || 'samshibin1125@gmail.com').split(',').map(email => email.trim()).join(', ')}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleLogout}
            id="pending-role-logout-btn"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
          <button
            onClick={() => window.location.reload()}
            id="pending-role-refresh-btn"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <ShieldCheck className="size-4" />
            Check again
          </button>
        </div>
      </div>
    </main>
  );
};

export default PendingRole;
