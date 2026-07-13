import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import Spinner from '../components/Spinner';

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
    const [searchQuery, setSearchQuery] = useState('');

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
            in_progress: 'bg-yellow-500/15 text-yellow-300',
            completed: 'bg-green-500/15 text-green-300',
            critical: 'bg-red-500/15 text-red-300',
        };
        return colors[status] || 'bg-white/5 text-[#F3F2FA]';
    };

    // Filter claims by client name or claim number
    const filteredClaims = claims.filter(claim =>
        (claim.clientName && claim.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#08070F] text-[#F3F2FA]">
                <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                    <main className="p-6 pt-16">
                        <Spinner />
                    </main>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#08070F] text-[#F3F2FA]">
                <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                    <div className="fixed top-4 left-4 z-30">
                        <button onClick={toggleSidebar} className="p-2 rounded-md bg-[#12111F] border border-white/10 text-[#9E9CB8] hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    <main className="p-6 pt-16">
                        <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-4 rounded">{error}</div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#08070F] text-[#F3F2FA]">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                <div className="fixed top-4 left-4 z-30">
                    <button onClick={toggleSidebar} className="p-2 rounded-md bg-[#12111F] border border-white/10 text-[#9E9CB8] hover:text-white">
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
                        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                            <h1 className="text-2xl font-bold text-[#F3F2FA]">RAF Claims</h1>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Search by client or claim #..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/5 border border-white/10 text-[#F3F2FA] placeholder-[#6D6B85] rounded px-3 py-2 w-64 focus:border-[#8B7CF6] focus:ring-[#8B7CF6]/40"
                                />
                                <Link to="/claims/new" className="bg-[#6D5EF5] hover:bg-[#5B4FE0] text-white px-4 py-2 rounded-md">
                                    Add Claim
                                </Link>
                            </div>
                        </div>
                        <div className="bg-[#12111F] rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase tracking-wider">Claim #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase tracking-wider">RAF Ref</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase tracking-wider">Amount Requested</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredClaims.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-[#9E9CB8]">
                                                {searchQuery ? 'No claims match your search.' : 'No claims found. Click "Add Claim" to create one.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredClaims.map((claim) => (
                                            <tr key={claim.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link to={`/claims/${claim.id}`} className="text-[#A78BFA] hover:underline">
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
                                                    <Link to={`/claims/${claim.id}/edit`} className="text-[#A78BFA] hover:text-white mr-3">
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}