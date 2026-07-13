import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

interface Ticket {
    id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    user: { firstName: string; lastName: string; email: string } | null;
    organization: { name: string };
}

export default function SuperAdminTickets() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/tickets/admin');
            setTickets(res.data);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            await api.put(`/tickets/${id}/status`, { status: newStatus });
            await fetchTickets(); // refresh
        } catch (err) {
            console.error('Failed to update status', err);
            alert('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            new: 'bg-blue-500/15 text-blue-300',
            active: 'bg-yellow-500/15 text-yellow-300',
            critical: 'bg-red-500/15 text-red-300',
            complete: 'bg-green-500/15 text-green-300',
        };
        return colors[status] || 'bg-white/5 text-[#F3F2FA]';
    };

    if (!user?.isSuperAdmin) {
        return <div className="p-6 text-red-300">Access denied. Super admin only.</div>;
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
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl font-bold text-[#F3F2FA] mb-6">Ticket Management</h1>

                        {loading ? (
                            <div className="text-center py-10">Loading tickets...</div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center text-[#9E9CB8] py-10">No tickets submitted yet.</div>
                        ) : (
                            <div className="bg-[#12111F] rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase">Title</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase">Submitted By</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase">Organization</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9CB8] uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {tickets.map(ticket => (
                                            <tr key={ticket.id}>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-[#F3F2FA]">{ticket.title}</div>
                                                    {ticket.description && <div className="text-sm text-[#9E9CB8] mt-1">{ticket.description}</div>}
                                                </td>
                                                <td className="px-6 py-4 capitalize">{ticket.type}</td>
                                                <td className="px-6 py-4">
                                                    {ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : 'Unknown'}
                                                    <div className="text-xs text-[#9E9CB8]">{ticket.user?.email}</div>
                                                </td>
                                                <td className="px-6 py-4">{ticket.organization.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(ticket.status)}`}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={ticket.status}
                                                        onChange={(e) => updateStatus(ticket.id, e.target.value)}
                                                        disabled={updatingId === ticket.id}
                                                        className="bg-white/5 border border-white/10 text-[#F3F2FA] rounded px-2 py-1 text-sm"
                                                    >
                                                        <option value="new">New</option>
                                                        <option value="active">Active</option>
                                                        <option value="critical">Critical</option>
                                                        <option value="complete">Complete</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}