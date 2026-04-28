import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Notifications from './components/Notifications';
import PaymentPage from './components/PaymentPage';
import ReviewPage from './components/ReviewPage';

// Auth
import Login from './components/Login';
import Register from './components/Register';

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

// Shared
const Unauthorized = () => (
  <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'Segoe UI, sans-serif' }}>
    <h2 style={{ color: '#2c3e50' }}>403 - Unauthorized</h2>
    <p style={{ color: '#7f8c8d' }}>You don't have permission to access this page.</p>
    <a href="/login" style={{ color: '#3498db' }}>Go to Login</a>
  </div>
);

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Provider Routes */}
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



        {/* Patient Routes */}
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
      
    </Router>
  );
}

export default App;