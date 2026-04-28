import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();

  if (!user) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but wrong role
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;