import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';

interface Case {
    id: string;
    caseNumber: string;
    clientName?: string;
}

export default function NewClaim() {
    const { activeOrganization } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [cases, setCases] = useState<Case[]>([]);
    const [formData, setFormData] = useState({
        caseId: '',
        claimNumber: '',
        status: 'in_progress',
        rafReference: '',
        amountRequested: '',
        amountAwarded: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const res = await api.get('/cases');
            setCases(res.data);
        } catch (err) {
            console.error('Failed to fetch cases', err);
            setError('Could not load cases. Please try again.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Convert numeric fields to numbers
        const payload = {
            caseId: formData.caseId,
            claimNumber: formData.claimNumber,
            status: formData.status,
            rafReference: formData.rafReference || null,
            amountRequested: formData.amountRequested ? parseFloat(formData.amountRequested) : null,
            amountAwarded: formData.amountAwarded ? parseFloat(formData.amountAwarded) : null,
        };

        try {
            await api.post('/claims', payload);
            navigate('/claims');
        } catch (err: any) {
            console.error('Failed to create claim', err);
            let errorMsg = 'Failed to create new claim.';
            if (err.response && err.response.data) {
                errorMsg = err.response.data.error || JSON.stringify(err.response.data);
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                <div className="fixed top-4 left-4 z-30">
                    <button onClick={toggleSidebar} className="p-2 rounded-md bg-white shadow-md">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
                <main className="p-6 pt-16">
                    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
                        <h1 className="text-2xl font-bold mb-6">Add New RAF Claim</h1>
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
                                    value={formData.amountRequested}
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
                                    value={formData.amountAwarded}
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
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-700 text-white py-2 rounded hover:bg-red-800 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Claim'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}