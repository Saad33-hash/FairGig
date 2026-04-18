import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_HOME = {
  worker:   '/app/worker/dashboard',
  verifier: '/app/verifier/queue',
  advocate: '/app/advocate/dashboard',
  admin:    '/app/admin/dashboard',
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-sm text-slate-400">
        Verifying your session...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Pending/rejected users can only access the holding screen
  if (user.status !== 'approved' && location.pathname !== '/app/pending') {
    return <Navigate to="/app/pending" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />;
  }

  return children;
}
