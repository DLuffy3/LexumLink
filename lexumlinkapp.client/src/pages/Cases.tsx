import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import HelpButton from '../components/HelpButton';
import ClientAvatar from '../components/ClientAvatar';
import { motion } from 'framer-motion';
import Spinner from '../components/Spinner';

interface Case {
    id: string;
    caseNumber: string;
    clientId: string;
    clientName?: string;
    clientPhotoUrl?: string | null;
    status: string;
    incidentDate: string;
    description: string;
    createdAt: string;
}

export default function Cases() {
    const { activeOrganization } = useAuth();
    const navigate = useNavigate();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            open: 'pill-green',
            in_progress: 'pill-amber',
            closed: 'pill-neutral',
            critical: 'pill-red',
        };
        return colors[status] || 'pill-neutral';
    };

    // Filter cases based on client name or case number
    const filteredCases = cases.filter(caseItem =>
        caseItem.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (caseItem.clientName && caseItem.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <main className="p-6 pt-16">
                <Spinner />
            </main>
        );
    }

    if (error) {
        return (
            <main className="p-6 pt-16">
                <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-4 rounded">{error}</div>
            </main>
        );
    }

    return (
        <>
            <HelpButton
                title="Cases"
                description="Every case your organisation is handling, with its current status."
                steps={[
                    'Use the search bar to find a case by number or client name.',
                    'Click "Add Case" to open a new case.',
                    'Click a case number to view it, or "Edit" to change its details.',
                ]}
                tips={['Status colors: green = open, amber = in progress, red = critical, grey = closed.']}
            />

            <main className="p-6 pt-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <h1 className="text-2xl font-bold text-[var(--text)]">Cases</h1>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search by client or case number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded px-3 py-2 w-full sm:w-64 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            />
                            <Link to="/cases/new" className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-md text-center whitespace-nowrap">
                                Add Case
                            </Link>
                        </div>
                    </div>
                    <div className="bg-[var(--surface)] rounded-lg shadow overflow-x-auto">
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
                                                <Link to={`/cases/${caseItem.id}/edit`} className="text-[var(--brand-accent)] hover:underline">
                                                    {caseItem.caseNumber}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <ClientAvatar
                                                        firstName={caseItem.clientName?.split(' ')[0]}
                                                        lastName={caseItem.clientName?.split(' ').slice(1).join(' ')}
                                                        photoUrl={caseItem.clientPhotoUrl}
                                                        size="xs"
                                                    />
                                                    {caseItem.clientName || caseItem.clientId}
                                                </div>
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
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/cases/${caseItem.id}/edit`)}
                                                    className="bg-[var(--brand-soft)] text-[var(--brand-accent)] px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-[var(--brand)] hover:text-white transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </main>
        </>
    );
}
