import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import authAPI from '../../services/auth.service';

const ResetPassword = () => {
  const { register, handleSubmit, watch, formState } = useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
        <div className="surface-card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-bold">Invalid reset link</h1>
          <p className="mt-2 text-sm text-muted-foreground">This link is invalid or has expired.</p>
          <Link to="/forgot-password" className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground">
            Request new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="surface-card w-full max-w-md p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Passwords are hashed before storage and must be at least 8 characters.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit(async (data) => {
            try {
              await authAPI.resetPassword(token, data.password);
              toast.success('Password updated. Please sign in.');
              navigate('/login');
            } catch (error) {
              toast.error(error.message || 'Failed to reset password.');
            }
          })}
        >
          <div>
            <label className="text-sm font-medium" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
            />
            {formState.errors.password && (
              <p className="mt-1 text-xs text-destructive">{formState.errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="confirm">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              {...register('confirm', {
                required: 'Please confirm the password',
                validate: (v) => v === watch('password') || 'Passwords do not match',
              })}
            />
            {formState.errors.confirm && (
              <p className="mt-1 text-xs text-destructive">{formState.errors.confirm.message}</p>
            )}
          </div>
          <button className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            Update password
          </button>
        </form>
        <Link to="/login" className="mt-6 inline-block text-sm text-muted-foreground hover:text-primary">
          Back to login
        </Link>
      </div>
    </main>
  );
};

export default ResetPassword;
