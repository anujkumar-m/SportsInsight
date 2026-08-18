import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

const Login = React.lazy(() => import('./pages/auth/Login'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
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

const Loader = () => (
  <div className="min-h-screen bg-background p-8">
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-secondary" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl bg-secondary" />
        <div className="h-28 animate-pulse rounded-xl bg-secondary" />
        <div className="h-28 animate-pulse rounded-xl bg-secondary" />
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-secondary" />
    </div>
  </div>
);

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
            <Suspense fallback={<Loader />}>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
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
