import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck, UserCheck, Shield, Users,
  ArrowRight, Zap, Activity, Trophy, BarChart3, CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { COLORS } from '../../theme';

const DEMO_ACCOUNTS = [
  { label: 'Admin', identifier: 'admin', password: 'Admin@123', icon: ShieldCheck, color: COLORS.brand },
  { label: 'Coach', identifier: 'coach.rajesh', password: 'Admin@123', icon: UserCheck, color: COLORS.success },
  { label: 'Selector', identifier: 'selector.vikram', password: 'Admin@123', icon: Shield, color: COLORS.warning },
  { label: 'Athlete', identifier: 'athlete.arjun', password: 'Admin@123', icon: Users, color: COLORS.brand },
];

const FEATURES = [
  { icon: Activity, text: 'Real-time performance monitoring' },
  { icon: Trophy, text: 'AI-assisted athlete selection' },
  { icon: BarChart3, text: 'Academy-wide analytics & reports' },
];

const Login = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [demoLoading, setDemoLoading] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    try {
      await login(data.identifier, data.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.');
    }
  };

  const handleDemoLogin = async (acc) => {
    setDemoLoading(acc.label);
    try {
      await login(acc.identifier, acc.password);
      toast.success(`Logged in as ${acc.label}`);
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Demo login failed.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="login-split">
      {/* Left — brand panel */}
      <aside className="login-hero" aria-hidden={false}>
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center">
              <Zap size={22} color="#fff" />
            </div>
            <div>
              <p className="font-bold text-body text-white">Sports Academy</p>
              <p className="text-small text-slate-400">Performance Intelligence Portal</p>
            </div>
          </div>

          <h1 className="page-title !text-white !text-[36px] mb-4">
            Athlete Performance Monitoring & Selection
          </h1>
          <p className="text-body text-slate-300 mb-10 leading-relaxed">
            A unified platform for administrators, coaches, selectors, and athletes to track performance, fitness, attendance, rankings, and selection decisions.
          </p>

          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-small text-slate-200">
                <span className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <f.icon size={16} className="text-blue-400" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-xs text-slate-500">State Sports Academy · Secure access for authorized personnel</p>
          </div>
        </div>
      </aside>

      {/* Right — login card */}
      <div className="login-panel">
        <div className="w-full max-w-[420px] fade-in">
          <div className="ui-card p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand mx-auto mb-4 flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <h2 className="section-title mb-1">Welcome back</h2>
              <p className="text-small text-muted">Sign in to your academy account</p>
            </div>

            {/* Demo login */}
            <div className="mb-6 p-3 rounded-xl bg-surface border border-border">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide text-center mb-3">
                Quick Demo Login
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon;
                  const loading = demoLoading === acc.label;
                  return (
                    <button
                      key={acc.label}
                      type="button"
                      onClick={() => handleDemoLogin(acc)}
                      disabled={!!demoLoading || isSubmitting}
                      className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-lg border border-border bg-card hover:border-brand hover:bg-blue-50 transition-all disabled:opacity-60 text-text"
                    >
                      {loading
                        ? <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        : <Icon size={16} style={{ color: acc.color }} />}
                      <span className="text-xs font-semibold">{acc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted">or continue with credentials</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="field">
                <label htmlFor="identifier" className="field-label">Email or Username</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden><Mail size={16} /></span>
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    {...register('identifier', { required: 'Email or username is required' })}
                    className={`auth-input ${errors.identifier ? 'is-error' : ''}`}
                    placeholder="Enter email or username"
                  />
                </div>
                {errors.identifier && (
                  <p className="field-error" role="alert">{errors.identifier.message}</p>
                )}
              </div>

              <div className="field">
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="field-label !mb-0">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-brand hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden><Lock size={16} /></span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password', { required: 'Password is required' })}
                    className={`auth-input ${errors.password ? 'is-error' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="auth-input-action"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="field-error" role="alert">{errors.password.message}</p>
                )}
              </div>

              <label className="flex items-center gap-2 text-small text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-brand focus:ring-brand"
                />
                Remember me on this device
              </label>

              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={!!demoLoading}
                className="w-full !h-12"
                rightIcon={ArrowRight}
              >
                Sign In
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted mt-6 flex items-center justify-center gap-1.5">
            <CheckCircle2 size={12} className="text-success" />
            Authorized academy personnel only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
