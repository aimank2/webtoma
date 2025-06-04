import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Adjust path if necessary
import { ROUTES } from '@/routes/routes'; // Adjust path if necessary

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Optional: Show a loading spinner or a blank page while checking auth state
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH} replace />;
  }

  return <Outlet />; // Renders the child route if authenticated
};

export default ProtectedRoute;