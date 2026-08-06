import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import authAPI from '../../services/auth.service';

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState } = useForm();

  const onSubmit = async (data) => {
    try {
      await authAPI.forgotPassword(data.email);
      setSent(true);
      toast.success('Reset link sent if the email is registered.');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset link.');
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="surface-card w-full max-w-md p-8">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/15 text-success">
              <MailCheck className="size-7" />
            </span>
            <h1 className="mt-5 text-xl font-bold tracking-tight">Reset link sent</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If the address is registered, a reset link valid for 15 minutes has been dispatched.
            </p>
            <Link
              to="/reset-password"
              className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Open reset form
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your academy email and we&apos;ll send a secure reset link.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="text-sm font-medium" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                  placeholder="you@academy.gov"
                  {...register('email', { required: 'Email is required' })}
                />
                {formState.errors.email && (
                  <p className="mt-1 text-xs text-destructive">{formState.errors.email.message}</p>
                )}
              </div>
              <button className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                Send reset link
              </button>
            </form>
          </>
        )}
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Back to login
        </Link>
      </div>
    </main>
  );
};

export default ForgotPassword;
