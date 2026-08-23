import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

interface Organization {
    id: string;
    name: string;
}

interface UserForm {
    firstName: string;
    lastName: string;
    email: string;
    organizationId: string;
    isSuperAdmin: boolean;
    isActive: boolean;
    resetLockout: boolean;
    newPassword: string;
}

export default function SuperAdminEditUser() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [formData, setFormData] = useState<UserForm>({
        firstName: '',
        lastName: '',
        email: '',
        organizationId: '',
        isSuperAdmin: false,
        isActive: true,
        resetLockout: false,
        newPassword: '',
    });

    useEffect(() => {
        if (id) {
            fetchUser();
            fetchOrganizations();
        }
    }, [id]);

    const fetchUser = async () => {
        try {
            const res = await api.get(`/admin/users/${id}`);
            const data = res.data;
            setFormData({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                organizationId: data.organizationId || '',
                isSuperAdmin: data.isSuperAdmin,
                isActive: data.isActive,
                resetLockout: false,
                newPassword: '',
            });
        } catch (err) {
            console.error(err);
            setError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const res = await api.get('/organizations');
            setOrganizations(res.data);
        } catch (err) {
            console.error('Failed to fetch organizations', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.put(`/admin/users/${id}`, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                organizationId: formData.organizationId || null,
                isSuperAdmin: formData.isSuperAdmin,
                isActive: formData.isActive,
                resetLockout: formData.resetLockout,
                newPassword: formData.newPassword || null,
            });
            navigate('/super-admin/users');
        } catch (err: unknown) {
            console.error(err);
            let errorMessage = 'Failed to update user';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { error?: string } } };
                errorMessage = axiosError.response?.data?.error || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (!user?.isSuperAdmin) {
        return <div className="p-6 text-red-300">Access denied. Super admin only.</div>;
    }

    if (loading) {
        return (
            <main className="p-6 pt-16">
                <Spinner />
            </main>
        );
    }

    return (
        <>
            <HelpButton
                title="Edit User"
                description="Update a user's details, organisation, role and account status."
                steps={[
                    'Change name, email or organisation as needed.',
                    'Toggle "Super Admin" to grant or remove platform-wide admin access.',
                    'Toggle "Active" off to deactivate an account — a deactivated user can no longer sign in.',
                    'If an account is locked out from too many failed sign-in attempts, tick "Clear lockout" to let them try again immediately.',
                    'Leave the password field blank to keep the user\'s current password, or enter a new one to reset it.',
                ]}
            />
            <main className="p-6 pt-16">
                <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold mb-6">Edit User</h1>
                    {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded mb-4">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First name"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                required
                            />
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last name"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                required
                            />
                        </div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded w-full focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Organization</label>
                            <select
                                name="organizationId"
                                value={formData.organizationId}
                                onChange={handleChange}
                                className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            >
                                <option value="">No organisation</option>
                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" name="isSuperAdmin" id="isSuperAdmin" checked={formData.isSuperAdmin} onChange={handleChange} />
                                <label htmlFor="isSuperAdmin" className="text-sm text-[var(--text)]">Super Admin</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="isActive" id="isActive" checked={formData.isActive} onChange={handleChange} />
                                <label htmlFor="isActive" className="text-sm text-[var(--text)]">Active (unchecking deactivates the account)</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="resetLockout" id="resetLockout" checked={formData.resetLockout} onChange={handleChange} />
                                <label htmlFor="resetLockout" className="text-sm text-[var(--text)]">Clear lockout (reset failed sign-in attempts)</label>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-[var(--border)]">
                            <label className="block text-sm font-medium text-[var(--muted)] mb-1 mt-2">Reset password (optional)</label>
                            <input
                                type="password"
                                name="newPassword"
                                placeholder="Leave blank to keep current password"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded w-full focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-[var(--brand)] text-white px-4 py-2 rounded hover:bg-[var(--brand-hover)] disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/super-admin/users')}
                                className="bg-[var(--overlay-med)] text-[var(--text)] px-4 py-2 rounded hover:bg-[var(--overlay-strong)]"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
