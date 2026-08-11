import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import HelpButton from '../components/HelpButton';
import OverviewPanel from '../components/dashboard/OverviewPanel';
import AnalyticsPanel from '../components/dashboard/AnalyticsPanel';

type Tab = 'overview' | 'analytics';

const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'fa-house' },
    { key: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
];

export default function Dashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState<Tab>('overview');

    const direction = tab === 'overview' ? -1 : 1;

    return (
        <>
            <HelpButton
                title="Dashboard"
                description="Your home base. The Overview tab shows what's happening today; the Analytics tab shows longer-term trends."
                steps={[
                    'Switch between Overview and Analytics using the tabs at the top.',
                    'Use Quick Actions to jump straight into adding a client, case, document, or appointment.',
                    'The My Clients, My Active Cases, and Today\'s Workload cards can be searched, sorted, and filtered.',
                    'Check Company Health on the Analytics tab for a quick read on how the practice is tracking.',
                ]}
            />

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
        </>
    );
}
