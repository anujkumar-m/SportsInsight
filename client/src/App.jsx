import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

const Login = React.lazy(() => import('./pages/auth/Login'));
const PendingRole = React.lazy(() => import('./pages/auth/PendingRole'));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));
const UserProfile = React.lazy(() => import('./pages/auth/UserProfile'));
const CoachFeedback = React.lazy(() => import('./pages/coaches/CoachFeedback'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));
const ReportsCenter = React.lazy(() => import('./pages/reports/ReportsCenter'));


const DashboardLayout = React.lazy(() => import('./layouts/DashboardLayout'));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'));
const CoachDashboard = React.lazy(() => import('./pages/dashboard/CoachDashboard'));
const SelectorDashboard = React.lazy(() => import('./pages/dashboard/SelectorDashboard'));
const AthleteDashboard = React.lazy(() => import('./pages/dashboard/AthleteDashboard'));
const AIGenerateList = React.lazy(() => import('./pages/dashboard/AIGenerateList'));

// Athlete Pages
const AthleteList = React.lazy(() => import('./pages/athletes/AthleteList'));
const AddAthlete = React.lazy(() => import('./pages/athletes/AddAthlete'));
const EditAthlete = React.lazy(() => import('./pages/athletes/EditAthlete'));
const AthleteProfile = React.lazy(() => import('./pages/athletes/AthleteProfile'));
const ArchivedAthletes = React.lazy(() => import('./pages/athletes/ArchivedAthletes'));

// Coach Pages
const CoachList = React.lazy(() => import('./pages/coaches/CoachList'));
const AddCoach = React.lazy(() => import('./pages/coaches/AddCoach'));
const EditCoach = React.lazy(() => import('./pages/coaches/EditCoach'));
const CoachProfile = React.lazy(() => import('./pages/coaches/CoachProfile'));

// Selector Pages
const SelectorList = React.lazy(() => import('./pages/selectors/SelectorList'));
const AddSelector = React.lazy(() => import('./pages/selectors/AddSelector'));
const EditSelector = React.lazy(() => import('./pages/selectors/EditSelector'));
const SelectorProfile = React.lazy(() => import('./pages/selectors/SelectorProfile'));

// Sports & Categories Pages
const SportsList = React.lazy(() => import('./pages/sports/SportsList'));
const CategoriesList = React.lazy(() => import('./pages/sports/CategoriesList'));

// Performance Pages
const PerformanceList = React.lazy(() => import('./pages/performance/PerformanceList'));
const AddPerformance = React.lazy(() => import('./pages/performance/AddPerformance'));
const EditPerformance = React.lazy(() => import('./pages/performance/EditPerformance'));
const PerformanceHistory = React.lazy(() => import('./pages/performance/PerformanceHistory'));
const PerformanceAnalytics = React.lazy(() => import('./pages/performance/PerformanceAnalytics'));
const PerformanceComparison = React.lazy(() => import('./pages/performance/PerformanceComparison'));
const PerformanceTimeline = React.lazy(() => import('./pages/performance/PerformanceTimeline'));

// Fitness Pages
const FitnessList = React.lazy(() => import('./pages/fitness/FitnessList'));
const AddFitness = React.lazy(() => import('./pages/fitness/AddFitness'));
const EditFitness = React.lazy(() => import('./pages/fitness/EditFitness'));
const FitnessHistory = React.lazy(() => import('./pages/fitness/FitnessHistory'));
const FitnessAnalytics = React.lazy(() => import('./pages/fitness/FitnessAnalytics'));
const FitnessReports = React.lazy(() => import('./pages/fitness/FitnessReports'));

// Attendance Pages
const AttendanceList = React.lazy(() => import('./pages/attendance/AttendanceList'));
const MarkAttendance = React.lazy(() => import('./pages/attendance/MarkAttendance'));
const AttendanceCalendar = React.lazy(() => import('./pages/attendance/AttendanceCalendar'));
const AttendanceReports = React.lazy(() => import('./pages/attendance/AttendanceReports'));

// Injury Pages
const InjuryList = React.lazy(() => import('./pages/injuries/InjuryList'));
const AddInjury = React.lazy(() => import('./pages/injuries/AddInjury'));
const EditInjury = React.lazy(() => import('./pages/injuries/EditInjury'));
const RecoveryTracker = React.lazy(() => import('./pages/injuries/RecoveryTracker'));
const MedicalHistory = React.lazy(() => import('./pages/injuries/MedicalHistory'));

// Analytics Pages
const AnalyticsDashboard = React.lazy(() => import('./pages/analytics/AnalyticsDashboard'));
const SportAnalytics = React.lazy(() => import('./pages/analytics/SportAnalytics'));
const CoachAnalytics = React.lazy(() => import('./pages/analytics/CoachAnalytics'));
const AthleteAnalytics = React.lazy(() => import('./pages/analytics/AthleteAnalytics'));

// Ranking Pages
const RankingDashboard = React.lazy(() => import('./pages/rankings/RankingDashboard'));
const RankingHistory = React.lazy(() => import('./pages/rankings/RankingHistory'));
const RankingComparison = React.lazy(() => import('./pages/rankings/RankingComparison'));

// Selection Pages
const SelectionDashboard = React.lazy(() => import('./pages/selections/SelectionDashboard'));
const RecommendedAthletes = React.lazy(() => import('./pages/selections/RecommendedAthletes'));
const SelectionHistory = React.lazy(() => import('./pages/selections/SelectionHistory'));

// Comparison Page
const AthleteComparison = React.lazy(() => import('./pages/comparison/AthleteComparison'));

import { getRouteMeta } from './utils/routeMeta';

const RouteSuspenseLoader = () => {
  const meta = getRouteMeta(typeof window !== 'undefined' ? window.location.pathname : '');
  const Icon = meta.icon;

  return (
    <div className="min-h-screen min-h-dvh bg-background flex flex-col antialiased overflow-hidden w-full relative">
      {/* Top Animated Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-secondary/60 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary via-blue-500 to-accent animate-pulse" style={{ width: '70%' }} />
      </div>

      {/* Blurred background preview */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 filter blur-[3.5px] opacity-35 pointer-events-none select-none">
        <div className="space-y-6">
          <div className="h-9 w-64 rounded-xl bg-secondary animate-pulse" />
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="h-28 rounded-xl bg-secondary animate-pulse" />
            <div className="h-28 rounded-xl bg-secondary animate-pulse" />
            <div className="h-28 rounded-xl bg-secondary animate-pulse" />
            <div className="h-28 rounded-xl bg-secondary animate-pulse" />
          </div>
          <div className="h-14 rounded-xl bg-secondary animate-pulse" />
          <div className="h-80 rounded-xl bg-secondary animate-pulse" />
        </div>
      </div>

      {/* Floating Glassmorphic Indicator Centerpiece */}
      <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-background/25 backdrop-blur-xs">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/80 bg-card/95 px-8 py-6 shadow-2xl backdrop-blur-md max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="relative flex items-center justify-center">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              {Icon ? <Icon size={26} className="animate-pulse" /> : <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
            </div>
            <div className="absolute -inset-1.5 rounded-2xl border-2 border-primary/30 border-t-primary animate-spin" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">
              Loading {meta.title || 'Page'}...
            </h2>
            <p className="text-xs text-muted-foreground">
              {meta.subtitle || 'Preparing athlete intelligence records...'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            <span className="size-1.5 rounded-full bg-primary animate-ping" />
            <span>Loading interface</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DASHBOARD_META = {
  admin: {
    title: 'Academy Command Centre',
    subtitle: 'Academy-wide performance, selection and academy overview.',
  },
  coach: {
    title: 'Coach Workspace',
    subtitle: 'Monitor your assigned squad and key priorities.',
  },
  selector: {
    title: 'Selection Intelligence',
    subtitle: 'Rank, compare and shortlist athletes.',
  },
  athlete: {
    title: 'My Performance',
    subtitle: 'Your progress, fitness, attendance and selection status.',
  },
};

const DashboardRouter = () => {
  const { role } = useAuth();
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'coach':
      return <CoachDashboard />;
    case 'selector':
      return <SelectorDashboard />;
    case 'athlete':
      return <AthleteDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const DashboardPage = () => {
  const { role } = useAuth();
  const meta = DASHBOARD_META[role] || DASHBOARD_META.admin;
  return (
    <DashboardLayout title={meta.title} subtitle={meta.subtitle}>
      <DashboardRouter />
    </DashboardLayout>
  );
};

const App = () => {

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<RouteSuspenseLoader />}>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/pending-role" element={<ProtectedRoute><PendingRole /></ProtectedRoute>} />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ai-generate"
                element={
                  <ProtectedRoute>
                    <RoleRoute roles={['admin', 'coach', 'selector']}>
                      <DashboardLayout
                        title="AI Selection Intelligence"
                        subtitle="Generate ranked athlete lists with confidence scoring and export options."
                      >
                        <AIGenerateList />
                      </DashboardLayout>
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />

              <Route path="/athletes" element={<ProtectedRoute><DashboardLayout title="Athletes"><AthleteList /></DashboardLayout></ProtectedRoute>} />
              <Route path="/athletes/archived" element={<ProtectedRoute><RoleRoute roles={['admin']}><DashboardLayout title="Archived Athletes"><ArchivedAthletes /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/athletes/add" element={<ProtectedRoute><RoleRoute roles={['admin', 'coach']}><DashboardLayout title="Add Athlete"><AddAthlete /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/athletes/:id/edit" element={<ProtectedRoute><RoleRoute roles={['admin', 'coach', 'athlete']}><DashboardLayout title="Edit Athlete"><EditAthlete /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/athletes/:id" element={<ProtectedRoute><DashboardLayout title="Athlete Profile"><AthleteProfile /></DashboardLayout></ProtectedRoute>} />

              <Route path="/coaches" element={<ProtectedRoute><RoleRoute roles={['admin', 'selector']}><DashboardLayout title="Coaches"><CoachList /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/coaches/add" element={<ProtectedRoute><RoleRoute roles={['admin']}><DashboardLayout title="Add Coach"><AddCoach /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/coaches/:id/edit" element={<ProtectedRoute><RoleRoute roles={['admin', 'coach']}><DashboardLayout title="Edit Coach"><EditCoach /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/coaches/:id" element={<ProtectedRoute><DashboardLayout title="Coach Profile"><CoachProfile /></DashboardLayout></ProtectedRoute>} />

              <Route path="/selectors" element={<ProtectedRoute><RoleRoute roles={['admin']}><DashboardLayout title="Selectors"><SelectorList /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/selectors/add" element={<ProtectedRoute><RoleRoute roles={['admin']}><DashboardLayout title="Add Selector"><AddSelector /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/selectors/:id/edit" element={<ProtectedRoute><RoleRoute roles={['admin', 'selector']}><DashboardLayout title="Edit Selector"><EditSelector /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/selectors/:id" element={<ProtectedRoute><DashboardLayout title="Selector Profile"><SelectorProfile /></DashboardLayout></ProtectedRoute>} />

              <Route path="/sports" element={<ProtectedRoute><DashboardLayout title="Sports & Categories"><SportsList /></DashboardLayout></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute><DashboardLayout title="Categories"><CategoriesList /></DashboardLayout></ProtectedRoute>} />
              {/* Performance Monitoring Routes */}
              <Route path="/performance" element={<ProtectedRoute><DashboardLayout title="Performance Monitoring"><PerformanceList /></DashboardLayout></ProtectedRoute>} />
              <Route path="/performance/add" element={<ProtectedRoute><RoleRoute roles={['admin', 'coach']}><DashboardLayout title="Add Performance"><AddPerformance /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/performance/:id/edit" element={<ProtectedRoute><RoleRoute roles={['admin', 'coach']}><DashboardLayout title="Edit Performance"><EditPerformance /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/performance/history/:athleteId" element={<ProtectedRoute><DashboardLayout title="Performance History"><PerformanceHistory /></DashboardLayout></ProtectedRoute>} />
              <Route path="/performance/analytics" element={<ProtectedRoute><DashboardLayout title="Performance Analytics"><PerformanceAnalytics /></DashboardLayout></ProtectedRoute>} />
              <Route path="/performance/compare" element={<ProtectedRoute><DashboardLayout title="Performance Comparison"><PerformanceComparison /></DashboardLayout></ProtectedRoute>} />
              <Route path="/performance/timeline" element={<ProtectedRoute><DashboardLayout title="Performance Timeline"><PerformanceTimeline /></DashboardLayout></ProtectedRoute>} />

              {/* Fitness Assessment Routes */}
              <Route path="/fitness" element={<ProtectedRoute><DashboardLayout title="Fitness Assessments"><FitnessList /></DashboardLayout></ProtectedRoute>} />
              <Route path="/fitness/add" element={<ProtectedRoute><RoleRoute roles={['admin', 'coach']}><DashboardLayout title="Add Fitness Assessment"><AddFitness /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/fitness/:id/edit" element={<ProtectedRoute><RoleRoute roles={['admin', 'coach']}><DashboardLayout title="Edit Fitness Assessment"><EditFitness /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/fitness/history/:athleteId" element={<ProtectedRoute><DashboardLayout title="Fitness History"><FitnessHistory /></DashboardLayout></ProtectedRoute>} />
              <Route path="/fitness/analytics" element={<ProtectedRoute><DashboardLayout title="Fitness Analytics"><FitnessAnalytics /></DashboardLayout></ProtectedRoute>} />
              <Route path="/fitness/reports" element={<ProtectedRoute><DashboardLayout title="Fitness Reports"><FitnessReports /></DashboardLayout></ProtectedRoute>} />

              {/* Attendance Management Routes */}
              <Route path="/attendance" element={<ProtectedRoute><DashboardLayout title="Attendance Management"><AttendanceList /></DashboardLayout></ProtectedRoute>} />
              <Route path="/attendance/mark" element={<ProtectedRoute><RoleRoute roles={['admin', 'coach']}><DashboardLayout title="Mark Attendance"><MarkAttendance /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/attendance/calendar" element={<ProtectedRoute><DashboardLayout title="Attendance Calendar"><AttendanceCalendar /></DashboardLayout></ProtectedRoute>} />
              <Route path="/attendance/reports" element={<ProtectedRoute><DashboardLayout title="Attendance Reports"><AttendanceReports /></DashboardLayout></ProtectedRoute>} />

              {/* Injury Management Routes */}
              <Route path="/injuries" element={<ProtectedRoute><DashboardLayout title="Injury Management"><InjuryList /></DashboardLayout></ProtectedRoute>} />
              <Route path="/injuries/add" element={<ProtectedRoute><RoleRoute roles={['admin', 'coach']}><DashboardLayout title="Record Injury"><AddInjury /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/injuries/:id/edit" element={<ProtectedRoute><RoleRoute roles={['admin', 'coach']}><DashboardLayout title="Edit Injury"><EditInjury /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/injuries/recovery/:id" element={<ProtectedRoute><DashboardLayout title="Recovery Tracker"><RecoveryTracker /></DashboardLayout></ProtectedRoute>} />
              <Route path="/injuries/history/:athleteId" element={<ProtectedRoute><DashboardLayout title="Medical History"><MedicalHistory /></DashboardLayout></ProtectedRoute>} />
              {/* Rankings Routes */}
              <Route path="/rankings" element={<ProtectedRoute><DashboardLayout title="Academy Rankings"><RankingDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/rankings/history/:athleteId" element={<ProtectedRoute><DashboardLayout title="Ranking History"><RankingHistory /></DashboardLayout></ProtectedRoute>} />
              <Route path="/rankings/compare" element={<ProtectedRoute><DashboardLayout title="Ranking Breakdown Comparison"><RankingComparison /></DashboardLayout></ProtectedRoute>} />

              {/* Selection Intelligence Routes */}
              <Route path="/selections" element={<ProtectedRoute><DashboardLayout title="Selection Intelligence"><SelectionDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/selections/recommended" element={<ProtectedRoute><RoleRoute roles={['admin', 'selector']}><DashboardLayout title="AI Selection Recommendations"><RecommendedAthletes /></DashboardLayout></RoleRoute></ProtectedRoute>} />
              <Route path="/selections/history" element={<ProtectedRoute><DashboardLayout title="Selection Audit History"><SelectionHistory /></DashboardLayout></ProtectedRoute>} />

              {/* Analytics Routes */}
              <Route path="/analytics" element={<ProtectedRoute><DashboardLayout title="Academy Analytics"><AnalyticsDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/analytics/sport" element={<ProtectedRoute><DashboardLayout title="Sport Analytics"><SportAnalytics /></DashboardLayout></ProtectedRoute>} />
              <Route path="/analytics/coach" element={<ProtectedRoute><DashboardLayout title="Coach Analytics"><CoachAnalytics /></DashboardLayout></ProtectedRoute>} />
              <Route path="/analytics/athlete" element={<ProtectedRoute><DashboardLayout title="Athlete Analytics"><AthleteAnalytics /></DashboardLayout></ProtectedRoute>} />
              <Route path="/analytics/athlete/:athleteId" element={<ProtectedRoute><DashboardLayout title="Athlete Analytics"><AthleteAnalytics /></DashboardLayout></ProtectedRoute>} />

              {/* Athlete Comparison Route */}
              <Route path="/compare" element={<ProtectedRoute><DashboardLayout title="Compare Athletes"><AthleteComparison /></DashboardLayout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><DashboardLayout title="My Profile"><UserProfile /></DashboardLayout></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><DashboardLayout title="Coach Feedback"><CoachFeedback /></DashboardLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><DashboardLayout title="Settings"><SettingsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><RoleRoute roles={['admin']}><DashboardLayout title="Reports Center"><ReportsCenter /></DashboardLayout></RoleRoute></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Routes>
          </Suspense>
          </ErrorBoundary>

          <Toaster
            position="top-right"
            toastOptions={{
              className: 'text-sm',
              style: {
                background: 'var(--card)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                fontFamily: 'var(--font-sans)',
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
