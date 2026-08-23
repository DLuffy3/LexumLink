import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import HelpButton from '../components/HelpButton';
import ClientAvatar from '../components/ClientAvatar';
import { motion } from 'framer-motion';
import Spinner from '../components/Spinner';

interface Claim {
    id: string;
    claimNumber: string;
    clientId: string;
    clientName?: string;
    clientPhotoUrl?: string | null;
    status: string;
    rafReference: string;
    amountRequested: number;
    amountAwarded: number;
    createdAt: string;
}

export default function Claims() {
    const { activeOrganization } = useAuth();
    const navigate = useNavigate();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            in_progress: 'pill-amber',
            completed: 'pill-green',
            critical: 'pill-red',
        };
        return colors[status] || 'pill-neutral';
    };

    // Filter claims by client name or claim number
    const filteredClaims = claims.filter(claim =>
        (claim.clientName && claim.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase())
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
                title="Claims"
                description="RAF claims linked to your cases, including requested and awarded amounts."
                steps={[
                    'Use the search bar to find a claim.',
                    'Click "Add Claim" and select the case it belongs to.',
                    'Come back and edit a claim once the awarded amount is confirmed.',
                ]}
            />

            <main className="p-6 pt-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <h1 className="text-2xl font-bold text-[var(--text)]">RAF Claims</h1>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search by client or claim #..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded px-3 py-2 w-full sm:w-64 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            />
                            <Link to="/claims/new" className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-md text-center whitespace-nowrap">
                                Add Claim
                            </Link>
                        </div>
                    </div>
                    <div className="bg-[var(--surface)] rounded-lg shadow overflow-x-auto">
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
                                                <Link to={`/claims/${claim.id}/edit`} className="text-[var(--brand-accent)] hover:underline">
                                                    {claim.claimNumber}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <ClientAvatar
                                                        firstName={claim.clientName?.split(' ')[0]}
                                                        lastName={claim.clientName?.split(' ').slice(1).join(' ')}
                                                        photoUrl={claim.clientPhotoUrl}
                                                        size="xs"
                                                    />
                                                    {claim.clientName || claim.clientId}
                                                </div>
                                            </td>
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
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/claims/${claim.id}/edit`)}
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
