import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  // Wait for AuthContext to finish reading/validating the token
  if (loading) return null;

  // 1. Not logged in (no valid/non-expired token)
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 2. Logged in but wrong role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    if (user.role === 'PLACEMENT_STAFF') return <Navigate to="/staff" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;