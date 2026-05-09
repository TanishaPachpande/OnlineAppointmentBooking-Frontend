// REPLACE: src/App.jsx
// Changes vs original:
//  1. Imports Sidebar + authService
//  2. Wraps every authenticated route inside a flex layout (Sidebar + main)
//  3. Public pages (login, register, browse) still use the top Navbar only
//  4. All existing routes are 100% unchanged

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';          // ← NEW
import ProtectedRoute from './components/ProtectedRoute';
import Notifications from './components/Notifications';
import PaymentPage from './components/PaymentPage';
import ReviewPage from './components/ReviewPage';
import authService from './services/authService';    // ← NEW

// Auth
import Login from './components/Login';
import Register from './components/Register';
import OAuth2Callback from "./components/OAuth2Callback";

// Provider
import ProviderSetup from './components/ProviderSetup';
import ScheduleManagement from './components/ScheduleManagement';
import ProviderAppointments from './components/ProviderAppointments';
import ProviderRecords from './components/ProviderRecords';

// Patient
import PatientDashboard from './components/PatientDashboard';
import BookAppointment from './components/BookAppointment';
import MyAppointments from './components/MyAppointments';
import MyMedicalRecords from './components/MyMedicalRecords';

// Admin
import AdminDashboard from './components/AdminDashboard';

// Guest
import GuestDashboard from './components/GuestDashboard';

const Unauthorized = () => (
  <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'Segoe UI, sans-serif' }}>
    <h2 style={{ color: '#2c3e50' }}>403 - Unauthorized</h2>
    <p style={{ color: '#7f8c8d' }}>You don't have permission to access this page.</p>
    <a href="/login" style={{ color: '#3498db' }}>Go to Login</a>
  </div>
);

// Paths that belong to logged-in users → show Sidebar, no Navbar
const SIDEBAR_PATHS = [
  '/dashboard', '/appointments', '/records', '/notifications',
  '/manage-slots', '/provider-appointments', '/provider-records',
  '/provider-setup', '/admin', '/book', '/payment', '/review',
];

// Layout wrapper — decides Sidebar vs top Navbar
function AppLayout({ children }) {
  const location = useLocation();
  const user = authService.getCurrentUser();
  const useSidebar = user && SIDEBAR_PATHS.some(p => location.pathname.startsWith(p));

  if (useSidebar) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f9fc' }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <main style={{ flex: 1 }}>{children}</main>
        </div>
      </div>
    );
  }

  // Public pages keep the top navbar
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <AppLayout>
        <Routes>
          {/* ── Public / Guest ── */}
          <Route path="/" element={<Navigate to="/browse" />} />
          <Route path="/browse"          element={<GuestDashboard />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/unauthorized"    element={<Unauthorized />} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />

          {/* ── Admin ── */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── Provider ── */}
          <Route path="/provider-setup" element={
            <ProtectedRoute allowedRoles={['PROVIDER']}>
              <ProviderSetup />
            </ProtectedRoute>
          } />
          <Route path="/manage-slots" element={
            <ProtectedRoute allowedRoles={['PROVIDER']}>
              <ScheduleManagement />
            </ProtectedRoute>
          } />
          <Route path="/provider-appointments" element={
            <ProtectedRoute allowedRoles={['PROVIDER']}>
              <ProviderAppointments />
            </ProtectedRoute>
          } />
          <Route path="/provider-records" element={
            <ProtectedRoute allowedRoles={['PROVIDER']}>
              <ProviderRecords />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['PATIENT', 'PROVIDER']}>
              <Notifications />
            </ProtectedRoute>
          } />

          {/* ── Patient ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/book/:providerId" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <BookAppointment />
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <MyAppointments />
            </ProtectedRoute>
          } />
          <Route path="/records" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <MyMedicalRecords />
            </ProtectedRoute>
          } />
          <Route path="/payment/:appointmentId" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PaymentPage />
            </ProtectedRoute>
          } />
          <Route path="/review/:appointmentId/:providerId" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <ReviewPage />
            </ProtectedRoute>
          } />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
