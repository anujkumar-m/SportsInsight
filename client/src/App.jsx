import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Lazy loading pages
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

// Loading component
const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Dynamic dashboard router component
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

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Dashboard Root */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout title="Dashboard Overview">
                  <DashboardRouter />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* AI Generate List (Admin, Coach, Selector) */}
            <Route path="/ai-generate" element={
              <ProtectedRoute>
                <RoleRoute roles={['admin', 'coach', 'selector']}>
                  <DashboardLayout title="AI Selection Intelligence">
                    <AIGenerateList />
                  </DashboardLayout>
                </RoleRoute>
              </ProtectedRoute>
            } />

            {/* Placeholder routes for future modules (Prompt 2) */}
            <Route path="/athletes" element={<ProtectedRoute><DashboardLayout title="Athletes"><div className="p-8 text-center text-gray-500">Athlete Management Module (Next Phase)</div></DashboardLayout></ProtectedRoute>} />
            <Route path="/coaches" element={<ProtectedRoute><DashboardLayout title="Coaches"><div className="p-8 text-center text-gray-500">Coach Management Module (Next Phase)</div></DashboardLayout></ProtectedRoute>} />
            <Route path="/selectors" element={<ProtectedRoute><DashboardLayout title="Selectors"><div className="p-8 text-center text-gray-500">Selector Management Module (Next Phase)</div></DashboardLayout></ProtectedRoute>} />
            <Route path="/sports" element={<ProtectedRoute><DashboardLayout title="Sports & Categories"><div className="p-8 text-center text-gray-500">Sports Management Module (Next Phase)</div></DashboardLayout></ProtectedRoute>} />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
        
        {/* Toast Notifications Provider */}
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
          }} 
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
