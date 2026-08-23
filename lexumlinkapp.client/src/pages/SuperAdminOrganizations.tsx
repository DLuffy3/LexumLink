import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

interface AdminOrganization {
    id: string;
    name: string;
    plan: string;
    maxUsers: number;
    maxClients: number | null;
    storageLimitGb: number;
    isActive: boolean;
    createdAt: string;
    userCount: number;
    clientCount: number;
}

const PLAN_LABELS: Record<string, string> = {
    starter: 'Starter',
    professional: 'Professional',
    custom: 'Custom',
};

const planBadge = (plan: string) => {
    const colors: Record<string, string> = {
        starter: 'pill-neutral',
        professional: 'pill-blue',
        custom: 'pill-green',
    };
    return colors[plan] || 'pill-neutral';
};

export default function SuperAdminOrganizations() {
    const { user } = useAuth();
    const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchOrgs();
    }, []);

    const fetchOrgs = async () => {
        try {
            const res = await api.get('/admin/organizations');
            setOrgs(res.data);
        } catch (err) {
            console.error('Failed to fetch organizations', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user?.isSuperAdmin) {
        return <div className="p-6 text-red-300">Access denied. Super admin only.</div>;
    }

    const filtered = orgs.filter((o) => o.name.toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <>
            <HelpButton
                title="Organizations"
                description="Every organisation on the platform, with its plan and usage limits."
                steps={[
                    'Search by organisation name using the search box.',
                    'Users and Clients columns show current usage against the plan\'s limit.',
                    'Click an organisation to change its plan, limits, name or active status.',
                    'Use "Add Organization" to set up an empty organisation ahead of assigning people to it — handy for a Custom-tier customer that needs several organisations.',
                ]}
            />
            <main className="p-6 pt-16">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <h1 className="text-2xl font-bold text-[var(--text)]">Organizations</h1>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Search organizations..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded px-3 py-2 text-sm"
                            />
                            <Link
                                to="/super-admin/organizations/new"
                                className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                            >
                                + Add Organization
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <Spinner />
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-[var(--muted)] py-10">No organizations found.</div>
                    ) : (
                        <div className="bg-[var(--surface)] rounded-lg shadow overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--border)]">
                                <thead className="bg-[var(--overlay-weak)]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Plan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Users</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Clients</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Storage</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {filtered.map((o) => (
                                        <tr key={o.id}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-[var(--text)]">{o.name}</div>
                                                <div className="text-xs text-[var(--muted)]">Created {new Date(o.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${planBadge(o.plan)}`}>{PLAN_LABELS[o.plan] || o.plan}</span>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--text)]">{o.userCount} / {o.maxUsers}</td>
                                            <td className="px-6 py-4 text-[var(--text)]">{o.clientCount} / {o.maxClients ?? '∞'}</td>
                                            <td className="px-6 py-4 text-[var(--text)]">{o.storageLimitGb} GB</td>
                                            <td className="px-6 py-4">
                                                {o.isActive ? (
                                                    <span className="pill-green text-xs px-2 py-0.5 rounded-full">Active</span>
                                                ) : (
                                                    <span className="pill-red text-xs px-2 py-0.5 rounded-full">Deactivated</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link to={`/super-admin/organizations/${o.id}/edit`} className="text-[var(--brand-accent)] hover:underline text-sm font-medium">
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
