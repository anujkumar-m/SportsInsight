import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import authAPI from '../../services/auth.service';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-hot-toast';
import { User, Shield, Phone, Mail, CheckCircle2, Sparkles, Activity } from 'lucide-react';
import { ROLE_LABELS } from '../../theme';
import AthleteProfile from '../athletes/AthleteProfile';

export default function UserProfile() {
  const { user, role, setUser } = useAuth();

  if (role === 'athlete') {
    return <AthleteProfile />;
  }

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    try {
      setUpdatingProfile(true);
      const res = await authAPI.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      });
      toast.success('Profile updated successfully');
      if (res?.data?.user) {
        setUser((prev) => ({
          ...prev,
          firstName: res.data.user.first_name,
          lastName: res.data.user.last_name,
          phone: res.data.user.phone,
        }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const initials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal details, account security, and active preferences."
        breadcrumb="Profile"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - User Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-navy text-2xl font-bold text-navy-foreground ring-4 ring-primary/20 shadow-md">
              {initials}
            </div>

            <h3 className="mt-4 text-xl font-bold text-card-foreground">
              {formData.firstName} {formData.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">{formData.email}</p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Shield className="size-3.5" />
                {ROLE_LABELS[role] || role?.toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Active
              </span>
            </div>

            <div className="mt-6 border-t border-border pt-4 text-left space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Mail className="size-4 text-primary" /> Email
                </span>
                <span className="font-medium text-card-foreground truncate max-w-[160px]">{formData.email}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Phone className="size-4 text-primary" /> Phone
                </span>
                <span className="font-medium text-card-foreground">{formData.phone || 'Not set'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
            <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" /> Account Privileges
            </h4>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" /> Access role-tailored dashboard insights
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" /> Manage assigned sports and athlete metrics
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" /> Export intelligence reports and AI analytics
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Personal Details Form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-6 py-4">
              <User className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Personal Details</h3>
            </div>

            {/* Form Body */}
            <div className="p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    {updatingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
