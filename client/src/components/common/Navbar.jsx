import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import dashboardAPI from '../../services/dashboard.service';
import { ROLE_LABELS } from '../../theme';
import { MobileMenuButton } from './Sidebar';

const BREADCRUMB_MAP = {
  '/dashboard': 'Dashboard',
  '/ai-generate': 'AI Generate List',
  '/athletes': 'Athletes',
  '/coaches': 'Coaches',
  '/selectors': 'Selectors',
  '/sports': 'Sports & Categories',
  '/performance': 'Performance',
  '/fitness': 'Fitness',
  '/attendance': 'Attendance',
  '/injuries': 'Injuries',
  '/rankings': 'Rankings',
  '/selections': 'Selections',
  '/analytics': 'Analytics',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/compare': 'Compare Athletes',
  '/profile': 'My Profile',
  '/feedback': 'Coach Feedback',
  '/settings': 'Settings',
};

const Navbar = ({ title = 'Dashboard', subtitle, onMenuOpen }) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const crumb = BREADCRUMB_MAP[location.pathname] || title;
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';

  useEffect(() => {
    dashboardAPI
      .getNotifications()
      .then((d) => setNotifications(d.notifications || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const close = () => {
      setNotifOpen(false);
      setProfileOpen(false);
    };
    if (notifOpen || profileOpen) {
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
    }
  }, [notifOpen, profileOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
      <MobileMenuButton onClick={onMenuOpen} />

      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search athletes, sports, reports…"
          className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative grid size-9 place-items-center rounded-lg transition hover:bg-secondary"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-elevated)]">
              <div className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications</p>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div key={n.id} className="border-b border-border px-4 py-3 last:border-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message || n.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-secondary"
          >
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.firstName}
                className="size-9 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <span className="grid size-9 place-items-center rounded-full bg-navy text-xs font-semibold text-navy-foreground ring-1 ring-white/10">
                {initials}
              </span>
            )}
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="block text-xs text-muted-foreground">{ROLE_LABELS[role] || role}</span>
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-[var(--shadow-elevated)]">
              <div className="border-b border-border px-3 py-2.5 mb-1">
                <p className="text-xs font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {ROLE_LABELS[role] || role}
                </span>
              </div>
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition"
              >
                <User className="size-3.5 text-muted-foreground" /> View Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition"
              >
                <Settings className="size-3.5 text-muted-foreground" /> Account Settings
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
