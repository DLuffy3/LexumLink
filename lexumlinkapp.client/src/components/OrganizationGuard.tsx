import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const OrganizationGuard = ({ children }: { children: JSX.Element }) => {
    const { activeOrganization, organizations, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (organizations.length === 0) return <Navigate to="/create-organization" replace />;
    if (!activeOrganization) return <Navigate to="/select-organization" replace />;
    return children;
};