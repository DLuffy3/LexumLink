import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

interface Registration {
    id: string;
    clientReferenceNumber: string;
    companyName: string;
    contactFullName: string;
    contactEmail: string;
    servicePackage: string;
    status: string;
    createdAt: string;
}

export default function SuperAdminSignups() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'activated' | 'rejected'>('pending');

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const res = await api.get('/admin/client-registrations');
            setRegistrations(res.data);
        } catch (err) {
            console.error('Failed to load registrations', err);
            setError('Failed to load sign-ups');
        } finally {
            setLoading(false);
        }
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'pill-amber',
            activated: 'pill-green',
            rejected: 'pill-red',
        };
        return colors[status] || 'pill-neutral';
    };

    const filtered = filter === 'all' ? registrations : registrations.filter(r => r.status === filter);
    const pendingCount = registrations.filter(r => r.status === 'pending').length;

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
                title="Signups"
                description="New client registrations submitted through the public sign-up page, awaiting review."
                steps={[
                    'Click a reference number to view the full submitted agreement, including the drawn signature.',
                    'Activate a pending sign-up to create its Organization and first admin user — login details are emailed automatically.',
                    'Reject a sign-up that shouldn\'t proceed, with a reason for your records.',
                ]}
            />

            <main className="p-6 pt-16">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <h1 className="text-2xl font-bold text-[var(--text)]">
                            Signups {pendingCount > 0 && <span className="ml-2 text-sm font-semibold pill-amber px-2 py-1 rounded-full align-middle">{pendingCount} pending</span>}
                        </h1>
                        <div className="flex gap-2">
                            {(['pending', 'activated', 'rejected', 'all'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-[var(--brand)] text-white' : 'bg-[var(--overlay-weak)] text-[var(--muted)] hover:bg-[var(--overlay-med)]'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded mb-4">{error}</div>}

                    <div className="bg-[var(--surface)] rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--border)]">
                            <thead className="bg-[var(--overlay-weak)]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Reference #</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Company</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Contact</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Package</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Submitted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">No sign-ups here.</td>
                                    </tr>
                                ) : (
                                    filtered.map(r => (
                                        <tr key={r.id}>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <Link to={`/super-admin/signups/${r.id}`} className="text-[var(--brand-accent)] hover:underline font-medium">
                                                    {r.clientReferenceNumber}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">{r.companyName}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div>{r.contactFullName}</div>
                                                <div className="text-xs text-[var(--faint)]">{r.contactEmail}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap capitalize">{r.servicePackage}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(r.status)}`}>{r.status}</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </>
    );
}
