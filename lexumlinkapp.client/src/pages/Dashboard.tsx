import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { motion } from 'framer-motion';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Sidebar from '../components/Sidebar';
import TodoList from '../components/TodoList';
import { Donut, BarChart } from '../components/charts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Summary {
    newClientsThisWeek: number;
    overdueTasks: number;
    casesNearingDeadline: number;
    clientsAwaitingDocuments: number;
    avgCompletionDays: number;
    openCases: number;
    totalCases: number;
    totalClients: number;
}
interface NameValue { name: string; value: number; }
interface MonthPoint { month: string; clients: number; cases: number; }
interface TeamMember { name: string; clients: number; tasksCompleted: number; casesClosed: number; }
interface Deadline { caseNumber: string; clientName: string; deadline: string; daysLeft: number; }
interface OverdueTask { title: string; dueDate: string; daysOverdue: number; }
interface AnalyticsData {
    summary: Summary;
    casesByStatus: NameValue[];
    claimsByStatus: NameValue[];
    documentsStatus: NameValue[];
    monthlyGrowth: MonthPoint[];
    teamPerformance: TeamMember[];
    upcomingDeadlines: Deadline[];
    overdueTaskList: OverdueTask[];
}

// ─── Palette for chart segments (readable in both themes) ─────────────────────

const SEG_COLORS = ['#C9A24B', '#C1626A', '#7A0008', '#C1121F', '#8E7E69', '#D9B892'];

// ─── Small presentational helpers ─────────────────────────────────────────────

function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-xl p-6 bg-[var(--surface)] border border-[var(--border)] ${className}`}>
            {title && <h3 className="text-sm font-semibold uppercase tracking-wider mb-5 text-[var(--muted)]">{title}</h3>}
            {children}
        </div>
    );
}

function Kpi({ icon, label, value, accent }: { icon: string; label: string; value: React.ReactNode; accent: string }) {
    return (
        <div className="rounded-xl p-5 bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-border)', color: accent }}>
                <i className={icon} />
            </div>
            <div className="min-w-0">
                <div className="font-['Grifter'] text-2xl font-bold leading-none text-[var(--text)]">{value}</div>
                <div className="text-xs mt-1 text-[var(--muted)] truncate">{label}</div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { activeOrganization } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activeOrganization) fetchAnalytics();
    }, [activeOrganization]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/analytics/dashboard');
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
            setError('Unable to load dashboard analytics. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full">
                        <div className="mb-6">
                            <h1 className="font-['Grifter'] text-3xl font-bold text-[var(--text)]">Dashboard</h1>
                            <p className="text-sm text-[var(--muted)] mt-1">Live view of your clients, cases, and office performance.</p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64"><Spinner size={50} /></div>
                        ) : error ? (
                            <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-4 rounded-lg">{error}</div>
                        ) : data ? (
                            <>
                                {/* KPI row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                                    <Kpi icon="fa-solid fa-user-plus" label="New clients this week" value={data.summary.newClientsThisWeek} accent="var(--brand-accent)" />
                                    <Kpi icon="fa-solid fa-hourglass-half" label="Cases nearing deadline" value={data.summary.casesNearingDeadline} accent="#C9A24B" />
                                    <Kpi icon="fa-solid fa-triangle-exclamation" label="Overdue tasks" value={data.summary.overdueTasks} accent="#C1121F" />
                                    <Kpi icon="fa-solid fa-file-circle-exclamation" label="Clients awaiting docs" value={data.summary.clientsAwaitingDocuments} accent="#C1626A" />
                                    <Kpi icon="fa-solid fa-stopwatch" label="Avg completion (days)" value={data.summary.avgCompletionDays} accent="var(--brand-accent)" />
                                    <Kpi icon="fa-solid fa-folder-open" label="Open cases" value={data.summary.openCases} accent="#C9A24B" />
                                </div>

                                {/* Growth + team bars */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <Card title="Monthly Growth">
                                        <BarChart
                                            data={data.monthlyGrowth.map((m) => ({ label: m.month, values: [m.clients, m.cases] }))}
                                            series={[{ name: 'Clients', color: 'var(--brand-accent)' }, { name: 'Cases', color: '#C9A24B' }]}
                                        />
                                    </Card>
                                    <Card title="Team Performance">
                                        {data.teamPerformance.length > 0 ? (
                                            <BarChart
                                                data={data.teamPerformance.map((t) => ({ label: t.name.split(' ')[0] || t.name, values: [t.clients, t.tasksCompleted, t.casesClosed] }))}
                                                series={[{ name: 'Clients', color: 'var(--brand-accent)' }, { name: 'Tasks done', color: '#C9A24B' }, { name: 'Cases closed', color: '#C1626A' }]}
                                            />
                                        ) : (
                                            <div className="text-center text-sm text-[var(--muted)] py-12">No team activity yet.</div>
                                        )}
                                    </Card>
                                </div>

                                {/* Donuts */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <Card title="Cases Status">
                                        <Donut
                                            segments={data.casesByStatus.map((s, i) => ({ label: s.name, value: s.value, color: SEG_COLORS[i % SEG_COLORS.length] }))}
                                            centerValue={data.summary.totalCases}
                                            centerLabel="Total cases"
                                        />
                                    </Card>
                                    <Card title="Claims Status">
                                        <Donut
                                            segments={data.claimsByStatus.map((s, i) => ({ label: s.name, value: s.value, color: SEG_COLORS[i % SEG_COLORS.length] }))}
                                            centerValue={data.claimsByStatus.reduce((a, b) => a + b.value, 0)}
                                            centerLabel="Total claims"
                                        />
                                    </Card>
                                    <Card title="Document Readiness">
                                        <Donut
                                            segments={data.documentsStatus.map((s) => ({ label: s.name, value: s.value, color: s.name === 'Complete' ? 'var(--brand-accent)' : '#C1121F' }))}
                                            centerValue={data.summary.openCases}
                                            centerLabel="Open cases"
                                        />
                                    </Card>
                                </div>

                                {/* Lists */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <Card title="Upcoming Deadlines">
                                        {data.upcomingDeadlines.length > 0 ? (
                                            <ul className="divide-y divide-[var(--border)]">
                                                {data.upcomingDeadlines.map((d, i) => (
                                                    <li key={i} className="flex items-center justify-between py-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-[var(--text)] truncate">{d.caseNumber}</div>
                                                            <div className="text-xs text-[var(--muted)] truncate">{d.clientName}</div>
                                                        </div>
                                                        <span
                                                            className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                                                            style={{
                                                                background: d.daysLeft < 0 ? 'rgba(193,18,31,0.15)' : d.daysLeft <= 7 ? 'rgba(201,162,75,0.18)' : 'var(--brand-soft)',
                                                                color: d.daysLeft < 0 ? '#e88' : d.daysLeft <= 7 ? '#C9A24B' : 'var(--brand-accent)',
                                                            }}
                                                        >
                                                            {d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d left`}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="text-center text-sm text-[var(--muted)] py-10">No upcoming deadlines.</div>
                                        )}
                                    </Card>

                                    <Card title="Overdue Tasks">
                                        {data.overdueTaskList.length > 0 ? (
                                            <ul className="divide-y divide-[var(--border)]">
                                                {data.overdueTaskList.map((t, i) => (
                                                    <li key={i} className="flex items-center justify-between py-3">
                                                        <div className="text-sm text-[var(--text)] truncate pr-3">{t.title}</div>
                                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: 'rgba(193,18,31,0.15)', color: '#e88' }}>
                                                            {t.daysOverdue}d overdue
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="text-center text-sm text-[var(--muted)] py-10"><i className="fa-solid fa-circle-check mr-2" style={{ color: '#7BbF6A' }} />Nothing overdue right now.</div>
                                        )}
                                    </Card>
                                </div>

                                <TodoList />
                            </>
                        ) : null}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
