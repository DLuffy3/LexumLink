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
        return colors[status] || 'bg-[var(--overlay-weak)] text-[var(--text)]';
    };

    // Filter claims by client name or claim number
    const filteredClaims = claims.filter(claim =>
        (claim.clientName && claim.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
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
            <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
                <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                    <div className="fixed top-4 left-4 z-30">
                        <button onClick={toggleSidebar} className="p-2 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]">
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
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                <div className="fixed top-4 left-4 z-30">
                    <button onClick={toggleSidebar} className="p-2 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]">
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
                            <h1 className="text-2xl font-bold text-[var(--text)]">RAF Claims</h1>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Search by client or claim #..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded px-3 py-2 w-64 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                />
                                <Link to="/claims/new" className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-md">
                                    Add Claim
                                </Link>
                            </div>
                        </div>
                        <div className="bg-[var(--surface)] rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-[var(--border)]">
                                <thead className="bg-[var(--overlay-weak)]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Claim #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">RAF Ref</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Amount Requested</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {filteredClaims.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                                                {searchQuery ? 'No claims match your search.' : 'No claims found. Click "Add Claim" to create one.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredClaims.map((claim) => (
                                            <tr key={claim.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link to={`/claims/${claim.id}`} className="text-[var(--brand-accent)] hover:underline">
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
                                                    <Link to={`/claims/${claim.id}/edit`} className="text-[var(--brand-accent)] hover:text-[var(--text)] mr-3">
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