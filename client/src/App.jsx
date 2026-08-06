import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import ModulePlaceholder from './components/common/ModulePlaceholder';

const Login = React.lazy(() => import('./pages/auth/Login'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));

const DashboardLayout = React.lazy(() => import('./layouts/DashboardLayout'));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'));
const CoachDashboard = React.lazy(() => import('./pages/dashboard/CoachDashboard'));
const SelectorDashboard = React.lazy(() => import('./pages/dashboard/SelectorDashboard'));
const AthleteDashboard = React.lazy(() => import('./pages/dashboard/AthleteDashboard'));
const AIGenerateList = React.lazy(() => import('./pages/dashboard/AIGenerateList'));

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
    subtitle: 'Academy-wide performance, selection and AI intelligence overview.',
  },
  coach: {
    title: 'Coach Workspace',
    subtitle: 'Monitor your assigned squad and act on AI-flagged priorities.',
  },
  selector: {
    title: 'Selection Intelligence',
    subtitle: 'Rank, compare and shortlist athletes with AI confidence scoring.',
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

const PlaceholderRoute = ({ title, description }) => (
  <ProtectedRoute>
    <DashboardLayout title={title} subtitle={description}>
      <ModulePlaceholder title={title} description={description} />
    </DashboardLayout>
  </ProtectedRoute>
);

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

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

              <Route
                path="/athletes"
                element={
                  <PlaceholderRoute
                    title="Athletes"
                    description="Manage athlete profiles, assignments, and eligibility across sports and categories."
                  />
                }
              />
              <Route
                path="/coaches"
                element={
                  <PlaceholderRoute
                    title="Coaches"
                    description="Coach roster, sport assignments, and squad oversight tools."
                  />
                }
              />
              <Route
                path="/selectors"
                element={
                  <PlaceholderRoute
                    title="Selectors"
                    description="Selector accounts, trial access, and selection permissions."
                  />
                }
              />
              <Route
                path="/sports"
                element={
                  <PlaceholderRoute
                    title="Sports & Categories"
                    description="Configure sports, age/gender categories, and performance metrics."
                  />
                }
              />
              <Route
                path="/performance"
                element={
                  <PlaceholderRoute
                    title="Performance"
                    description="Record and review performance metrics, scores, and trends."
                  />
                }
              />
              <Route
                path="/fitness"
                element={
                  <PlaceholderRoute
                    title="Fitness"
                    description="Fitness assessments, strength/endurance tracking, and history."
                  />
                }
              />
              <Route
                path="/attendance"
                element={
                  <PlaceholderRoute
                    title="Attendance"
                    description="Daily attendance logs, leave tracking, and participation rates."
                  />
                }
              />
              <Route
                path="/injuries"
                element={
                  <PlaceholderRoute
                    title="Injuries"
                    description="Injury register, recovery status, and return-to-play notes."
                  />
                }
              />
              <Route
                path="/rankings"
                element={
                  <PlaceholderRoute
                    title="Rankings"
                    description="Academy rankings by sport, category, and overall performance."
                  />
                }
              />
              <Route
                path="/selections"
                element={
                  <PlaceholderRoute
                    title="Selections"
                    description="Selection trials, shortlists, and confirmation workflows."
                  />
                }
              />
              <Route
                path="/analytics"
                element={
                  <PlaceholderRoute
                    title="Analytics"
                    description="Cross-module analytics, comparisons, and academy insights."
                  />
                }
              />
              <Route
                path="/reports"
                element={
                  <PlaceholderRoute
                    title="Reports"
                    description="Exportable PDF/CSV reports for coaches, selectors, and admins."
                  />
                }
              />
              <Route
                path="/notifications"
                element={
                  <PlaceholderRoute
                    title="Notifications"
                    description="System alerts, feedback, and selection notifications."
                  />
                }
              />
              <Route
                path="/compare"
                element={
                  <PlaceholderRoute
                    title="Compare Athletes"
                    description="Side-by-side athlete comparison for selection decisions."
                  />
                }
              />
              <Route
                path="/profile"
                element={
                  <PlaceholderRoute
                    title="My Profile"
                    description="Personal profile, sport details, and account preferences."
                  />
                }
              />
              <Route
                path="/feedback"
                element={
                  <PlaceholderRoute
                    title="Coach Feedback"
                    description="Coach remarks, ratings, and suggested improvements."
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <PlaceholderRoute
                    title="Settings"
                    description="Account security, preferences, and notification settings."
                  />
                }
              />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>

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
