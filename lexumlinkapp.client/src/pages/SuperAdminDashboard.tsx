import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';
import { ProgressBar, TrendBarChart, StackedStatusBar, formatBytes, usageTextColor } from '../components/charts/MiniCharts';

interface OrgCapacity {
    id: string;
    name: string;
    plan: string;
    isActive: boolean;
    maxUsers: number;
    maxClients: number | null;
    storageLimitGb: number;
    userCount: number;
    activeUserCount: number;
    clientCount: number;
    storageUsedBytes: number;
    openTickets: number;
    criticalTickets: number;
}

interface DashboardData {
    totals: {
        organizations: number;
        users: number;
        clients: number;
        cases: number;
        claims: number;
        openTickets: number;
        criticalTickets: number;
        storageUsedBytes: number;
    };
    recentSignups: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        createdAt: string;
        organizationName: string | null;
    }[];
    signupTrend: { date: string; count: number }[];
    ticketsByStatus: { new: number; active: number; critical: number; complete: number };
    organizations: OrgCapacity[];
}

const QUICK_LINKS = [
    { to: '/super-admin/users', icon: 'fa-users', label: 'Users', desc: 'View and edit every user on the platform' },
    { to: '/super-admin/organizations', icon: 'fa-building', label: 'Organizations', desc: 'Manage plans, limits and status' },
    { to: '/admin/tickets', icon: 'fa-ticket', label: 'Tickets', desc: 'Bug reports and feature requests' },
    { to: '/super-admin/settings', icon: 'fa-gear', label: 'Settings', desc: 'Branding, email and security policy' },
    { to: '/admin/users/new', icon: 'fa-user-plus', label: 'Create User', desc: 'Add a new operator to an organisation' },
];

const PLAN_LABELS: Record<string, string> = { starter: 'Starter', professional: 'Professional', custom: 'Custom' };
const planBadge = (plan: string) => {
    const colors: Record<string, string> = { starter: 'pill-neutral', professional: 'pill-blue', custom: 'pill-green' };
    return colors[plan] || 'pill-neutral';
};

// An organization needs a look if it's suspended, has a critical ticket open, or is at/near
// (80%+) any of its plan limits.
function needsAttention(o: OrgCapacity): boolean {
    if (!o.isActive) return true;
    if (o.criticalTickets > 0) return true;
    const userPct = o.maxUsers > 0 ? (o.userCount / o.maxUsers) * 100 : 0;
    const clientPct = o.maxClients ? (o.clientCount / o.maxClients) * 100 : 0;
    const storagePct = o.storageLimitGb > 0 ? (o.storageUsedBytes / (o.storageLimitGb * 1024 ** 3)) * 100 : 0;
    return userPct >= 80 || clientPct >= 80 || storagePct >= 80;
}

export default function SuperAdminDashboard() {
    const { signOut } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/admin/dashboard');
            setData(res.data);
        } catch (err) {
            console.error('Failed to load dashboard', err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="p-6 pt-16">
                <Spinner />
            </main>
        );
    }

    const stats = data ? [
        { label: 'Organizations', value: data.totals.organizations, icon: 'fa-building' },
        { label: 'Users', value: data.totals.users, icon: 'fa-users' },
        { label: 'Clients', value: data.totals.clients, icon: 'fa-user-tie' },
        { label: 'Cases', value: data.totals.cases, icon: 'fa-folder-open' },
        { label: 'Claims', value: data.totals.claims, icon: 'fa-file-invoice-dollar' },
        { label: 'Open Tickets', value: data.totals.openTickets, icon: 'fa-ticket', warn: data.totals.openTickets > 0 },
        { label: 'Critical Tickets', value: data.totals.criticalTickets, icon: 'fa-triangle-exclamation', danger: data.totals.criticalTickets > 0 },
        { label: 'Storage Used', value: formatBytes(data.totals.storageUsedBytes), icon: 'fa-database' },
    ] : [];

    const sortedOrgs = data
        ? [...data.organizations].sort((a, b) => Number(needsAttention(b)) - Number(needsAttention(a)))
        : [];

    return (
        <>
            <HelpButton
                title="Super Admin Dashboard"
                description="A platform-wide overview across every organisation on LexumLink."
                steps={[
                    'The cards at the top show live totals across every organisation.',
                    'Signups and Ticket Status charts show trend and support load at a glance.',
                    'Organization Capacity Watch flags any organisation that\'s suspended, near a plan limit, or has a critical ticket open — those appear first.',
                    'Use the quick links to manage Users, Organizations, Tickets or platform Settings.',
                ]}
            />
            <main className="p-6 pt-16">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-[var(--text)]">Super Admin Dashboard</h1>
                        <button onClick={signOut} className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-md">Sign Out</button>
                    </div>

                    {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded mb-6">{error}</div>}

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
                        {stats.map((s) => (
                            <div key={s.label} className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4">
                                <i className={`fa-solid ${s.icon} mb-2 ${s.danger ? 'text-red-500' : s.warn ? 'text-amber-500' : 'text-[var(--brand-accent)]'}`} />
                                <div className="text-2xl font-bold text-[var(--text)]">{s.value}</div>
                                <div className="text-xs text-[var(--muted)]">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-5">
                            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Signups — Last 14 Days</h2>
                            {data && (
                                <TrendBarChart
                                    data={data.signupTrend.map((d) => ({
                                        label: new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                                        value: d.count,
                                    }))}
                                />
                            )}
                        </div>
                        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-5">
                            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Tickets by Status</h2>
                            {data && (
                                <StackedStatusBar
                                    segments={[
                                        { label: 'New', value: data.ticketsByStatus.new, color: 'bg-blue-500' },
                                        { label: 'Active', value: data.ticketsByStatus.active, color: 'bg-amber-500' },
                                        { label: 'Critical', value: data.ticketsByStatus.critical, color: 'bg-red-500' },
                                        { label: 'Complete', value: data.ticketsByStatus.complete, color: 'bg-emerald-500' },
                                    ]}
                                />
                            )}
                        </div>
                    </div>

                    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-5 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[var(--text)]">Organization Capacity Watch</h2>
                            <Link to="/super-admin/organizations" className="text-sm text-[var(--brand-accent)] hover:underline">View all</Link>
                        </div>
                        {sortedOrgs.length === 0 ? (
                            <p className="text-sm text-[var(--muted)]">No organizations yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {sortedOrgs.map((o) => {
                                    const attention = needsAttention(o);
                                    const inactiveUsers = o.userCount - o.activeUserCount;
                                    const storageUsedGb = o.storageUsedBytes / 1024 ** 3;
                                    const storageLimitBytes = o.storageLimitGb * 1024 ** 3;
                                    return (
                                        <div
                                            key={o.id}
                                            className={`rounded-lg border p-4 ${attention ? 'border-amber-500/40 bg-amber-500/5' : 'border-[var(--border)]'}`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Link to={`/super-admin/organizations/${o.id}/edit`} className="font-medium text-[var(--text)] hover:text-[var(--brand-accent)] truncate">
                                                        {o.name}
                                                    </Link>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${planBadge(o.plan)}`}>{PLAN_LABELS[o.plan] || o.plan}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${o.isActive ? 'pill-green' : 'pill-red'}`}>{o.isActive ? 'Active' : 'Suspended'}</span>
                                                    {attention && <span className="text-xs px-2 py-0.5 rounded-full pill-amber">Needs attention</span>}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                                                    {o.criticalTickets > 0 && <span className="px-2 py-0.5 rounded-full pill-red">{o.criticalTickets} critical</span>}
                                                    {o.openTickets > 0 && <span className="px-2 py-0.5 rounded-full pill-blue">{o.openTickets} open ticket{o.openTickets === 1 ? '' : 's'}</span>}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <ProgressBar label="Users" value={o.userCount} max={o.maxUsers} />
                                                <ProgressBar label="Clients" value={o.clientCount} max={o.maxClients} />
                                                <ProgressBar
                                                    label="Storage"
                                                    value={Math.round(storageUsedGb * 10) / 10}
                                                    max={o.storageLimitGb}
                                                    formatValue={(n) => `${n} GB`}
                                                />
                                            </div>
                                            <p className="text-xs text-[var(--muted)] mt-2">
                                                {o.activeUserCount} active user{o.activeUserCount === 1 ? '' : 's'}
                                                {inactiveUsers > 0 && `, ${inactiveUsers} inactive`}
                                                {' · '}
                                                <span className={usageTextColor(storageLimitBytes > 0 ? (o.storageUsedBytes / storageLimitBytes) * 100 : 0)}>
                                                    {formatBytes(o.storageUsedBytes)} used
                                                </span>
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-5">
                            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Recent Signups</h2>
                            {data && data.recentSignups.length > 0 ? (
                                <ul className="divide-y divide-[var(--border)]">
                                    {data.recentSignups.map((u) => (
                                        <li key={u.id} className="py-3 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-[var(--text)] truncate">{u.firstName} {u.lastName}</p>
                                                <p className="text-xs text-[var(--muted)] truncate">{u.email} · {u.organizationName || 'No organisation'}</p>
                                            </div>
                                            <span className="text-xs text-[var(--faint)] flex-shrink-0">{new Date(u.createdAt).toLocaleDateString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-[var(--muted)]">No signups yet.</p>
                            )}
                        </div>

                        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-5">
                            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Quick Links</h2>
                            <div className="space-y-2">
                                {QUICK_LINKS.map((l) => (
                                    <Link
                                        key={l.to}
                                        to={l.to}
                                        className="flex items-center gap-3 p-3 rounded-md hover:bg-[var(--overlay-weak)] transition-colors"
                                    >
                                        <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)' }}>
                                            <i className={`fa-solid ${l.icon}`} style={{ color: 'var(--brand-accent)' }} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[var(--text)]">{l.label}</p>
                                            <p className="text-xs text-[var(--muted)] truncate">{l.desc}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
