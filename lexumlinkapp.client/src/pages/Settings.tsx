import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import api from '../services/api';

interface Ticket {
    id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export default function Settings() {
    const { user, activeOrganization } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [ticketTitle, setTicketTitle] = useState('');
    const [ticketDescription, setTicketDescription] = useState('');
    const [ticketType, setTicketType] = useState<'bug' | 'feature'>('bug');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [myTickets, setMyTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);

    useEffect(() => {
        fetchMyTickets();
    }, []);

    const fetchMyTickets = async () => {
        setLoadingTickets(true);
        try {
            const res = await api.get('/tickets');
            setMyTickets(res.data);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
        } finally {
            setLoadingTickets(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketTitle.trim()) {
            setMessage('Please enter a title');
            return;
        }
        setSubmitting(true);
        setMessage('');
        try {
            await api.post('/tickets', {
                title: ticketTitle,
                description: ticketDescription,
                type: ticketType,
            });
            setMessage('Ticket submitted successfully. Thank you!');
            setTicketTitle('');
            setTicketDescription('');
            fetchMyTickets();
        } catch (err) {
            console.error(err);
            setMessage('Failed to submit ticket. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            new: 'pill-blue',
            active: 'pill-amber',
            critical: 'pill-red',
            complete: 'pill-green',
        };
        return colors[status] || 'pill-neutral';
    };

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
                        className="w-full max-w-4xl mx-auto"
                    >
                        <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Settings</h1>

                        {/* Profile Section */}
                        <div className="bg-[var(--surface)] rounded-lg shadow p-6 mb-6">
                            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Profile Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--muted)]">First Name</label>
                                    <p className="mt-1 text-[var(--text)]">{user?.firstName}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--muted)]">Last Name</label>
                                    <p className="mt-1 text-[var(--text)]">{user?.lastName}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--muted)]">Email</label>
                                    <p className="mt-1 text-[var(--text)]">{user?.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--muted)]">Organization</label>
                                    <p className="mt-1 text-[var(--text)]">{activeOrganization?.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* My Tickets Section */}
                        <div className="bg-[var(--surface)] rounded-lg shadow p-6 mb-6">
                            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">My Tickets</h2>
                            {loadingTickets ? (
                                <p className="text-[var(--muted)]">Loading tickets...</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[var(--border)]">
                                        <thead className="bg-[var(--overlay-weak)]">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Title</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {myTickets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-3 text-center text-[var(--muted)]">
                                                        No tickets submitted yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                myTickets.map(ticket => (
                                                    <tr key={ticket.id}>
                                                        <td className="px-4 py-3 text-sm text-[var(--text)]">{ticket.title}</td>
                                                        <td className="px-4 py-3 text-sm capitalize">{ticket.type}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(ticket.status)}`}>
                                                                {ticket.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-[var(--muted)]">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Submit Ticket Section */}
                        <div className="bg-[var(--surface)] rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Report a Bug or Request a Feature</h2>
                            {message && (
                                <div className={`mb-4 p-3 rounded-md ${message.includes('success') ? 'pill-green' : 'pill-red'}`}>
                                    {message}
                                </div>
                            )}
                            <form onSubmit={handleSubmitTicket}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Type</label>
                                    <div className="flex gap-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                value="bug"
                                                checked={ticketType === 'bug'}
                                                onChange={() => setTicketType('bug')}
                                                className="mr-2"
                                            />
                                            Bug Report
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                value="feature"
                                                checked={ticketType === 'feature'}
                                                onChange={() => setTicketType('feature')}
                                                className="mr-2"
                                            />
                                            Feature Request
                                        </label>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="title" className="block text-sm font-medium text-[var(--muted)] mb-1">Title *</label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={ticketTitle}
                                        onChange={(e) => setTicketTitle(e.target.value)}
                                        className="w-full px-3 py-2 bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded-md focus:outline-none focus:ring-[var(--brand-ring)] focus:border-[var(--brand-accent)]"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="description" className="block text-sm font-medium text-[var(--muted)] mb-1">Description</label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        value={ticketDescription}
                                        onChange={(e) => setTicketDescription(e.target.value)}
                                        className="w-full px-3 py-2 bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded-md focus:outline-none focus:ring-[var(--brand-ring)] focus:border-[var(--brand-accent)]"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-md disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}