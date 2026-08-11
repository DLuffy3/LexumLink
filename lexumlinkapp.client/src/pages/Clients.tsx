import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import HelpButton from '../components/HelpButton';
import { motion } from 'framer-motion';
import Spinner from '../components/Spinner';

interface Client {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber: string;
    address: string;
    createdAt: string;
}

interface ErrorResponse {
    error?: string;
    title?: string;
}

export default function Clients() {
    const { activeOrganization } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        idNumber: '',
        address: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activeOrganization) fetchClients();
    }, [activeOrganization]);

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.post('/clients', formData);
            setIsModalOpen(false);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                idNumber: '',
                address: '',
            });
            fetchClients();
        } catch (err: unknown) {
            console.error('Full error:', err);
            let errorMessage = 'Failed to add client';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: ErrorResponse } };
                console.error('Backend response:', axiosError.response?.data);
                errorMessage = axiosError.response?.data?.error ||
                    axiosError.response?.data?.title ||
                    JSON.stringify(axiosError.response?.data);
            }
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                title="Clients"
                description="Every client in your organisation, with quick search and a form to add new ones."
                steps={[
                    'Use the search bar to find a client by name.',
                    'Click "Add Client" to open the new client form.',
                    'Click a client\'s name to view their full record — cases, claims and documents.',
                ]}
                tips={['On mobile, swipe the table sideways if a column is cut off.']}
            />

            <main className="p-6 pt-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <h1 className="text-2xl font-bold text-[var(--text)]">Clients</h1>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded px-3 py-2 w-full sm:w-64 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            />
                            <button
                                onClick={() => setIsModalOpen(true)}
                                disabled={!activeOrganization}
                                className={`bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-md text-center whitespace-nowrap ${!activeOrganization ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Add Client
                            </button>
                        </div>
                    </div>

                    {error && !isModalOpen && (
                        <div className="bg-red-500/12 border-l-4 border-red-400 text-red-300 p-3 mb-4 rounded">
                            {error}
                        </div>
                    )}

                    <div className="bg-[var(--surface)] rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--border)]">
                            <thead className="bg-[var(--overlay-weak)]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {filteredClients.map(client => (
                                    <tr key={client.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link to={`/clients/${client.id}`} className="text-[var(--brand-accent)] hover:underline">
                                                {client.firstName} {client.lastName}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{client.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link to={`/clients/${client.id}/edit`} className="text-[var(--brand-accent)] hover:text-[var(--text)] mr-3">
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredClients.length === 0 && (
                            <div className="p-6 text-center text-[var(--muted)]">
                                {searchQuery ? 'No clients match your search.' : 'No clients found. Click "Add Client" to create one.'}
                            </div>
                        )}
                    </div>
                </motion.div>
            </main>

            {/* Modal for adding client */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-[var(--backdrop)]"></div>
                        </div>

                        <div className="inline-block align-bottom bg-[var(--surface)] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-[var(--surface)] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-[var(--text)] mb-4">Add New Client</h3>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        name="firstName"
                                                        placeholder="First name *"
                                                        value={formData.firstName}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded-md focus:outline-none focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        name="lastName"
                                                        placeholder="Last name *"
                                                        value={formData.lastName}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded-md focus:outline-none focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                                        required
                                                    />
                                                </div>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    placeholder="Email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded-md focus:outline-none focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                                />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    placeholder="Phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded-md focus:outline-none focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                                />
                                                <input
                                                    type="text"
                                                    name="idNumber"
                                                    placeholder="ID Number"
                                                    value={formData.idNumber}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded-md focus:outline-none focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                                />
                                                <textarea
                                                    name="address"
                                                    placeholder="Address"
                                                    rows={2}
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded-md focus:outline-none focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                                />
                                            </div>
                                            {error && <div className="mt-2 text-sm text-red-300">{error}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[var(--overlay-weak)] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[var(--brand)] text-base font-medium text-white hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-ring)] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-[var(--border)] shadow-sm px-4 py-2 bg-[var(--overlay-weak)] text-base font-medium text-[var(--muted)] hover:bg-[var(--overlay-weak)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-ring)] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
