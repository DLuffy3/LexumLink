export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isSuperAdmin: boolean;
}

export interface Organization {
    id: string;
    name: string;
    role: string;
}

export interface AuthContextType {
    user: User | null;
    activeOrganization: Organization | null;
    loading: boolean;
    hasOrganization: boolean;
    isSuperAdmin: boolean;
    signIn: (email: string, password: string) => Promise<{ user: User; organization: Organization | null; hasOrganization: boolean }>;
    signOut: () => void;
    createOrganization: (name: string) => Promise<void>;
}