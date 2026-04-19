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
            new: 'bg-blue-100 text-blue-800',
            active: 'bg-yellow-100 text-yellow-800',
            critical: 'bg-red-100 text-red-800',
            complete: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (!user?.isSuperAdmin) {
        return <div className="p-6 text-red-600">Access denied. Super admin only.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                <div className="fixed top-4 left-4 z-30">
                    <button onClick={toggleSidebar} className="p-2 rounded-md bg-white shadow-md">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                <main className="p-6 pt-16">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">Ticket Management</h1>

                        {loading ? (
                            <div className="text-center py-10">Loading tickets...</div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">No tickets submitted yet.</div>
                        ) : (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {tickets.map(ticket => (
                                            <tr key={ticket.id}>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{ticket.title}</div>
                                                    {ticket.description && <div className="text-sm text-gray-500 mt-1">{ticket.description}</div>}
                                                </td>
                                                <td className="px-6 py-4 capitalize">{ticket.type}</td>
                                                <td className="px-6 py-4">
                                                    {ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : 'Unknown'}
                                                    <div className="text-xs text-gray-500">{ticket.user?.email}</div>
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
                                                        className="border rounded px-2 py-1 text-sm"
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