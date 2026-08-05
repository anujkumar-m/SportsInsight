import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, UserCheck, Trophy, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight, ChevronDown, Zap, Activity, Calendar,
  Target, ClipboardList, Bell, Shield, Dumbbell, Medal,
  TrendingUp, UserCircle, Award, Brain, FileText, Menu, X,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { ROLE_COLORS } from '../../theme';

const ROLE_LABELS = {
  admin: 'Administrator',
  coach: 'Head Coach',
  selector: 'Team Selector',
  athlete: 'Academy Athlete',
};

/** Nested-capable nav config per role */
const ROLE_NAV = {
  admin: [
    { label: 'Overview', items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ]},
    { label: 'People', items: [
      { label: 'Athletes', icon: Users, path: '/athletes' },
      { label: 'Coaches', icon: UserCheck, path: '/coaches' },
      { label: 'Selectors', icon: Shield, path: '/selectors' },
    ]},
    { label: 'Operations', items: [
      { label: 'Sports & Categories', icon: Award, path: '/sports' },
      { label: 'Performance', icon: Activity, path: '/performance' },
      { label: 'Fitness', icon: Dumbbell, path: '/fitness' },
      { label: 'Attendance', icon: Calendar, path: '/attendance' },
      { label: 'Injuries', icon: Target, path: '/injuries' },
    ]},
    { label: 'Selection', items: [
      { label: 'Rankings', icon: Trophy, path: '/rankings' },
      { label: 'Selections', icon: Medal, path: '/selections' },
      { label: 'AI Generate List', icon: Brain, path: '/ai-generate', highlight: true },
    ]},
    { label: 'Insights', items: [
      { label: 'Analytics', icon: BarChart3, path: '/analytics' },
      { label: 'Reports', icon: FileText, path: '/reports' },
      { label: 'Notifications', icon: Bell, path: '/notifications' },
    ]},
  ],
  coach: [
    { label: 'Overview', items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ]},
    { label: 'Squad', items: [
      { label: 'My Athletes', icon: Users, path: '/athletes' },
      { label: 'Performance', icon: Activity, path: '/performance' },
      { label: 'Fitness', icon: Dumbbell, path: '/fitness' },
      { label: 'Attendance', icon: Calendar, path: '/attendance' },
    ]},
    { label: 'Tools', items: [
      { label: 'AI Generate List', icon: Brain, path: '/ai-generate', highlight: true },
      { label: 'Analytics', icon: BarChart3, path: '/analytics' },
      { label: 'Reports', icon: FileText, path: '/reports' },
      { label: 'Notifications', icon: Bell, path: '/notifications' },
    ]},
  ],
  selector: [
    { label: 'Overview', items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ]},
    { label: 'Selection', items: [
      { label: 'Athletes', icon: Users, path: '/athletes' },
      { label: 'Rankings', icon: Trophy, path: '/rankings' },
      { label: 'Selections', icon: Medal, path: '/selections' },
      { label: 'Compare Athletes', icon: TrendingUp, path: '/compare' },
      { label: 'AI Generate List', icon: Brain, path: '/ai-generate', highlight: true },
    ]},
    { label: 'Insights', items: [
      { label: 'Analytics', icon: BarChart3, path: '/analytics' },
      { label: 'Reports', icon: FileText, path: '/reports' },
      { label: 'Notifications', icon: Bell, path: '/notifications' },
    ]},
  ],
  athlete: [
    { label: 'Overview', items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'My Profile', icon: UserCircle, path: '/profile' },
    ]},
    { label: 'My Data', items: [
      { label: 'Performance', icon: Activity, path: '/performance' },
      { label: 'Fitness', icon: Dumbbell, path: '/fitness' },
      { label: 'Attendance', icon: Calendar, path: '/attendance' },
      { label: 'Injuries', icon: Target, path: '/injuries' },
      { label: 'Rankings', icon: Trophy, path: '/rankings' },
      { label: 'Coach Feedback', icon: ClipboardList, path: '/feedback' },
    ]},
    { label: 'Alerts', items: [
      { label: 'Notifications', icon: Bell, path: '/notifications' },
    ]},
  ],
};

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  const groups = ROLE_NAV[role] || [];
  const roleInfo = ROLE_COLORS[role] || ROLE_COLORS.admin;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isGroupOpen = (group) => {
    if (collapsed && !mobileOpen) return false;
    if (openGroups[group.label] !== undefined) return openGroups[group.label];
    return group.items.some((i) => location.pathname.startsWith(i.path));
  };

  const width = collapsed && !mobileOpen ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)';
  const showLabels = !collapsed || mobileOpen;

  const content = (
    <aside
      className="flex flex-col h-full transition-[width] duration-300 ease-out flex-shrink-0 relative"
      style={{
        width: mobileOpen ? 280 : width,
        background: '#0F172A',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
      aria-label="Main navigation"
    >
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-[68px] z-20 w-6 h-6 rounded-full flex items-center justify-center bg-gray-800 border border-white/10 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors hidden lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0 border-b border-white/5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: roleInfo.primary }}
        >
          <Zap size={18} color="#fff" />
        </div>
        {showLabels && (
          <div className="min-w-0 overflow-hidden">
            <p className="text-white font-semibold text-small leading-tight truncate">Sports Academy</p>
            <p className="text-xs text-slate-500 truncate">Performance Portal</p>
          </div>
        )}
        {mobileOpen && (
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
        {groups.map((group) => {
          const open = isGroupOpen(group);
          return (
            <div key={group.label}>
              {showLabels ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="sidebar-group-label w-full flex items-center justify-between cursor-pointer hover:text-slate-400 bg-transparent border-none text-left"
                >
                  {group.label}
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${open ? '' : '-rotate-90'}`}
                  />
                </button>
              ) : (
                <div className="h-2" />
              )}
              {(open || !showLabels) && group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={mobileOpen ? onMobileClose : undefined}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title={!showLabels ? item.label : undefined}
                  style={({ isActive }) =>
                    item.highlight && !isActive
                      ? { color: '#86EFAC', background: 'rgba(34,197,94,0.08)' }
                      : undefined
                  }
                >
                  <item.icon size={18} strokeWidth={1.75} />
                  {showLabels && (
                    <>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.highlight && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          AI
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}

        <div className="pt-2">
          {showLabels && <p className="sidebar-group-label">System</p>}
          <NavLink
            to="/settings"
            onClick={mobileOpen ? onMobileClose : undefined}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            title={!showLabels ? 'Settings' : undefined}
          >
            <Settings size={18} strokeWidth={1.75} />
            {showLabels && <span>Settings</span>}
          </NavLink>
        </div>
      </nav>

      {/* User + Logout */}
      <div className="flex-shrink-0 border-t border-white/5 p-3 space-y-2">
        {showLabels ? (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/[0.03]">
            <Avatar firstName={user?.firstName} lastName={user?.lastName} role={role} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-white text-small font-semibold truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs truncate" style={{ color: roleInfo.primary }}>
                {ROLE_LABELS[role] || role}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <Avatar firstName={user?.firstName} lastName={user?.lastName} role={role} size={36} />
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-item text-red-400 hover:!bg-red-500/10 hover:!text-red-300"
          title={!showLabels ? 'Logout' : undefined}
        >
          <LogOut size={18} strokeWidth={1.75} />
          {showLabels && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sticky sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0 flex-shrink-0 z-30">
        {content}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div className="h-full shadow-2xl">{content}</div>
          <button
            type="button"
            className="flex-1 bg-black/50 border-none cursor-default"
            aria-label="Close menu overlay"
            onClick={onMobileClose}
          />
        </div>
      )}
    </>
  );
};

export const MobileMenuButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center bg-sidebar text-white hover:bg-slate-800 transition-colors"
    aria-label="Open navigation menu"
  >
    <Menu size={18} />
  </button>
);

export default Sidebar;
