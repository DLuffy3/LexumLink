import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';
import Spinner from '../components/Spinner';

interface Client {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber: string;
    address: string;
}

export default function EditClient() {
    const { id } = useParams<{ id: string }>();
    const { activeOrganization } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<Client>({
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        idNumber: '',
        address: '',
    });

    useEffect(() => {
        if (id && activeOrganization) fetchClient();
    }, [id, activeOrganization]);

    const fetchClient = async () => {
        try {
            const res = await api.get(`/clients/${id}`);
            setFormData(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load client data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.put(`/clients/${id}`, formData);
            navigate('/clients');
        } catch (err) {
            console.error(err);
            setError('Failed to update client');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                    <main className="p-6 pt-16">
                        <Spinner />
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                <div className="fixed top-4 left-4 z-30">
                    <button onClick={toggleSidebar} className="p-2 rounded-md bg-white shadow-md text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                <main className="p-6 pt-16">
                    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
                        <h1 className="text-2xl font-bold mb-6">Edit Client</h1>
                        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First name *"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="border p-2 rounded"
                                    required
                                />
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last name *"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="border p-2 rounded"
                                    required
                                />
                            </div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                className="border p-2 rounded w-full"
                            />
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="border p-2 rounded w-full"
                            />
                            <input
                                type="text"
                                name="idNumber"
                                placeholder="ID Number"
                                value={formData.idNumber}
                                onChange={handleChange}
                                className="border p-2 rounded w-full"
                            />
                            <textarea
                                name="address"
                                placeholder="Address"
                                rows={3}
                                value={formData.address}
                                onChange={handleChange}
                                className="border p-2 rounded w-full"
                            />
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/clients')}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}