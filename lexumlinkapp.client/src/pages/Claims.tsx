import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';

interface Claim {
    id: string;
    claimNumber: string;
    clientId: string;
    clientName?: string;
    status: string;
    rafReference: string;
    amountRequested: number;
    amountAwarded: number;
    createdAt: string;
}

export default function Claims() {
    const { activeOrganization } = useAuth();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (activeOrganization) fetchClaims();
    }, [activeOrganization]);

    const fetchClaims = async () => {
        try {
            const res = await api.get('/claims');
            setClaims(res.data);
        } catch (err) {
            console.error('Failed to fetch claims', err);
            setError('Could not load claims. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            in_progress: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            critical: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) return <div className="p-6">Loading claims...</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;

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
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">RAF Claims</h1>
                            <Link to="/claims/new" className="bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800">
                                Add Claim
                            </Link>
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RAF Ref</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Requested</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {claims.map((claim) => (
                                        <tr key={claim.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link to={`/claims/${claim.id}`} className="text-red-700 hover:underline">
                                                    {claim.claimNumber}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{claim.clientName || claim.clientId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{claim.rafReference}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                R {claim.amountRequested?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(claim.status)}`}>
                                                    {claim.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link to={`/claims/${claim.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {claims.length === 0 && (
                                <div className="p-6 text-center text-gray-500">No claims found. Click "Add Claim" to create one.</div>
                            )}
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}