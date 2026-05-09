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
import ParticipantLists from './pages/ParticipantLists';
import ParticipantDirectory from './pages/ParticipantDirectory';
import SentInvitations from './pages/SentInvitations';
import InvitationRequests from './pages/InvitationRequests';
import AttendancePortal from './pages/AttendancePortal';
import UserManagement from './pages/UserManagement';
import EventReports from './pages/EventReports';
import SystemLogs from './pages/SystemLogs';

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
            path="/admin/participant-lists" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <ParticipantLists />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/participants/:typeSlug" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <ParticipantDirectory />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/invitations/sent" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <SentInvitations />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/invitations/requests" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <InvitationRequests />
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
            path="/admin/attendance" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <AttendancePortal />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <UserManagement />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports/events" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <EventReports />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings/logs" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout>
                  <SystemLogs />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/attendance" 
            element={
              <ProtectedRoute allowedRoles={['Attendance Staff', 'Admin']}>
                <AttendancePortal />
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
