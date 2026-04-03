import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
const RoleSelection = lazy(() => import('./pages/RoleSelection'));
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResendVerification = lazy(() => import('./pages/ResendVerification'));
const FestDetails = lazy(() => import('./pages/FestDetails'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const CreateFest = lazy(() => import('./pages/CreateFest'));
const EditFest = lazy(() => import('./pages/EditFest'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const PaymentSetup = lazy(() => import('./pages/PaymentSetup'));
const EditEvent = lazy(() => import('./pages/EditEvent'));
const ManageFestList = lazy(() => import('./pages/ManageFestList'));
const ManageFest = lazy(() => import('./pages/ManageFest'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const Profile = lazy(() => import('./pages/Profile'));

const RouteLoader = () => (
  <div className="flex items-center justify-center py-10">
    <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin" aria-label="Loading page" />
  </div>
);

// Wrapper to handle role selection redirect
const AppContent = () => {
  const { needsRoleSelection, currentUser } = useAuth();

  // If user is logged in and needs role selection, redirect to role selection
  if (currentUser && needsRoleSelection) {
    return (
      <div className="min-h-screen flex bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
           <main className="flex-grow p-4 md:p-8 overflow-y-auto h-screen">
             <RoleSelection />
           </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background font-sans text-text-primary transition-colors duration-300">
      <Navbar />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
        <main className="flex-grow overflow-y-auto h-screen scrollbar-hide">
          <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
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
            path="/manage-fests"
            element={
              <ProtectedRoute requiredRole="organizer">
                <ManageFestList />
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
            path="/fest/:festId/create-event/payment-setup"
            element={
              <ProtectedRoute requiredRole="organizer">
                <PaymentSetup />
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
        </Suspense>
        <Footer />
      </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <AppContent />
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
