import {
  Activity,
  Gauge,
  Users,
  Shield,
  ClipboardList,
  Trophy,
  Medal,
  Sparkles,
  FileText,
  CalendarCheck,
  HeartPulse,
  BarChart3,
  User,
  Settings,
  LayoutDashboard,
} from 'lucide-react';

export const ROUTE_META_MAP = [
  { prefix: '/dashboard', title: 'Dashboard', subtitle: 'Academy Command Centre & Overview', icon: LayoutDashboard },
  { prefix: '/ai-generate', title: 'AI Selection Intelligence', subtitle: 'Ranked athlete generation with AI confidence', icon: Sparkles },
  
  // Performance
  { prefix: '/performance/compare', title: 'Performance Comparison', subtitle: 'Side-by-side metric comparison', icon: Sparkles },
  { prefix: '/performance/analytics', title: 'Performance Analytics', subtitle: 'Academy performance statistics & trends', icon: BarChart3 },
  { prefix: '/performance/timeline', title: 'Performance Timeline', subtitle: 'Historical athlete performance progression', icon: Activity },
  { prefix: '/performance/history', title: 'Performance History', subtitle: 'Athlete historical evaluations', icon: Activity },
  { prefix: '/performance/add', title: 'Add Performance Record', subtitle: 'Record new sport metric evaluation', icon: Activity },
  { prefix: '/performance', title: 'Performance Monitoring', subtitle: 'Athlete scores, trends & sport metrics', icon: Activity },

  // Fitness
  { prefix: '/fitness/analytics', title: 'Fitness Analytics', subtitle: 'Academy fitness intelligence & averages', icon: BarChart3 },
  { prefix: '/fitness/reports', title: 'Fitness Reports', subtitle: 'Assessment records and summaries', icon: FileText },
  { prefix: '/fitness/history', title: 'Fitness History', subtitle: 'Athlete fitness progression', icon: Gauge },
  { prefix: '/fitness/add', title: 'Add Fitness Assessment', subtitle: 'Record endurance, speed & strength metrics', icon: Gauge },
  { prefix: '/fitness', title: 'Fitness Assessments', subtitle: 'Comprehensive athlete fitness logs & metrics', icon: Gauge },

  // Athletes
  { prefix: '/athletes/archived', title: 'Archived Athletes', subtitle: 'Historical athlete records', icon: Users },
  { prefix: '/athletes/add', title: 'Add New Athlete', subtitle: 'Enroll athlete into academy', icon: Users },
  { prefix: '/athletes', title: 'Athletes Directory', subtitle: 'Academy athlete roster, bio & records', icon: Users },

  // Coaches
  { prefix: '/coaches/add', title: 'Add New Coach', subtitle: 'Register academy coaching staff', icon: Shield },
  { prefix: '/coaches', title: 'Coaches Directory', subtitle: 'Academy coaches and assigned sports', icon: Shield },

  // Selectors
  { prefix: '/selectors/add', title: 'Add New Selector', subtitle: 'Register state selection official', icon: ClipboardList },
  { prefix: '/selectors', title: 'Selectors Directory', subtitle: 'State selection panel & scouts', icon: ClipboardList },

  // Attendance
  { prefix: '/attendance/mark', title: 'Mark Attendance', subtitle: 'Record training session attendance', icon: CalendarCheck },
  { prefix: '/attendance/calendar', title: 'Attendance Calendar', subtitle: 'Monthly session calendar & logs', icon: CalendarCheck },
  { prefix: '/attendance/reports', title: 'Attendance Reports', subtitle: 'Session adherence summaries', icon: FileText },
  { prefix: '/attendance', title: 'Attendance Management', subtitle: 'Daily athlete session logs & rates', icon: CalendarCheck },

  // Injuries
  { prefix: '/injuries/add', title: 'Record Injury', subtitle: 'Report athlete medical condition', icon: HeartPulse },
  { prefix: '/injuries/recovery', title: 'Recovery Tracker', subtitle: 'Rehabilitation progress tracking', icon: HeartPulse },
  { prefix: '/injuries/history', title: 'Medical History', subtitle: 'Past athlete injuries & treatments', icon: HeartPulse },
  { prefix: '/injuries', title: 'Injury Management', subtitle: 'Medical tracking, RTP & rehabilitation', icon: HeartPulse },

  // Rankings & Selections
  { prefix: '/rankings/history', title: 'Ranking History', subtitle: 'Historical leaderboard logs', icon: Medal },
  { prefix: '/rankings/compare', title: 'Ranking Comparison', subtitle: 'Comparative athlete standing', icon: Medal },
  { prefix: '/rankings', title: 'Academy Rankings', subtitle: 'State academy leaderboards & percentiles', icon: Medal },
  { prefix: '/selections', title: 'Selection Lists', subtitle: 'Curated squads & candidate rosters', icon: ClipboardList },
  { prefix: '/compare', title: 'Compare Athletes', subtitle: 'Multi-athlete side-by-side evaluation', icon: BarChart3 },

  // Sports
  { prefix: '/sports', title: 'Sports & Categories', subtitle: 'Configured sports and metric definitions', icon: Trophy },
  { prefix: '/categories', title: 'Sport Categories', subtitle: 'Age and rank category divisions', icon: Trophy },

  // Analytics & Reports
  { prefix: '/analytics', title: 'Academy Analytics', subtitle: 'Deep operational & performance insights', icon: BarChart3 },
  { prefix: '/reports', title: 'Reports Center', subtitle: 'Exportable academy summaries & dossiers', icon: FileText },
  { prefix: '/feedback', title: 'Coach Feedback', subtitle: 'Session remarks and athlete evaluations', icon: ClipboardList },
  { prefix: '/profile', title: 'My Profile', subtitle: 'Account information & credentials', icon: User },
  { prefix: '/settings', title: 'Settings', subtitle: 'System preferences & configurations', icon: Settings },
];

export const getRouteMeta = (pathname = '') => {
  if (!pathname) {
    return { title: 'Dashboard', subtitle: 'Loading page...', icon: LayoutDashboard };
  }

  // Exact or prefix match, prioritizing longest prefix first
  const match = ROUTE_META_MAP.find(
    (item) => pathname === item.prefix || pathname.startsWith(item.prefix + '/')
  );

  if (match) {
    return match;
  }

  // Fallback: derive title from pathname
  const clean = pathname.replace(/^\//, '').split('/')[0];
  const capitalized = clean ? clean.charAt(0).toUpperCase() + clean.slice(1).replace(/-/g, ' ') : 'Dashboard';

  return {
    title: capitalized,
    subtitle: 'Loading page details...',
    icon: LayoutDashboard,
  };
};
