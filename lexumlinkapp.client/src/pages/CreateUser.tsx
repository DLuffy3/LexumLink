import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

interface Organization {
    id: string;
    name: string;
}

export default function CreateUser() {
    const { isSuperAdmin } = useAuth();  
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
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
        return <div className="p-6 text-red-600">Access denied. Only super administrators can create users.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                <div className="fixed top-4 left-4 z-30">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md bg-white shadow-md">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
                <main className="p-6 pt-16">
                    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
                        <h1 className="text-2xl font-bold mb-6">Create New User</h1>
                        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" name="firstName" placeholder="First name" value={formData.firstName} onChange={handleInputChange} className="border p-2 rounded" required />
                                <input type="text" name="lastName" placeholder="Last name" value={formData.lastName} onChange={handleInputChange} className="border p-2 rounded" required />
                            </div>
                            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} className="border p-2 rounded w-full" required />
                            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} className="border p-2 rounded w-full" required />

                            <div className="flex items-center space-x-2">
                                <input type="checkbox" name="createNewOrganization" id="createNew" checked={formData.createNewOrganization} onChange={handleInputChange} />
                                <label htmlFor="createNew">Create a new organization</label>
                            </div>

                            {formData.createNewOrganization ? (
                                <input type="text" name="newOrganizationName" placeholder="New organization name" value={formData.newOrganizationName} onChange={handleInputChange} className="border p-2 rounded w-full" required={formData.createNewOrganization} />
                            ) : (
                                <select name="existingOrganizationId" value={formData.existingOrganizationId} onChange={handleInputChange} className="border p-2 rounded w-full" required={!formData.createNewOrganization}>
                                    <option value="">Select an organization</option>
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                            )}

                            <button type="submit" disabled={loading} className="w-full bg-red-700 text-white py-2 rounded hover:bg-red-800 disabled:opacity-50">
                                {loading ? 'Creating...' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}