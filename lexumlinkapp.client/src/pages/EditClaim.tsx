import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';
import Spinner from '../components/Spinner';

interface Case {
    id: string;
    caseNumber: string;
    clientName?: string;
}

interface ClaimData {
    id: string;
    claimNumber: string;
    caseId: string;
    status: string;
    rafReference: string;
    amountRequested: number | null;
    amountAwarded: number | null;
}

export default function EditClaim() {
    const { id } = useParams<{ id: string }>();
    const { activeOrganization } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [cases, setCases] = useState<Case[]>([]);
    const [formData, setFormData] = useState<ClaimData>({
        id: '',
        claimNumber: '',
        caseId: '',
        status: 'in_progress',
        rafReference: '',
        amountRequested: null,
        amountAwarded: null,
    });

    useEffect(() => {
        if (id && activeOrganization) {
            fetchClaim();
            fetchCases();
        }
    }, [id, activeOrganization]);

    const fetchClaim = async () => {
        try {
            const res = await api.get(`/claims/${id}`);
            const data = res.data;
            setFormData({
                id: data.id,
                claimNumber: data.claimNumber,
                caseId: data.caseId,
                status: data.status,
                rafReference: data.rafReference || '',
                amountRequested: data.amountRequested,
                amountAwarded: data.amountAwarded,
            });
        } catch (err) {
            console.error(err);
            setError('Failed to load claim data');
        } finally {
            setLoading(false);
        }
    };

    const fetchCases = async () => {
        try {
            const res = await api.get('/cases');
            setCases(res.data);
        } catch (err) {
            console.error('Failed to fetch cases', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormData({ ...formData, [name]: value === '' ? null : parseFloat(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.put(`/claims/${id}`, formData);
            navigate('/claims');
        } catch (err) {
            console.error(err);
            setError('Failed to update claim');
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
                        <h1 className="text-2xl font-bold mb-6">Edit RAF Claim</h1>
                        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Case *</label>
                                <select
                                    name="caseId"
                                    value={formData.caseId}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                >
                                    <option value="">Select a case</option>
                                    {cases.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.caseNumber} - {c.clientName || 'No client'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Claim Number *</label>
                                <input
                                    type="text"
                                    name="claimNumber"
                                    value={formData.claimNumber}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">RAF Reference</label>
                                <input
                                    type="text"
                                    name="rafReference"
                                    value={formData.rafReference}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Requested (R)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="amountRequested"
                                    value={formData.amountRequested ?? ''}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Awarded (R)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="amountAwarded"
                                    value={formData.amountAwarded ?? ''}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                >
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
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
                                    onClick={() => navigate('/claims')}
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