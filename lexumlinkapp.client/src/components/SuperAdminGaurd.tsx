import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const SuperAdminGuard = ({ children }: { children: JSX.Element }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user?.isSuperAdmin) return <Navigate to="/dashboard" replace />;
    return children;
};