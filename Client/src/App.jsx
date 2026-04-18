import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import GrievanceBoardPage from './pages/GrievanceBoardPage';
import LandingPage from './pages/LandingPage';
import PendingApprovalPage from './pages/PendingApprovalPage';

import WorkerDashboardPage from './pages/worker/WorkerDashboardPage';
import EarningsPage from './pages/worker/EarningsPage';
import CertificatePage from './pages/worker/CertificatePage';

import VerifierQueuePage from './pages/verifier/VerifierQueuePage';

import AdvocateDashboardPage from './pages/advocate/AdvocateDashboardPage';
import AdvocateModerationPage from './pages/advocate/AdvocateModerationPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ChatWidget from './components/ChatWidget';

const ROLE_HOME = {
  worker:   '/app/worker/dashboard',
  verifier: '/app/verifier/queue',
  advocate: '/app/advocate/dashboard',
  admin:    '/app/admin/dashboard',
};

function RoleRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.status === 'pending' || user.status === 'rejected') {
    return <Navigate to="/app/pending" replace />;
  }

  return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />;
}

function HomeRoute() {
  const { token, user } = useAuth();

  if (token && user) {
    if (user.status === 'pending' || user.status === 'rejected') {
      return <Navigate to="/app/pending" replace />;
    }
    return <Navigate to={ROLE_HOME[user.role] ?? '/app'} replace />;
  }

  return <LandingPage />;
}

function App() {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        <Route path="/app" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/app/pending" element={<ProtectedRoute><PendingApprovalPage /></ProtectedRoute>} />

        <Route path="/app/worker/dashboard"  element={<ProtectedRoute allowedRoles={['worker']}><WorkerDashboardPage /></ProtectedRoute>} />
        <Route path="/app/worker/earnings"   element={<ProtectedRoute allowedRoles={['worker']}><EarningsPage /></ProtectedRoute>} />
        <Route path="/app/worker/certificate" element={<ProtectedRoute allowedRoles={['worker']}><CertificatePage /></ProtectedRoute>} />

        <Route path="/app/verifier/queue" element={<ProtectedRoute allowedRoles={['verifier']}><VerifierQueuePage /></ProtectedRoute>} />

        <Route path="/app/advocate/dashboard"  element={<ProtectedRoute allowedRoles={['advocate']}><AdvocateDashboardPage /></ProtectedRoute>} />
        <Route path="/app/advocate/moderation" element={<ProtectedRoute allowedRoles={['advocate']}><AdvocateModerationPage /></ProtectedRoute>} />

        <Route path="/app/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />

        <Route path="/app/grievances" element={<ProtectedRoute><GrievanceBoardPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {user && <ChatWidget />}
    </>
  );
}

export default App;
