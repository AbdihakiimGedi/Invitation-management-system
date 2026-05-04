import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import GraduateDashboard from './pages/GraduateDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLayout from './layouts/AdminLayout';
import EventManagement from './pages/EventManagement';
import GuestDashboard from './pages/GuestDashboard';
import ProtectedRoute from './components/ProtectedRoute';

import ManageSeats from './pages/ManageSeats';
import SeatAssignment from './pages/SeatAssignment';
import AssignedSeatGroups from './pages/AssignedSeatGroups';
import InvitationScanner from './pages/InvitationScanner';

function App() {
  return (
    <Router>
      <div className="min-h-screen transition-colors duration-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-primary-100 selection:text-primary-900">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/graduate" 
            element={
              <ProtectedRoute allowedRoles={['Graduate']}>
                <GraduateDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/events" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <EventManagement />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/seats" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <ManageSeats />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/assign-seats" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <SeatAssignment />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/assigned-seat-groups" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <AssignedSeatGroups />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/terminal" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <InvitationScanner />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/guest" 
            element={
              <ProtectedRoute allowedRoles={['Guest']}>
                <GuestDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vip" 
            element={
              <ProtectedRoute allowedRoles={['Special Guest']}>
                <GuestDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
