import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoadingSpinner from './components/LoadingSpinner';
import { useApp } from './context/AppContext';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const LiveAttendance = React.lazy(() => import('./pages/LiveAttendance'));
const Students = React.lazy(() => import('./pages/Students'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Teachers = React.lazy(() => import('./pages/Teachers'));
const Classes = React.lazy(() => import('./pages/Classes'));
const Profile = React.lazy(() => import('./pages/Profile'));
const StudentKiosk = React.lazy(() => import('./pages/StudentKiosk'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));

const Loader = () => (
  <div className="flex justify-center items-center h-full min-h-[200px]">
    <LoadingSpinner />
  </div>
);

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useApp();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <Suspense fallback={<div className="h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner /></div>}>
          {user ? <Navigate to="/" replace /> : <LoginPage />}
        </Suspense>
      } />

      <Route path="/kiosk" element={
        <Suspense fallback={<div className="h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner /></div>}>
          <StudentKiosk />
        </Suspense>
      } />

      {/* Admin Dashboard (Teacher + Principal) */}
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['teacher', 'principal']}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Suspense fallback={<Loader />}><Dashboard /></Suspense>} />
        <Route path="live-attendance" element={<Suspense fallback={<Loader />}><LiveAttendance /></Suspense>} />
        <Route path="students" element={<Suspense fallback={<Loader />}><Students /></Suspense>} />
        <Route path="teachers" element={
          <ProtectedRoute allowedRoles={['principal']}>
            <Suspense fallback={<Loader />}><Teachers /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="classes" element={<Suspense fallback={<Loader />}><Classes /></Suspense>} />
        <Route path="attendance" element={<Suspense fallback={<Loader />}><Attendance /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<Loader />}><Reports /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<Loader />}><Analytics /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<Loader />}><Settings /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<Loader />}><Profile /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}
