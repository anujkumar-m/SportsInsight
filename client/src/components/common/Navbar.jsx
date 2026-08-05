import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Bell, Search, ChevronDown, User, Settings, LogOut, Check, X,
  Sparkles, Moon, Sun, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import dashboardAPI from '../../services/dashboard.service';
import Avatar from '../ui/Avatar';
import { COLORS, ROLE_COLORS } from '../../theme';
import { MobileMenuButton } from './Sidebar';

const NOTIF_COLORS = {
  info: COLORS.brand,
  success: COLORS.success,
  warning: COLORS.warning,
  danger: COLORS.danger,
};

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

const Navbar = ({ title = 'Dashboard', onMenuOpen }) => {
  const { user, logout, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifications, setNotifications] = useState([]);
  const profileRef = useRef();
  const notifRef = useRef();

  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.admin;
  const crumb = BREADCRUMB_MAP[location.pathname] || title;

  useEffect(() => {
    dashboardAPI.getNotifications()
      .then((d) => setNotifications(d.notifications || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id) => {
    await dashboardAPI.markNotificationRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <header
      className="sticky top-0 z-40 flex-shrink-0 bg-card border-b border-border"
      style={{ boxShadow: 'var(--shadow-xs)' }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 sm:px-6"
        style={{ height: 'var(--nav-h)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <MobileMenuButton onClick={onMenuOpen} />
          <div className="min-w-0">
            <nav className="flex items-center gap-1 text-xs text-muted mb-0.5" aria-label="Breadcrumb">
              <Link to="/dashboard" className="hover:text-brand transition-colors">Home</Link>
              <ChevronRight size={12} className="opacity-50" />
              <span className="text-text font-medium truncate">{crumb}</span>
            </nav>
            <h1 className="text-small sm:text-body font-bold text-text truncate leading-tight">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 h-10">
          {/* Search */}
          <div className="relative hidden md:flex items-center h-10">
            <Search size={15} className="absolute left-3 text-muted pointer-events-none" />
            <input
              type="search"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search…"
              aria-label="Search"
              className="h-10 w-44 lg:w-56 pl-9 pr-8 text-small rounded-lg border border-border bg-surface focus:bg-card focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 transition-all"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => setSearchVal('')}
                className="absolute right-2 p-1 text-muted hover:text-text rounded"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <p className="hidden xl:block text-xs text-muted px-2 whitespace-nowrap">{dateStr}</p>

          <Link
            to="/ai-generate"
            className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-xs font-semibold text-white bg-brand hover:bg-blue-700 transition-colors"
          >
            <Sparkles size={14} />
            AI List
          </Link>

          {/* Dark mode */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-border bg-surface text-muted hover:text-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              className="relative w-10 h-10 rounded-lg flex items-center justify-center border border-border bg-surface text-muted hover:text-text hover:bg-gray-100 transition-colors"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={notifOpen}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-[calc(100%+8px)] w-80 max-w-[calc(100vw-2rem)] bg-card rounded-xl border border-border z-50 overflow-hidden fade-in"
                style={{ boxShadow: 'var(--shadow-lg)' }}
                role="menu"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="font-semibold text-small text-text">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="badge badge-blue">{unreadCount} new</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="empty-state py-8">
                      <p className="empty-state-desc">No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        role="menuitem"
                        tabIndex={0}
                        className="px-4 py-3 hover:bg-surface cursor-pointer flex items-start gap-3 border-b border-border last:border-0"
                        style={{ background: n.is_read ? undefined : 'rgba(37,99,235,0.04)' }}
                        onClick={() => handleMarkRead(n.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleMarkRead(n.id)}
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: n.is_read ? '#D1D5DB' : (NOTIF_COLORS[n.type] || COLORS.brand) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-small font-semibold text-text truncate">{n.title}</p>
                          <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                        {!n.is_read && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                            className="text-brand p-0.5"
                            aria-label="Mark as read"
                          >
                            <Check size={13} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-border">
                    <Link
                      to="/notifications"
                      className="text-xs text-brand font-semibold hover:underline"
                      onClick={() => setNotifOpen(false)}
                    >
                      View all notifications →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 h-10 pl-1.5 pr-2 rounded-lg border border-border bg-surface hover:bg-gray-100 transition-colors"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              <Avatar firstName={user?.firstName} lastName={user?.lastName} role={role} size={28} />
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-text leading-none">{user?.firstName}</p>
                <p className="text-[10px] capitalize mt-0.5 font-medium" style={{ color: roleColor.primary }}>
                  {role}
                </p>
              </div>
              <ChevronDown size={12} className="text-muted hidden md:block" />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-[calc(100%+8px)] w-52 bg-card rounded-xl border border-border z-50 overflow-hidden fade-in"
                style={{ boxShadow: 'var(--shadow-lg)' }}
                role="menu"
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-semibold text-small text-text">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link to="/profile" role="menuitem" className="flex items-center gap-3 px-4 py-2.5 text-small text-text hover:bg-surface" onClick={() => setProfileOpen(false)}>
                    <User size={15} className="text-muted" /> My Profile
                  </Link>
                  <Link to="/settings" role="menuitem" className="flex items-center gap-3 px-4 py-2.5 text-small text-text hover:bg-surface" onClick={() => setProfileOpen(false)}>
                    <Settings size={15} className="text-muted" /> Settings
                  </Link>
                  <hr className="my-1 border-border" />
                  <button type="button" role="menuitem" onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-small text-danger hover:bg-red-50 w-full text-left">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
