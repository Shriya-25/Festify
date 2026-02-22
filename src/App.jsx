import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleSelection from './components/RoleSelection';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import FestDetails from './pages/FestDetails';
import EventDetails from './pages/EventDetails';
import CreateFest from './pages/CreateFest';
import EditFest from './pages/EditFest';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import ManageFest from './pages/ManageFest';
import StudentProfile from './pages/StudentProfile';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

// Wrapper to handle role selection redirect
const AppContent = () => {
  const { needsRoleSelection, currentUser } = useAuth();

  // If user is logged in and needs role selection, redirect to role selection
  if (currentUser && needsRoleSelection) {
    return <RoleSelection />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/fest/:id" element={<FestDetails />} />
        <Route path="/event/:eventId" element={<EventDetails />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-fest"
          element={
            <ProtectedRoute requiredRole="organizer">
              <CreateFest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fest/:festId/edit"
          element={
            <ProtectedRoute requiredRole="organizer">
              <EditFest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fest/:festId/manage"
          element={
            <ProtectedRoute requiredRole="organizer">
              <ManageFest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fest/:festId/create-event"
          element={
            <ProtectedRoute requiredRole="organizer">
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event/:eventId/edit"
          element={
            <ProtectedRoute requiredRole="organizer">
              <EditEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-profile/:userId"
          element={
            <ProtectedRoute requiredRole="organizer">
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
