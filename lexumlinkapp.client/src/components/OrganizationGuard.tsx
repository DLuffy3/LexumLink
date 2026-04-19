import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const OrganizationGuard = ({ children }: { children: JSX.Element }) => {
    const { activeOrganization, hasOrganization, loading, user } = useAuth();
    if (loading) return <div>Loading...</div>;
    // Super admin does not need an organization; redirect to super admin dashboard
    if (user?.isSuperAdmin) return <Navigate to="/super-admin" replace />;
    // For regular users, they must have an organization
    if (!hasOrganization || !activeOrganization) {
        // This should never happen if data is consistent, but handle gracefully
        console.error('Regular user missing organization – please contact support.');
        return <Navigate to="/signout" replace />; // or show an error page
    }
    return children;
};