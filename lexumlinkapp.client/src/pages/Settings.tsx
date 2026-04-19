import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function Settings() {
    const { user, activeOrganization } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [ticketTitle, setTicketTitle] = useState('');
    const [ticketDescription, setTicketDescription] = useState('');
    const [ticketType, setTicketType] = useState<'bug' | 'feature'>('bug');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

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
        } catch (err) {
            console.error(err);
            setMessage('Failed to submit ticket. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Main content */}
            <div>
                {/* Top toggle button */}
                <div className="fixed top-4 left-4 z-30">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-md bg-white shadow-md text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
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
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

                        {/* Profile Section */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    <p className="mt-1 text-gray-900">{user?.firstName}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <p className="mt-1 text-gray-900">{user?.lastName}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="mt-1 text-gray-900">{user?.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Organization</label>
                                    <p className="mt-1 text-gray-900">{activeOrganization?.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Organization Section */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Organization Settings</h2>
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Role:</span> {activeOrganization?.role || 'Member'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Organization ID:</span> {activeOrganization?.id}
                                </p>
                                <button
                                    onClick={() => alert('Coming soon: Invite team members')}
                                    className="mt-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                                >
                                    Invite Team Members
                                </button>
                            </div>
                        </div>

                        {/* Support / Ticket Section */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Report a Bug or Request a Feature</h2>
                            {message && (
                                <div className={`mb-4 p-3 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {message}
                                </div>
                            )}
                            <form onSubmit={handleSubmitTicket}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
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
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={ticketTitle}
                                        onChange={(e) => setTicketTitle(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        value={ticketDescription}
                                        onChange={(e) => setTicketDescription(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800 disabled:opacity-50"
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