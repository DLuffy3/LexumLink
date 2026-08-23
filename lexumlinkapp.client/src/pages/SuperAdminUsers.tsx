import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

interface AdminUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isSuperAdmin: boolean;
    isActive: boolean;
    isLocked: boolean;
    createdAt: string;
    organizationId: string | null;
    organizationName: string | null;
}

export default function SuperAdminUsers() {
    const { user } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user?.isSuperAdmin) {
        return <div className="p-6 text-red-300">Access denied. Super admin only.</div>;
    }

    const filtered = users.filter((u) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return `${u.firstName} ${u.lastName} ${u.email} ${u.organizationName || ''}`.toLowerCase().includes(q);
    });

    return (
        <>
            <HelpButton
                title="Users"
                description="Every user across every organisation on the platform."
                steps={[
                    'Search by name, email or organisation using the search box.',
                    'Click a user to edit their details, organisation, super admin status or active status.',
                    'Use "Add User" to create a new user in a new or existing organisation.',
                ]}
            />
            <main className="p-6 pt-16">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <h1 className="text-2xl font-bold text-[var(--text)]">Users</h1>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded px-3 py-2 text-sm"
                            />
                            <Link
                                to="/admin/users/new"
                                className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                            >
                                + Add User
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <Spinner />
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-[var(--muted)] py-10">No users found.</div>
                    ) : (
                        <div className="bg-[var(--surface)] rounded-lg shadow overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--border)]">
                                <thead className="bg-[var(--overlay-weak)]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Organization</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Joined</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {filtered.map((u) => (
                                        <tr key={u.id}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-[var(--text)]">{u.firstName} {u.lastName}</div>
                                                <div className="text-xs text-[var(--muted)]">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--text)]">{u.organizationName || '—'}</td>
                                            <td className="px-6 py-4">
                                                {u.isSuperAdmin ? (
                                                    <span className="pill-blue text-xs px-2 py-0.5 rounded-full">Super Admin</span>
                                                ) : (
                                                    <span className="pill-neutral text-xs px-2 py-0.5 rounded-full">User</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {!u.isActive ? (
                                                    <span className="pill-red text-xs px-2 py-0.5 rounded-full">Deactivated</span>
                                                ) : u.isLocked ? (
                                                    <span className="pill-amber text-xs px-2 py-0.5 rounded-full">Locked</span>
                                                ) : (
                                                    <span className="pill-green text-xs px-2 py-0.5 rounded-full">Active</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--muted)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <Link to={`/super-admin/users/${u.id}/edit`} className="text-[var(--brand-accent)] hover:underline text-sm font-medium">
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
