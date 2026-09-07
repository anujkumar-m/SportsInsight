import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-hot-toast';
import {
  Sun,
  Moon,
  Bell,
  Smartphone,
  Globe,
  Sliders,
  Database,
  CheckCircle,
  Cpu,
} from 'lucide-react';

export default function SettingsPage() {
  const { theme, toggleTheme, setTheme } = useTheme();

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    performanceUpdates: true,
    weeklyDigest: false,
    selectionAnnouncements: true,
  });

  // Display Preferences State
  const [density, setDensity] = useState('comfortable');

  const handleToggleNotif = (key) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      toast.success('Notification preferences updated');
      return next;
    });
  };

  return (
    <div className="fade-in space-y-6 max-w-5xl">
      <PageHeader
        title="Application Settings"
        subtitle="Customize display theme, notification preferences, and system diagnostics."
        breadcrumb="Settings"
      />

      {/* Theme & Interface Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sun className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-card-foreground">Appearance & Theme</h3>
            <p className="text-xs text-muted-foreground">Select your visual interface theme preference</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center justify-between rounded-xl border p-4 transition text-left ${
              theme === 'light'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-card hover:bg-secondary/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                <Sun className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">Light Mode</p>
                <p className="text-xs text-muted-foreground">Clean, high-contrast daylight view</p>
              </div>
            </div>
            {theme === 'light' && <CheckCircle className="size-5 text-primary" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-between rounded-xl border p-4 transition text-left ${
              theme === 'dark'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-card hover:bg-secondary/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Moon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Sleek, low-light dark aesthetics</p>
              </div>
            </div>
            {theme === 'dark' && <CheckCircle className="size-5 text-primary" />}
          </button>
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Bell className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-card-foreground">Notifications & Alerts</h3>
            <p className="text-xs text-muted-foreground">Manage real-time notifications and email reports</p>
          </div>
        </div>

        <div className="space-y-4 divide-y divide-border">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-semibold text-card-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive important account & performance updates via email</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.emailAlerts}
              onChange={() => handleToggleNotif('emailAlerts')}
              className="size-5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-semibold text-card-foreground">Performance & Fitness Assessment Alerts</p>
              <p className="text-xs text-muted-foreground">Notify when new performance records or fitness metrics are logged</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.performanceUpdates}
              onChange={() => handleToggleNotif('performanceUpdates')}
              className="size-5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-semibold text-card-foreground">Selection & Ranking Updates</p>
              <p className="text-xs text-muted-foreground">Get notified when AI selection lists or official rankings change</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.selectionAnnouncements}
              onChange={() => handleToggleNotif('selectionAnnouncements')}
              className="size-5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-semibold text-card-foreground">Weekly Digest Email</p>
              <p className="text-xs text-muted-foreground">Summary email every Monday detailing academy statistics</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.weeklyDigest}
              onChange={() => handleToggleNotif('weeklyDigest')}
              className="size-5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* System Info Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="grid size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
            <Cpu className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-card-foreground">System Information</h3>
            <p className="text-xs text-muted-foreground">SportsInsight Engine & API status</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div className="flex flex-col justify-between bg-secondary/30 p-3.5 rounded-lg space-y-1">
            <span className="font-medium text-muted-foreground">Application Version</span>
            <span className="font-semibold text-card-foreground text-sm">v3.2.0 (Integrated)</span>
          </div>
          <div className="flex flex-col justify-between bg-secondary/30 p-3.5 rounded-lg space-y-1">
            <span className="font-medium text-muted-foreground">Backend API Engine</span>
            <span className="font-semibold text-card-foreground text-sm">Express + Node.js</span>
          </div>
          <div className="flex flex-col justify-between bg-secondary/30 p-3.5 rounded-lg space-y-1">
            <span className="font-medium text-muted-foreground">Database Backend</span>
            <span className="font-semibold text-card-foreground text-sm">MySQL 8.0 (sports_acadmey)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
