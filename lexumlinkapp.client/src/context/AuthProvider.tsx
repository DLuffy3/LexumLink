import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';
import type { User, Organization } from './AuthTypes';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            fetchUserOrganizations();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserOrganizations = async () => {
        try {
            const res = await api.get<Organization[]>('/auth/organizations');
            const orgs = res.data;

            setOrganizations(orgs);

            if (orgs.length > 0) {
                const savedOrgId = localStorage.getItem('activeOrgId');
                const active = orgs.find(org => org.id === savedOrgId) || orgs[0];

                setActiveOrganization(active);
                localStorage.setItem('activeOrgId', active.id);
            }
        } catch (error) {
            console.error('Failed to fetch organizations', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        const res = await api.post<{
            user: User;
            token: string;
            organizations: Organization[];
            hasOrganizations: boolean;
        }>('/auth/signin', { email, password });

        const { user, token, organizations: orgs, hasOrganizations } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);
        setOrganizations(orgs);

        if (hasOrganizations && orgs.length > 0) {
            setActiveOrganization(orgs[0]);
            localStorage.setItem('activeOrgId', orgs[0].id);
        } else {
            setActiveOrganization(null);
        }
    };

    const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
        const res = await api.post<{
            user: User;
            token: string;
        }>('/auth/signup', { email, password, firstName, lastName });

        const { user, token } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);
        setOrganizations([]);
        setActiveOrganization(null);
    };

    const signOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('activeOrgId');

        setUser(null);
        setOrganizations([]);
        setActiveOrganization(null);
    };

    const createOrganization = async (name: string) => {
        const res = await api.post<Organization>('/organizations', { name });
        const newOrg = res.data;

        setOrganizations(prev => [...prev, newOrg]);
        setActiveOrganization(newOrg);

        localStorage.setItem('activeOrgId', newOrg.id);

        await switchOrganization(newOrg.id);
    };

    const switchOrganization = async (orgId: string) => {
        const res = await api.post<{ token: string }>('/auth/switch-organization', {
            organizationId: orgId
        });

        localStorage.setItem('token', res.data.token);

        const org = organizations.find(o => o.id === orgId);
        if (org) setActiveOrganization(org);

        localStorage.setItem('activeOrgId', orgId);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                organizations,
                activeOrganization,
                loading,
                signIn,
                signUp,
                signOut,
                createOrganization,
                switchOrganization
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};