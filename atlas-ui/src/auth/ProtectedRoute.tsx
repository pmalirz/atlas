import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * ProtectedRoute - Wrapper that redirects to login if not authenticated
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="p-6">
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
