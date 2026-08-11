import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import HelpButton from '../components/HelpButton';
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
                    title="Edit Client"
                    description="Update this client's contact details."
                    steps={[
                        'Change any field and click "Save Changes".',
                        'Click Cancel to go back without saving.',
                    ]}
                />

            <main className="p-6 pt-16">
                    <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-lg shadow p-6">
                        <h1 className="text-2xl font-bold mb-6">Edit Client</h1>
                        {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded mb-4">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First name *"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                    required
                                />
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last name *"
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
                            />
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded w-full focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            />
                            <input
                                type="text"
                                name="idNumber"
                                placeholder="ID Number"
                                value={formData.idNumber}
                                onChange={handleChange}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded w-full focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            />
                            <textarea
                                name="address"
                                placeholder="Address"
                                rows={3}
                                value={formData.address}
                                onChange={handleChange}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] p-2 rounded w-full focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            />
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
                                    onClick={() => navigate('/clients')}
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