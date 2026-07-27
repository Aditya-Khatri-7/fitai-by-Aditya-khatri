import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, bootstrapped, token } = useSelector(state => state.auth);

  // Still checking whether a stored token is valid — avoid a flash-redirect to /login.
  if (token && !bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)] text-sm">
        Loading your profile...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
