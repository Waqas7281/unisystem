import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { SIDEBAR_CONFIG } from './sidebarConfig';

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = useSelector((state) => state.auth.user);

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = SIDEBAR_CONFIG[user.role]?.[0]?.path || '/dashboard';
    return <Navigate to={fallback} replace />;
  }
  return children;
}
