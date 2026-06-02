import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import LoadingScreen from './components/LoadingScreen';

// Placeholder Components until actual ones are built
import DashboardLayout from './layouts/DashboardLayout';

// Components
const Login = React.lazy(() => import('./pages/Login'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminStudents = React.lazy(() => import('./pages/admin/Students'));
const AdminPayments = React.lazy(() => import('./pages/admin/Payments'));
const AdminNotifications = React.lazy(() => import('./pages/admin/Notifications'));
const AdminSettings = React.lazy(() => import('./pages/admin/Settings'));
const AdminRevenue = React.lazy(() => import('./pages/admin/Revenue'));
const AdminStudentDetail = React.lazy(() => import('./pages/admin/StudentDetail'));
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard'));
const NotFound = () => <div className="p-8">404 - Page Not Found</div>;

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'} />;
  }
  return children;
};

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <React.Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="students/:id" element={<AdminStudentDetail />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="revenue" element={<AdminRevenue />} />
          </Route>
          
          <Route path="/student" element={
            <ProtectedRoute role="STUDENT">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<StudentDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </>
  );
};

export default App;
