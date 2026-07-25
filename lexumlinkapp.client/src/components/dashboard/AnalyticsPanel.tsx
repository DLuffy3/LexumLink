import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import Spinner from '../Spinner';
import TodoList from '../TodoList';
import { Donut, BarChart, Radar } from '../charts';

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
interface HealthFactor { label: string; score: number; }
interface CompanyHealth { overall: number; factors: HealthFactor[]; }
interface AnalyticsData {
    summary: Summary;
    casesByStatus: NameValue[];
    claimsByStatus: NameValue[];
    documentsStatus: NameValue[];
    companyHealth: CompanyHealth;
    monthlyGrowth: MonthPoint[];
    teamPerformance: TeamMember[];
    upcomingDeadlines: Deadline[];
    overdueTaskList: OverdueTask[];
}

const SEG_COLORS = ['#C9A24B', '#C1626A', '#7A0008', '#C1121F', '#8E7E69', '#D9B892'];

// ── Company health helpers ──
const FACTOR_FULL: Record<string, string> = {
    Overdue: 'Overdue tasks',
    Deadlines: 'Cases approaching deadlines',
    Documents: 'Missing documents',
    Workload: 'Team workload',
    Completed: 'Completed tasks',
};
const healthColor = (s: number) => (s >= 75 ? '#2E8B6F' : s >= 50 ? '#C9A24B' : '#C1121F');
const healthPill = (s: number) => (s >= 75 ? 'pill-green' : s >= 50 ? 'pill-amber' : 'pill-red');
const healthLabel = (s: number) => (s >= 75 ? 'Healthy' : s >= 50 ? 'Needs attention' : 'At risk');

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl p-6 bg-[var(--surface)] border border-[var(--border)]">
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

export default function AnalyticsPanel() {
    const { activeOrganization } = useAuth();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!activeOrganization) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await api.get('/analytics/dashboard');
                if (!cancelled) setData(res.data);
            } catch (err) {
                console.error('Failed to fetch analytics', err);
                if (!cancelled) setError('Unable to load dashboard analytics. Please refresh.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [activeOrganization]);

    if (loading) return <div className="flex justify-center items-center h-64"><Spinner size={50} /></div>;
    if (error) return <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-4 rounded-lg">{error}</div>;
    if (!data) return null;

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                <Kpi icon="fa-solid fa-user-plus" label="New clients this week" value={data.summary.newClientsThisWeek} accent="var(--brand-accent)" />
                <Kpi icon="fa-solid fa-hourglass-half" label="Cases nearing deadline" value={data.summary.casesNearingDeadline} accent="#C9A24B" />
                <Kpi icon="fa-solid fa-triangle-exclamation" label="Overdue tasks" value={data.summary.overdueTasks} accent="#C1121F" />
                <Kpi icon="fa-solid fa-file-circle-exclamation" label="Clients awaiting docs" value={data.summary.clientsAwaitingDocuments} accent="#C1626A" />
                <Kpi icon="fa-solid fa-stopwatch" label="Avg completion (days)" value={data.summary.avgCompletionDays} accent="var(--brand-accent)" />
                <Kpi icon="fa-solid fa-folder-open" label="Open cases" value={data.summary.openCases} accent="#C9A24B" />
            </div>

            {/* Company Health */}
            <div className="rounded-xl p-6 bg-[var(--surface)] border border-[var(--border)] mb-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Company Health</h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${healthPill(data.companyHealth.overall)}`}>
                        {data.companyHealth.overall}/100 · {healthLabel(data.companyHealth.overall)}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="relative">
                        <Radar axes={data.companyHealth.factors.map((f) => ({ label: f.label, value: f.score }))} size={260} />
                    </div>
                    <ul className="space-y-4">
                        {data.companyHealth.factors.map((f) => (
                            <li key={f.label}>
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-[var(--muted)]">{FACTOR_FULL[f.label] || f.label}</span>
                                    <span className="font-semibold text-[var(--text)]">{f.score}</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--overlay-med)' }}>
                                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${f.score}%`, background: healthColor(f.score) }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card title="Cases Status">
                    <Donut segments={data.casesByStatus.map((s, i) => ({ label: s.name, value: s.value, color: SEG_COLORS[i % SEG_COLORS.length] }))} centerValue={data.summary.totalCases} centerLabel="Total cases" />
                </Card>
                <Card title="Claims Status">
                    <Donut segments={data.claimsByStatus.map((s, i) => ({ label: s.name, value: s.value, color: SEG_COLORS[i % SEG_COLORS.length] }))} centerValue={data.claimsByStatus.reduce((a, b) => a + b.value, 0)} centerLabel="Total claims" />
                </Card>
                <Card title="Document Readiness">
                    <Donut segments={data.documentsStatus.map((s) => ({ label: s.name, value: s.value, color: s.name === 'Complete' ? 'var(--brand-accent)' : '#C1121F' }))} centerValue={data.summary.openCases} centerLabel="Open cases" />
                </Card>
            </div>

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
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${d.daysLeft < 0 ? 'pill-red' : d.daysLeft <= 7 ? 'pill-amber' : 'pill-brand'}`}>
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
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 pill-red">{t.daysOverdue}d overdue</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-sm text-[var(--muted)] py-10"><i className="fa-solid fa-circle-check mr-2" style={{ color: '#7BBF6A' }} />Nothing overdue right now.</div>
                    )}
                </Card>
            </div>

            <TodoList />
        </>
    );
}
