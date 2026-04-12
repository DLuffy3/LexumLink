export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

export interface Organization {
    id: string;
    name: string;
    role: string;
}

export interface AuthContextType {
    user: User | null;
    organizations: Organization[];
    activeOrganization: Organization | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
    signOut: () => void;
    createOrganization: (name: string) => Promise<void>;
    switchOrganization: (orgId: string) => Promise<void>;
}