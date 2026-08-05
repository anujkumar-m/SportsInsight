import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import ModulePlaceholder from './components/common/ModulePlaceholder';
import { COLORS } from './theme';

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
  <div className="min-h-screen flex items-center justify-center bg-bg">
    <div className="w-11 h-11 border-4 border-brand border-t-transparent rounded-full animate-spin" />
  </div>
);

const DashboardRouter = () => {
  const { role } = useAuth();
  switch (role) {
    case 'admin': return <AdminDashboard />;
    case 'coach': return <CoachDashboard />;
    case 'selector': return <SelectorDashboard />;
    case 'athlete': return <AthleteDashboard />;
    default: return <Navigate to="/login" replace />;
  }
};

const PlaceholderRoute = ({ title, description }) => (
  <ProtectedRoute>
    <DashboardLayout title={title}>
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

              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout title="Dashboard Overview">
                    <DashboardRouter />
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/ai-generate" element={
                <ProtectedRoute>
                  <RoleRoute roles={['admin', 'coach', 'selector']}>
                    <DashboardLayout title="AI Selection Intelligence">
                      <AIGenerateList />
                    </DashboardLayout>
                  </RoleRoute>
                </ProtectedRoute>
              } />

              <Route path="/athletes" element={<PlaceholderRoute title="Athletes" description="Manage athlete profiles, assignments, and eligibility across sports and categories." />} />
              <Route path="/coaches" element={<PlaceholderRoute title="Coaches" description="Coach roster, sport assignments, and squad oversight tools." />} />
              <Route path="/selectors" element={<PlaceholderRoute title="Selectors" description="Selector accounts, trial access, and selection permissions." />} />
              <Route path="/sports" element={<PlaceholderRoute title="Sports & Categories" description="Configure sports, age/gender categories, and performance metrics." />} />
              <Route path="/performance" element={<PlaceholderRoute title="Performance" description="Record and review performance metrics, scores, and trends." />} />
              <Route path="/fitness" element={<PlaceholderRoute title="Fitness" description="Fitness assessments, strength/endurance tracking, and history." />} />
              <Route path="/attendance" element={<PlaceholderRoute title="Attendance" description="Daily attendance logs, leave tracking, and participation rates." />} />
              <Route path="/injuries" element={<PlaceholderRoute title="Injuries" description="Injury register, recovery status, and return-to-play notes." />} />
              <Route path="/rankings" element={<PlaceholderRoute title="Rankings" description="Academy rankings by sport, category, and overall performance." />} />
              <Route path="/selections" element={<PlaceholderRoute title="Selections" description="Selection trials, shortlists, and confirmation workflows." />} />
              <Route path="/analytics" element={<PlaceholderRoute title="Analytics" description="Cross-module analytics, comparisons, and academy insights." />} />
              <Route path="/reports" element={<PlaceholderRoute title="Reports" description="Exportable PDF/CSV reports for coaches, selectors, and admins." />} />
              <Route path="/notifications" element={<PlaceholderRoute title="Notifications" description="System alerts, feedback, and selection notifications." />} />
              <Route path="/compare" element={<PlaceholderRoute title="Compare Athletes" description="Side-by-side athlete comparison for selection decisions." />} />
              <Route path="/profile" element={<PlaceholderRoute title="My Profile" description="Personal profile, sport details, and account preferences." />} />
              <Route path="/feedback" element={<PlaceholderRoute title="Coach Feedback" description="Coach remarks, ratings, and suggested improvements." />} />
              <Route path="/settings" element={<PlaceholderRoute title="Settings" description="Account security, preferences, and notification settings." />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#111827',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                borderRadius: '8px',
              },
              success: {
                iconTheme: { primary: COLORS.success, secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: COLORS.danger, secondary: '#fff' },
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
