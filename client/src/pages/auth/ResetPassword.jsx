import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import authAPI from '../../services/auth.service';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/ui/Button';

const ResetPassword = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const password = watch('password');

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
      return;
    }
    try {
      await authAPI.resetPassword(token, data.password);
      toast.success('Password reset successfully! You can now log in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Failed to reset password.');
    }
  };

  if (!token) {
    return (
      <AuthLayout>
        <div className="ui-card p-8 text-center fade-in">
          <div className="w-12 h-12 bg-red-50 rounded-xl mx-auto mb-4 flex items-center justify-center text-danger">
            <Lock size={22} />
          </div>
          <h1 className="section-title mb-2">Invalid Link</h1>
          <p className="text-small text-muted mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn-primary w-full">Request New Link</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="ui-card p-6 sm:p-8 fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand mx-auto mb-4 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <h1 className="section-title mb-1">Set New Password</h1>
          <p className="text-small text-muted">Please enter your new secure password</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="field">
            <label htmlFor="password" className="field-label">New Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden><Lock size={16} /></span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Must be at least 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Must contain uppercase, lowercase, and a number',
                  },
                })}
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
            {errors.password && <p className="field-error" role="alert">{errors.password.message}</p>}
          </div>

          <div className="field">
            <label htmlFor="confirmPassword" className="field-label">Confirm Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden><Lock size={16} /></span>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                className={`auth-input ${errors.confirmPassword ? 'is-error' : ''}`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="field-error" role="alert">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" variant="primary" loading={isSubmitting} className="w-full !h-12">
            Reset Password
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
