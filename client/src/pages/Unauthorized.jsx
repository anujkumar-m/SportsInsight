import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="surface-card max-w-md p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">403 — Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your role does not have permission to open this workspace. Contact the academy administrator if
          you believe this is an error.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            to={user ? '/dashboard' : '/login'}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            {user ? 'Back to my dashboard' : 'Back to login'}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Unauthorized;
