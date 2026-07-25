import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import OverviewPanel from '../components/dashboard/OverviewPanel';
import AnalyticsPanel from '../components/dashboard/AnalyticsPanel';

type Tab = 'overview' | 'analytics';

const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'fa-house' },
    { key: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
];

export default function Dashboard() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [tab, setTab] = useState<Tab>('overview');
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const direction = tab === 'overview' ? -1 : 1;

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
                    {/* Header */}
                    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                        <div>
                            <h1 className="font-['Grifter'] text-3xl font-bold">Welcome back, {user?.firstName || 'there'}</h1>
                            <p className="text-sm text-[var(--muted)] mt-1">Here's what's happening across your practice today.</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 rounded-xl p-1 bg-[var(--surface)] border border-[var(--border)]">
                            {TABS.map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                                    style={tab === t.key ? { background: 'var(--brand)', color: '#fff' } : { color: 'var(--muted)' }}
                                >
                                    <i className={`fa-solid ${t.icon}`} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sliding panels */}
                    <div className="overflow-hidden">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={tab}
                                custom={direction}
                                initial={{ opacity: 0, x: direction * 60 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -60 }}
                                transition={{ duration: 0.35, ease: 'easeInOut' }}
                            >
                                {tab === 'overview' ? <OverviewPanel /> : <AnalyticsPanel />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}
