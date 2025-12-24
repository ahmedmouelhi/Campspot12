import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
  message?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  redirectTo = '/auth?mode=login',
  message 
}) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check authentication requirements
    if (requireAuth && !isAuthenticated) {
      // Store the current location for redirect after login
      sessionStorage.setItem('redirect_after_login', location.pathname);
      
      const defaultMessage = 'Please log in to access this page';
      toast.info(message || defaultMessage);
      navigate(redirectTo);
      return;
    }

    // Check admin requirements
    if (requireAdmin && !isAdmin) {
      const adminMessage = 'Admin access required for this page';
      toast.error(message || adminMessage);
      navigate('/');
      return;
    }
  }, [isAuthenticated, isAdmin, requireAuth, requireAdmin, navigate, redirectTo, location.pathname, message]);

  // Show loading or nothing while checking authentication
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-600">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;