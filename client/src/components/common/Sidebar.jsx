import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarCheck,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Medal,
  Menu,
  Shield,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../theme';

const navByRole = {
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Athletes', icon: Users, path: '/athletes' },
    { label: 'Coaches', icon: Shield, path: '/coaches' },
    { label: 'Selectors', icon: ClipboardList, path: '/selectors' },
    { label: 'Sports & Categories', icon: Trophy, path: '/sports' },
    { label: 'Rankings', icon: Medal, path: '/rankings' },
    { label: 'AI Generate List', icon: Sparkles, path: '/ai-generate' },
    { label: 'Reports', icon: FileText, path: '/reports' },
  ],
  coach: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Athletes', icon: Users, path: '/athletes' },
    { label: 'Performance', icon: Activity, path: '/performance' },
    { label: 'Fitness', icon: Gauge, path: '/fitness' },
    { label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
    { label: 'AI Generate List', icon: Sparkles, path: '/ai-generate' },
  ],
  selector: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Rankings', icon: Medal, path: '/rankings' },
    { label: 'Compare Athletes', icon: BarChart3, path: '/compare' },
    { label: 'Selection Lists', icon: ClipboardList, path: '/selections' },
    { label: 'AI Recommendations', icon: Sparkles, path: '/ai-generate' },
  ],
  athlete: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Performance', icon: Activity, path: '/performance' },
    { label: 'Fitness', icon: Gauge, path: '/fitness' },
    { label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
    { label: 'Rankings', icon: Medal, path: '/rankings' },
    { label: 'Feedback', icon: ClipboardList, path: '/feedback' },
  ],
};

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = navByRole[role] || navByRole.admin;

  useEffect(() => {
    if (mobileOpen) onMobileClose?.();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';

  const panel = (
    <aside className="flex h-full w-72 flex-col bg-gradient-navy text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground">
          AP
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">Athlete Intelligence</p>
          <p className="truncate text-xs text-sidebar-foreground/70">State Sports Academy</p>
        </div>
        {mobileOpen && (
          <button type="button" className="ml-auto lg:hidden" onClick={onMobileClose} aria-label="Close">
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            onClick={mobileOpen ? onMobileClose : undefined}
            className={({ isActive }) =>
              `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-xs uppercase tracking-wider text-sidebar-foreground/50">Signed in as</p>
        <p className="mt-1 text-sm font-medium text-sidebar-accent-foreground">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-xs text-sidebar-foreground/70">{ROLE_LABELS[role] || role}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-navy text-xs font-semibold text-navy-foreground ring-1 ring-white/20">
            {initials}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-3.5" /> Log out
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex">{panel}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onMobileClose}
            className="fixed inset-0 bg-navy/60"
          />
          <div className="relative z-10 h-full shadow-2xl">{panel}</div>
        </div>
      )}
    </>
  );
};

export const MobileMenuButton = ({ onClick }) => (
  <button type="button" className="lg:hidden" onClick={onClick} aria-label="Open navigation">
    <Menu className="size-5" />
  </button>
);

export default Sidebar;
