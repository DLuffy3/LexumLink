import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import HelpButton from '../components/HelpButton';

interface Organization {
    id: string;
    name: string;
}

export default function CreateUser() {
    const { isSuperAdmin } = useAuth();  
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        createNewOrganization: false,
        newOrganizationName: '',
        existingOrganizationId: '',
    });
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            const res = await api.get('/organizations');
            setOrganizations(res.data);
        } catch (err) {
            console.error('Failed to fetch organizations', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                createNewOrganization: formData.createNewOrganization,
                newOrganizationName: formData.createNewOrganization ? formData.newOrganizationName : undefined,
                existingOrganizationId: !formData.createNewOrganization && formData.existingOrganizationId ? formData.existingOrganizationId : undefined,
            };
            await api.post('/admin/users', payload);
            alert('User created successfully!');
            navigate('/dashboard');
        } catch (err: unknown) {
            console.error(err);
            let errorMessage = 'Failed to create user';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { error?: string } } };
                errorMessage = axiosError.response?.data?.error || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isSuperAdmin) {
        return <div className="p-6 text-red-300">Access denied. Only super administrators can create users.</div>;
    }

    return (
        <>
            <HelpButton
                    title="Create New User"
                    description="Super admin only — add a new operator and assign them to an organisation."
                    steps={[
                        'Fill in the new user\'s name, email and a temporary password.',
                        'Either create a new organisation for them, or assign them to an existing one.',
                        'Click "Create User" to save, or Cancel to go back.',
                    ]}
                />
            <main className="p-6 pt-16">
                    <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-lg shadow p-6">
                        <h1 className="text-2xl font-bold mb-6">Create New User</h1>
                        {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded mb-4">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" name="firstName" placeholder="First name" value={formData.firstName} onChange={handleInputChange} className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded" required />
                                <input type="text" name="lastName" placeholder="Last name" value={formData.lastName} onChange={handleInputChange} className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded" required />
                            </div>
                            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded w-full" required />
                            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded w-full" required />

                            <div className="flex items-center space-x-2">
                                <input type="checkbox" name="createNewOrganization" id="createNew" checked={formData.createNewOrganization} onChange={handleInputChange} />
                                <label htmlFor="createNew">Create a new organization</label>
                            </div>

                            {formData.createNewOrganization ? (
                                <input type="text" name="newOrganizationName" placeholder="New organization name" value={formData.newOrganizationName} onChange={handleInputChange} className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded w-full" required={formData.createNewOrganization} />
                            ) : (
                                <select name="existingOrganizationId" value={formData.existingOrganizationId} onChange={handleInputChange} className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded w-full" required={!formData.createNewOrganization}>
                                    <option value="">Select an organization</option>
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                            )}

                            <div className="flex gap-3">
                                <button type="submit" disabled={loading} className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white py-2 rounded disabled:opacity-50">
                                    {loading ? 'Creating...' : 'Create User'}
                                </button>
                                <button type="button" onClick={() => navigate('/super-admin')} className="flex-1 bg-[var(--overlay-med)] text-[var(--text)] py-2 rounded hover:bg-[var(--overlay-strong)]">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
            </main>
        </>
    );
}