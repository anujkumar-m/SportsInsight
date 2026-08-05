import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import authAPI from '../../services/auth.service';
import AuthLayout from '../../layouts/AuthLayout';

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
      <div className="glass p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-20" />
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-white/20 shadow-inner">
            <KeyRound size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Reset Password
          </h2>
          <p className="text-sm text-blue-200">
            {isSent 
              ? "Check your email for the reset link." 
              : "Enter your email to receive a reset link."}
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
                  })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-900/50 transition-all disabled:opacity-70 flex items-center justify-center"
            >
              {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center mb-6">
            <p className="text-sm text-blue-100">
              If an account matches that email, we have sent a password reset link. Please check your inbox and spam folder.
            </p>
          </div>
        )}

        <div className="mt-6 text-center relative z-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
