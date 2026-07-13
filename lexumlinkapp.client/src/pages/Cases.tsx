import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import Spinner from '../components/Spinner';

interface Case {
    id: string;
    caseNumber: string;
    clientId: string;
    clientName?: string;
    status: string;
    incidentDate: string;
    description: string;
    createdAt: string;
}

export default function Cases() {
    const { activeOrganization } = useAuth();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (activeOrganization) {
            fetchCases();
        } else {
            setLoading(false);
        }
    }, [activeOrganization]);

    const fetchCases = async () => {
        try {
            const res = await api.get('/cases');
            setCases(res.data);
        } catch (err) {
            console.error('Failed to fetch cases', err);
            setError('Could not load cases. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            open: 'bg-green-500/15 text-green-300',
            in_progress: 'bg-yellow-500/15 text-yellow-300',
            closed: 'bg-[var(--overlay-weak)] text-[var(--text)]',
            critical: 'bg-red-500/15 text-red-300',
        };
        return colors[status] || 'bg-[var(--overlay-weak)] text-[var(--text)]';
    };

    // Filter cases based on client name or case number
    const filteredCases = cases.filter(caseItem =>
        caseItem.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (caseItem.clientName && caseItem.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
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
                            <h1 className="text-2xl font-bold text-[var(--text)]">Cases</h1>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Search by client or case number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded px-3 py-2 w-64 focus:border-[#8B7CF6] focus:ring-[#8B7CF6]/40"
                                />
                                <Link to="/cases/new" className="bg-[#6D5EF5] hover:bg-[#5B4FE0] text-white px-4 py-2 rounded-md">
                                    Add Case
                                </Link>
                            </div>
                        </div>
                        <div className="bg-[var(--surface)] rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-[var(--border)]">
                                <thead className="bg-[var(--overlay-weak)]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Case #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Incident Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {filteredCases.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted)]">
                                                {searchQuery ? 'No cases match your search.' : 'No cases found. Click "Add Case" to create one.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCases.map((caseItem) => (
                                            <tr key={caseItem.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link to={`/cases/${caseItem.id}`} className="text-[var(--brand-accent)] hover:underline">
                                                        {caseItem.caseNumber}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {caseItem.clientName || caseItem.clientId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(caseItem.status)}`}>
                                                        {caseItem.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {new Date(caseItem.incidentDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link to={`/cases/${caseItem.id}/edit`} className="text-[var(--brand-accent)] hover:text-[var(--text)] mr-3">
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