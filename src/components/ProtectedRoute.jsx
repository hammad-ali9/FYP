import { Navigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';

/**
 * ProtectedRoute - Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const isAuthenticated = authAPI.isAuthenticated();

    // Debug: Log authentication status
    console.log('ProtectedRoute check:', {
        isAuthenticated,
        token: localStorage.getItem('token'),
        path: location.pathname
    });

    if (!isAuthenticated) {
        // Redirect to login, saving the attempted URL for redirect after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};


export default ProtectedRoute;
