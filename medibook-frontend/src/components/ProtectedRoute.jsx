import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

/**
 * ProtectedRoute
 *
 * Behaviour:
 *  - Not logged in  → save intended path to sessionStorage, redirect to /login
 *  - Logged in but wrong role → redirect to /unauthorized
 *  - Logged in with correct role → render children
 *
 * The saved path is consumed by Login.jsx after a successful sign-in
 * so the user lands exactly where they wanted to go.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();
  const location = useLocation();

  if (!user) {
    // Persist the path the guest was trying to reach
    sessionStorage.setItem('guestRedirectPath', location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
