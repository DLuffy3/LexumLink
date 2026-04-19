import React, { useState } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';
import type { User, Organization } from './AuthTypes';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Lazy initial state – reads localStorage once when the component mounts
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [activeOrganization, setActiveOrganization] = useState<Organization | null>(() => {
        const storedOrg = localStorage.getItem('organization');
        return storedOrg ? JSON.parse(storedOrg) : null;
    });

    const [hasOrganization, setHasOrganization] = useState(() => {
        return localStorage.getItem('organization') !== null;
    });

    const [loading, setLoading] = useState(false); // no initial loading because we read sync

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        const res = await api.post('/auth/signin', { email, password });
        const { user, token, organization, hasOrganization } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (organization) {
            localStorage.setItem('organization', JSON.stringify(organization));
        }
        setUser(user);
        setActiveOrganization(organization || null);
        setHasOrganization(hasOrganization);
        setLoading(false);
        return { user, organization, hasOrganization };
    };

    const signOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('organization');
        setUser(null);
        setActiveOrganization(null);
        setHasOrganization(false);
    };

    const createOrganization = async (name: string) => {
        setLoading(true);
        const res = await api.post('/organizations', { name });
        const { organization, token } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('organization', JSON.stringify(organization));
        setActiveOrganization(organization);
        setHasOrganization(true);
        // Update user in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userObj = JSON.parse(storedUser);
            userObj.organizationId = organization.id;
            localStorage.setItem('user', JSON.stringify(userObj));
            setUser(userObj);
        }
        setLoading(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                activeOrganization,
                loading,
                hasOrganization,
                isSuperAdmin: user?.isSuperAdmin ?? false,
                signIn,
                signOut,
                createOrganization,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};