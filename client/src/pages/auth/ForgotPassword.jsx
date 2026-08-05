import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import authAPI from '../../services/auth.service';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/ui/Button';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [isSent, setIsSent] = useState(false);

  const onSubmit = async (data) => {
    try {
      await authAPI.forgotPassword(data.email);
      setIsSent(true);
      toast.success('Reset link sent to your email.');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset link.');
    }
  };

  return (
    <AuthLayout>
      <div className="ui-card p-6 sm:p-8 fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-success mx-auto mb-4 flex items-center justify-center">
            <KeyRound size={24} />
          </div>
          <h1 className="section-title mb-1">Reset Password</h1>
          <p className="text-small text-muted">
            {isSent ? 'Check your email for the reset link.' : 'Enter your email to receive a reset link.'}
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="field">
              <label htmlFor="email" className="field-label">Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden><Mail size={16} /></span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                  })}
                  className={`auth-input ${errors.email ? 'is-error' : ''}`}
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <p className="field-error" role="alert">{errors.email.message}</p>}
            </div>
            <Button type="submit" variant="accent" loading={isSubmitting} className="w-full !h-12">
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-surface border border-border text-center text-small text-muted mb-2">
            If an account matches that email, we have sent a password reset link. Please check your inbox and spam folder.
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-small text-brand font-semibold hover:underline">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
