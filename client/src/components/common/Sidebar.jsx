import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, UserCheck, Trophy, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight, Zap, Activity, Calendar,
  Target, ClipboardList, Bell, Shield, Dumbbell, Medal,
  TrendingUp, UserCircle, Award, Brain, FileText
} from 'lucide-react';

const ROLE_COLORS = {
  admin: '#2563EB',
  coach: '#10B981',
  selector: '#F59E0B',
  athlete: '#8B5CF6',
};

const ROLE_NAV = {
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Athletes', icon: Users, path: '/athletes' },
    { label: 'Coaches', icon: UserCheck, path: '/coaches' },
    { label: 'Selectors', icon: Shield, path: '/selectors' },
    { label: 'Sports & Categories', icon: Award, path: '/sports' },
    { label: 'Performance', icon: Activity, path: '/performance' },
    { label: 'Fitness', icon: Dumbbell, path: '/fitness' },
    { label: 'Attendance', icon: Calendar, path: '/attendance' },
    { label: 'Injuries', icon: Target, path: '/injuries' },
    { label: 'Rankings', icon: Trophy, path: '/rankings' },
    { label: 'Selections', icon: Medal, path: '/selections' },
    { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { label: 'AI Generate List', icon: Brain, path: '/ai-generate', highlight: true },
    { label: 'Reports', icon: FileText, path: '/reports' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
  ],
  coach: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Athletes', icon: Users, path: '/athletes' },
    { label: 'Performance', icon: Activity, path: '/performance' },
    { label: 'Fitness', icon: Dumbbell, path: '/fitness' },
    { label: 'Attendance', icon: Calendar, path: '/attendance' },
    { label: 'AI Generate List', icon: Brain, path: '/ai-generate', highlight: true },
    { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { label: 'Reports', icon: FileText, path: '/reports' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
  ],
  selector: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Athletes', icon: Users, path: '/athletes' },
    { label: 'Rankings', icon: Trophy, path: '/rankings' },
    { label: 'Selections', icon: Medal, path: '/selections' },
    { label: 'Compare Athletes', icon: TrendingUp, path: '/compare' },
    { label: 'AI Generate List', icon: Brain, path: '/ai-generate', highlight: true },
    { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { label: 'Reports', icon: FileText, path: '/reports' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
  ],
  athlete: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Profile', icon: UserCircle, path: '/profile' },
    { label: 'Performance', icon: Activity, path: '/performance' },
    { label: 'Fitness', icon: Dumbbell, path: '/fitness' },
    { label: 'Attendance', icon: Calendar, path: '/attendance' },
    { label: 'Injuries', icon: Target, path: '/injuries' },
    { label: 'Rankings', icon: Trophy, path: '/rankings' },
    { label: 'Coach Feedback', icon: ClipboardList, path: '/feedback' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
  ],
};

const Sidebar = () => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = ROLE_NAV[role] || [];
  const roleColor = ROLE_COLORS[role] || '#2563EB';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className="flex flex-col h-screen transition-all duration-300 relative flex-shrink-0"
      style={{
        width: collapsed ? '72px' : '256px',
        background: 'linear-gradient(180deg, #0F172A 0%, #0D1B2A 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
        style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {collapsed
          ? <ChevronRight size={12} style={{ color: '#94A3B8' }} />
          : <ChevronLeft size={12} style={{ color: '#94A3B8' }} />
        }
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}aa)` }}>
          <Zap size={18} color="white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Sports Academy
            </p>
            <p className="text-xs leading-tight" style={{ color: '#64748B' }}>
              Performance Intelligence
            </p>
          </div>
        )}
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="mx-3 my-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: roleColor, color: 'white' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
              <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                style={{ background: `${roleColor}22`, color: roleColor }}>
                {role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${item.highlight ? 'highlight-item' : ''}`
            }
            title={collapsed ? item.label : undefined}
            style={({ isActive }) => item.highlight && !isActive ? {
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            } : {}}
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="px-2 pb-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
        <NavLink
          to="/settings"
          className="sidebar-item"
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-left"
          style={{ color: '#F87171' }}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
