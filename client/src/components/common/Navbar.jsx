import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, User, Settings, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
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

  const loadNotifications = () => {
    dashboardAPI
      .getNotifications()
      .then((d) => {
        const list = d?.data?.notifications || d?.notifications || [];
        setNotifications(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
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

  const handleMarkRead = async (id, link) => {
    try {
      await dashboardAPI.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      if (link) {
        setNotifOpen(false);
        navigate(link);
      }
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await dashboardAPI.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (_) {}
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await dashboardAPI.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (_) {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="size-4 text-success shrink-0" />;
      case 'warning':
        return <AlertTriangle className="size-4 text-warning shrink-0" />;
      case 'danger':
        return <ShieldAlert className="size-4 text-destructive shrink-0" />;
      default:
        return <Info className="size-4 text-primary shrink-0" />;
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-3.5 backdrop-blur sm:px-6">
      <MobileMenuButton onClick={onMenuOpen} />

      <div className="flex items-center gap-2 min-w-0 md:hidden">
        <span className="truncate text-sm font-bold text-foreground">
          {crumb}
        </span>
      </div>

      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search athletes, sports, reports…"
          className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
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
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] z-50 sm:w-96 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl fade-in">
              <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <CheckCheck className="size-3.5" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkRead(n.id, n.link)}
                      className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-secondary/40 ${
                        !n.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="mt-0.5">{renderTypeIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs ${!n.is_read ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'}`}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="size-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message || n.body}
                        </p>
                        {n.created_at && (
                          <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotif(e, n.id)}
                        className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        title="Dismiss"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
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
