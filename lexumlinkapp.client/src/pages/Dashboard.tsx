import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell } from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Sidebar from '../components/Sidebar';
import TodoList from '../components/TodoList';

// On-theme donut gradients, keyed by claim status so colours stay stable
const SLICE_GRADIENTS: Record<string, [string, string]> = {
    'Completed': ['#A78BFA', '#7C6CF5'],
    'In Progress': ['#8B7CF6', '#6D5EF5'],
    'Critical': ['#F472B6', '#DB2777'],
};
const FALLBACK_GRADIENT: [string, string] = ['#8B7CF6', '#6D5EF5'];
const gradId = (name: string) => `grad-${name.replace(/\s+/g, '')}`;

interface Case {
    id: string;
    status: string;
}

interface Claim {
    id: string;
    status: string;
}

interface Stats {
    activeCases: number;
    pendingDocs: number;
    rafClaims: number;
    claimsByStatus: {
        completed: number;
        inProgress: number;
        critical: number;
    };
}

export default function Dashboard() {
    const { activeOrganization } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [stats, setStats] = useState<Stats>({
        activeCases: 0,
        pendingDocs: 0,
        rafClaims: 0,
        claimsByStatus: { completed: 0, inProgress: 0, critical: 0 },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activeOrganization) fetchDashboardData();
    }, [activeOrganization]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch cases
            let cases: Case[] = [];
            try {
                const casesRes = await api.get('/cases');
                cases = casesRes.data;
            } catch (err) {
                console.warn('Failed to fetch cases', err);
            }
            const activeCasesCount = cases.filter(c => c.status !== 'closed').length;

            // Fetch claims
            let claims: Claim[] = [];
            try {
                const claimsRes = await api.get('/claims');
                claims = claimsRes.data;
            } catch (err) {
                console.warn('Failed to fetch claims', err);
            }
            const rafClaimsCount = claims.length;
            const claimsByStatus = {
                completed: claims.filter(c => c.status === 'completed').length,
                inProgress: claims.filter(c => c.status === 'in_progress').length,
                critical: claims.filter(c => c.status === 'critical').length,
            };

            // For pending documents, we might not have an endpoint. Set to 0 or fetch if available.
            let pendingDocsCount = 0;
            try {
                const docsRes = await api.get('/documents');
                // If documents have a status field, filter. Otherwise, count all.
                pendingDocsCount = docsRes.data.length;
            } catch (err) {
                console.warn('Failed to fetch documents', err);
            }

            setStats({
                activeCases: activeCasesCount,
                pendingDocs: pendingDocsCount,
                rafClaims: rafClaimsCount,
                claimsByStatus,
            });
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
            setError('Unable to load dashboard data. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const pieData = [
        { name: 'Completed', value: stats.claimsByStatus.completed },
        { name: 'In Progress', value: stats.claimsByStatus.inProgress },
        { name: 'Critical', value: stats.claimsByStatus.critical },
    ].filter(item => item.value > 0);

    const totalClaims = pieData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                <div className="fixed top-4 left-4 z-30">
                    <button onClick={toggleSidebar} className="p-2 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] focus:outline-none">
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
                        className="w-full"
                    >
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spinner size={50} />
                            </div>
                        ) : error ? (
                            <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-4 rounded">{error}</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-[var(--surface)] rounded-lg shadow p-6 border-l-4 border-[#8B7CF6] hover:shadow-md transition-all">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-[#8B7CF6]/15 rounded-full">
                                                <svg className="w-6 h-6 text-[var(--brand-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-[var(--muted)]">Active Cases</p>
                                                <p className="text-2xl font-bold text-[var(--text)]">{stats.activeCases}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[var(--surface)] rounded-lg shadow p-6 border-l-4 border-yellow-400 hover:shadow-md transition-all">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-yellow-500/15 rounded-full">
                                                <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-[var(--muted)]">Total Documents</p>
                                                <p className="text-2xl font-bold text-[var(--text)]">{stats.pendingDocs}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[var(--surface)] rounded-lg shadow p-6 border-l-4 border-blue-400 hover:shadow-md transition-all">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-blue-500/15 rounded-full">
                                                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-[var(--muted)]">RAF Claims</p>
                                                <p className="text-2xl font-bold text-[var(--text)]">{stats.rafClaims}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                    <div className="bg-[var(--surface)] rounded-lg shadow p-6">
                                        <h3 className="text-lg font-medium text-[var(--text)] mb-4">Claims Status</h3>
                                        {pieData.length > 0 ? (
                                            <div className="flex flex-col items-center w-full py-2">
                                                <div className="relative" style={{ width: 280, height: 240 }}>
                                                    {/* @ts-expect-error - recharts types incompatible with React 19 */}
                                                    <PieChart width={280} height={240}>
                                                        <defs>
                                                            {pieData.map((entry) => {
                                                                const [from, to] = SLICE_GRADIENTS[entry.name] ?? FALLBACK_GRADIENT;
                                                                return (
                                                                    <linearGradient key={entry.name} id={gradId(entry.name)} x1="0" y1="0" x2="1" y2="1">
                                                                        <stop offset="0%" stopColor={from} />
                                                                        <stop offset="100%" stopColor={to} />
                                                                    </linearGradient>
                                                                );
                                                            })}
                                                        </defs>
                                                        {/* @ts-expect-error - recharts types incompatible with React 19 */}
                                                        <Pie
                                                            data={pieData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={68}
                                                            outerRadius={100}
                                                            paddingAngle={4}
                                                            cornerRadius={8}
                                                            stroke="none"
                                                            dataKey="value"
                                                        >
                                                            {pieData.map((entry) => (
                                                                /* @ts-expect-error - recharts types incompatible with React 19 */
                                                                <Cell key={`cell-${entry.name}`} fill={`url(#${gradId(entry.name)})`} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                        <span className="font-['Grifter'] text-4xl font-bold text-[var(--text)] leading-none">{totalClaims}</span>
                                                        <span className="text-xs tracking-wide text-[var(--muted)] mt-1">Total Claims</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-5">
                                                    {pieData.map((entry) => {
                                                        const [from, to] = SLICE_GRADIENTS[entry.name] ?? FALLBACK_GRADIENT;
                                                        return (
                                                            <div key={entry.name} className="flex items-center gap-2">
                                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
                                                                <span className="text-sm text-[var(--muted)]">{entry.name}</span>
                                                                <span className="text-sm font-semibold text-[var(--text)]">{entry.value}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-[var(--muted)]">No claim data available</div>
                                        )}
                                    </div>

                                    <div className="bg-[var(--surface)] rounded-lg shadow p-6">
                                        <h3 className="text-lg font-medium text-[var(--text)] mb-4">Calendar</h3>
                                        <Calendar
                                            onChange={(value) => setSelectedDate(value as Date)}
                                            value={selectedDate}
                                            className="rounded-md border-0"
                                        />
                                        <div className="mt-4">
                                            <h4 className="font-medium text-[var(--muted)]">Upcoming / Scheduled</h4>
                                            <p className="text-sm text-[var(--muted)]">No upcoming tasks</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    <TodoList />
                                </div>
                            </>
                        )}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}