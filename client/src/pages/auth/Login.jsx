import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Activity, BarChart3, Loader2, Lock, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Administrator', email: 'admin@sportsacademy.com', password: 'Admin@123' },
  { label: 'Head Coach', email: 'coach.rajesh@sportsacademy.com', password: 'Admin@123' },
  { label: 'State Selector', email: 'selector.vikram@sportsacademy.com', password: 'Admin@123' },
  { label: 'Athlete', email: 'athlete.arjun@sportsacademy.com', password: 'Admin@123' },
];

/** Determine where to navigate after any login based on role */
function getDestination(role, from) {
  if (role === 'unassigned') return '/pending-role';
  return from || '/dashboard';
}

const Login = () => {
  const { register, handleSubmit, setValue, formState } = useForm();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  async function onSubmit(values) {
    setLoading(true);
    try {
      const userObj = await login(values.identifier, values.password);
      toast.success('Welcome back!');
      navigate(getDestination(userObj?.role, from), { replace: true });
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setGoogleLoading(true);
    try {
      const userObj = await googleLogin(credentialResponse.credential);
      toast.success(`Welcome, ${userObj.firstName || userObj.email}!`);
      navigate(getDestination(userObj.role, from), { replace: true });
    } catch (error) {
      toast.error(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleGoogleError() {
    toast.error('Google sign-in was cancelled or failed.');
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-gradient-navy p-12 text-navy-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground">
            AP
          </span>
          <div>
            <p className="text-sm font-semibold">Athlete Intelligence</p>
            <p className="text-xs text-navy-foreground/70">State Sports Academies</p>
          </div>
        </div>

        <div className="max-w-lg">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Integrated athlete performance, analytics and selection intelligence.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-navy-foreground/75">
            One connected system for coaches, selectors and administrators — performance monitoring,
            fitness tracking, rankings and AI-assisted selection lists built on your academy&apos;s
            historical data.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Activity, label: 'Performance monitoring' },
              { icon: BarChart3, label: 'Analytics & rankings' },
              { icon: Sparkles, label: 'AI generated lists' },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <f.icon className="size-5 text-accent" />
                <p className="mt-3 text-xs font-medium text-navy-foreground/85">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-navy-foreground/50">Role-based access control · Secure sessions · Audit logged</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="size-6" />
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight">Sign in to your workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use your academy credentials or Google account.</p>

          {/* ─── Google Sign-In ─────────────────────────── */}
          <div className="mt-7">
            {googleLoading ? (
              <div className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Signing in with Google…
              </div>
            ) : (
              <div id="google-signin-btn" className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  width="100%"
                  size="large"
                  shape="rectangular"
                  theme="outline"
                  text="signin_with"
                  logo_alignment="left"
                />
              </div>
            )}
          </div>

          {/* ─── Divider ───────────────────────────────── */}
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or continue with email</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* ─── Email / Password Form ─────────────────── */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm font-medium" htmlFor="identifier">
                Email or username
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                placeholder="you@academy.gov"
                {...register('identifier', { required: 'Email or username is required' })}
              />
              {formState.errors.identifier && (
                <p className="mt-1 text-xs text-destructive">{formState.errors.identifier.message}</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                {...register('password', { required: 'Password is required' })}
              />
              {formState.errors.password && (
                <p className="mt-1 text-xs text-destructive">{formState.errors.password.message}</p>
              )}
            </div>
            <button
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-dashed border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demo accounts</p>
            <div className="mt-3 grid gap-2">
              {DEMO_ACCOUNTS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => {
                    setValue('identifier', u.email);
                    setValue('password', u.password);
                  }}
                  className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-left text-xs transition hover:bg-secondary/70"
                >
                  <span className="font-medium">{u.label}</span>
                  <span className="text-muted-foreground">{u.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;

