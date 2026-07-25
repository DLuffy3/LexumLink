import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../Spinner';
import { LineChart, type LinePoint } from '../charts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ClientRow { id: string; firstName?: string; lastName?: string; email?: string; phone?: string; createdAt: string; }
interface CaseRow { id: string; caseNumber: string; clientName?: string; status: string; createdAt: string; }
interface TodoRow { id: string; title: string; dueDate: string | null; isCompleted: boolean; }
interface DocRow { id: string; fileName: string; documentType: string; uploadedAt: string; clientName?: string | null; }
interface EventRow { id: string; source: string; type: string; title: string; start: string; allDay: boolean; clientName: string | null; }

type Granularity = 'day' | 'week' | 'month' | 'year';

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTHS3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const initials = (a?: string, b?: string) => `${(a?.[0] || '').toUpperCase()}${(b?.[0] || '').toUpperCase()}` || '?';

function timeAgo(iso: string): string {
    const d = new Date(iso);
    const s = (Date.now() - d.getTime()) / 1000;
    if (s < 60) return 'just now';
    const m = s / 60; if (m < 60) return `${Math.floor(m)}m ago`;
    const h = m / 60; if (h < 24) return `${Math.floor(h)}h ago`;
    const days = h / 24; if (days < 7) return `${Math.floor(days)}d ago`;
    return d.toLocaleDateString();
}

const STATUS_BADGE: Record<string, string> = {
    open: 'pill-green',
    in_progress: 'pill-amber',
    critical: 'pill-red',
    completed: 'pill-green',
    closed: 'pill-neutral',
};
const badge = (s: string) => STATUS_BADGE[s] || 'pill-neutral';
const pretty = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : s);

const EVENT_TYPE_COLOR: Record<string, string> = {
    appointment: '#C9A24B', follow_up: '#4C86A8', court_date: '#A31515',
    medical_assessment: '#2E8B6F', task_deadline: '#8E7E69', case_deadline: '#C1121F',
};

function makeBuckets(gran: Granularity): { label: string; start: Date; end: Date }[] {
    const now = new Date();
    const out: { label: string; start: Date; end: Date }[] = [];
    if (gran === 'day') {
        for (let i = 13; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const end = new Date(start); end.setDate(start.getDate() + 1);
            out.push({ label: `${start.getDate()}/${start.getMonth() + 1}`, start, end });
        }
    } else if (gran === 'week') {
        for (let i = 11; i >= 0; i--) {
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7 * i + 1);
            const start = new Date(end); start.setDate(end.getDate() - 7);
            out.push({ label: `${start.getDate()}/${start.getMonth() + 1}`, start, end });
        }
    } else if (gran === 'month') {
        for (let i = 11; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            out.push({ label: MONTHS3[start.getMonth()], start, end });
        }
    } else {
        for (let i = 4; i >= 0; i--) {
            const start = new Date(now.getFullYear() - i, 0, 1);
            const end = new Date(now.getFullYear() - i + 1, 0, 1);
            out.push({ label: String(start.getFullYear()), start, end });
        }
    }
    return out;
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">{title}</h3>
                {action}
            </div>
            {children}
        </div>
    );
}

const selectCls = 'text-xs px-2 py-1.5 rounded-lg bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] outline-none';
const searchCls = 'text-xs px-3 py-1.5 rounded-lg bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] outline-none focus:border-[var(--brand-accent)] w-full';

// ─── Component ──────────────────────────────────────────────────────────────

export default function OverviewPanel() {
    const navigate = useNavigate();
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [cases, setCases] = useState<CaseRow[]>([]);
    const [todos, setTodos] = useState<TodoRow[]>([]);
    const [docs, setDocs] = useState<DocRow[]>([]);
    const [events, setEvents] = useState<EventRow[]>([]);
    const [loading, setLoading] = useState(true);

    // card controls
    const [clientSearch, setClientSearch] = useState('');
    const [clientSort, setClientSort] = useState('name');
    const [clientFilter, setClientFilter] = useState('all');
    const [caseSearch, setCaseSearch] = useState('');
    const [caseStatus, setCaseStatus] = useState('all');
    const [caseSort, setCaseSort] = useState('newest');
    const [workSearch, setWorkSearch] = useState('');
    const [workFilter, setWorkFilter] = useState('all');
    const [gran, setGran] = useState<Granularity>('month');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const end = new Date(start); end.setDate(start.getDate() + 60);
            const results = await Promise.allSettled([
                api.get('/clients'),
                api.get('/cases'),
                api.get('/todos'),
                api.get('/documents'),
                api.get('/events', { params: { start: start.toISOString(), end: end.toISOString() } }),
            ]);
            if (cancelled) return;
            const [c, cs, t, d, e] = results;
            if (c.status === 'fulfilled') setClients(c.value.data);
            if (cs.status === 'fulfilled') setCases(cs.value.data);
            if (t.status === 'fulfilled') setTodos(t.value.data);
            if (d.status === 'fulfilled') setDocs(d.value.data);
            if (e.status === 'fulfilled') setEvents(e.value.data);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, []);

    const todayKey = ymd(new Date());

    // ── My Clients (filtered/sorted/searched) ──
    const shownClients = useMemo(() => {
        const now = Date.now();
        let list = clients.filter((c) => `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase().includes(clientSearch.toLowerCase()));
        if (clientFilter === 'week') list = list.filter((c) => now - new Date(c.createdAt).getTime() <= 7 * 864e5);
        if (clientFilter === 'month') list = list.filter((c) => now - new Date(c.createdAt).getTime() <= 30 * 864e5);
        list = [...list].sort((a, b) => clientSort === 'newest'
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : `${a.lastName ?? ''}`.localeCompare(`${b.lastName ?? ''}`));
        return list;
    }, [clients, clientSearch, clientFilter, clientSort]);

    // ── My Active Cases ──
    const shownCases = useMemo(() => {
        let list = cases.filter((c) => c.status !== 'closed');
        if (caseStatus !== 'all') list = list.filter((c) => c.status === caseStatus);
        const q = caseSearch.toLowerCase();
        list = list.filter((c) => c.caseNumber.toLowerCase().includes(q) || (c.clientName ?? '').toLowerCase().includes(q));
        list = [...list].sort((a, b) => caseSort === 'status'
            ? a.status.localeCompare(b.status)
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
    }, [cases, caseSearch, caseStatus, caseSort]);

    // ── Today's Workload (tasks due today + today's events) ──
    const workload = useMemo(() => {
        const items: { id: string; kind: 'task' | 'event'; title: string; meta: string; color: string }[] = [];
        todos.filter((t) => !t.isCompleted && t.dueDate && ymd(new Date(t.dueDate)) === todayKey)
            .forEach((t) => items.push({ id: 't' + t.id, kind: 'task', title: t.title, meta: 'Task due today', color: '#8E7E69' }));
        events.filter((e) => ymd(new Date(e.start)) === todayKey)
            .forEach((e) => items.push({ id: 'e' + e.id, kind: 'event', title: e.title, meta: e.allDay ? 'All day' : new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: EVENT_TYPE_COLOR[e.type] || '#C9A24B' }));
        let list = items.filter((i) => i.title.toLowerCase().includes(workSearch.toLowerCase()));
        if (workFilter !== 'all') list = list.filter((i) => i.kind === workFilter);
        return list;
    }, [todos, events, workSearch, workFilter, todayKey]);

    // ── Case Trend ──
    const trend: LinePoint[] = useMemo(() => makeBuckets(gran).map((bk) => ({
        label: bk.label,
        value: cases.filter((c) => { const cd = new Date(c.createdAt); return cd >= bk.start && cd < bk.end; }).length,
    })), [cases, gran]);

    // ── Today's Priority Cases (critical → in_progress → recent) ──
    const priority = useMemo(() => {
        const rank: Record<string, number> = { critical: 0, in_progress: 1, open: 2 };
        return [...cases].filter((c) => c.status !== 'closed')
            .sort((a, b) => (rank[a.status] ?? 3) - (rank[b.status] ?? 3) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [cases]);

    // ── Recent Client Activity (new clients + uploaded docs) ──
    const activity = useMemo(() => {
        const a: { id: string; icon: string; text: string; sub: string; at: string }[] = [];
        clients.forEach((c) => a.push({ id: 'c' + c.id, icon: 'fa-user-plus', text: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(), sub: 'New client added', at: c.createdAt }));
        docs.forEach((d) => a.push({ id: 'd' + d.id, icon: 'fa-file-arrow-up', text: d.fileName, sub: `${pretty(d.documentType)}${d.clientName ? ' · ' + d.clientName : ''}`, at: d.uploadedAt }));
        return a.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime()).slice(0, 6);
    }, [clients, docs]);

    // ── Upcoming Appointments ──
    const upcoming = useMemo(() => {
        const now = Date.now();
        return events.filter((e) => e.source === 'event' && new Date(e.start).getTime() >= now)
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 5);
    }, [events]);

    // ── Tasks ──
    const openTasks = useMemo(() => todos.filter((t) => !t.isCompleted)
        .sort((a, b) => (new Date(a.dueDate || '2999').getTime()) - (new Date(b.dueDate || '2999').getTime())).slice(0, 6), [todos]);

    if (loading) return <div className="flex justify-center items-center h-64"><Spinner size={50} /></div>;

    const quickActions = [
        { label: 'New Client', icon: 'fa-user-plus', to: '/clients' },
        { label: 'New Case', icon: 'fa-folder-plus', to: '/cases/new' },
        { label: 'Upload Document', icon: 'fa-file-arrow-up', to: '/documents' },
        { label: 'Schedule Appointment', icon: 'fa-calendar-plus', to: '/calendar' },
    ];

    return (
        <div className="space-y-6">
            {/* Quick actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((a) => (
                    <button key={a.label} onClick={() => navigate(a.to)}
                        className="group flex items-center gap-3 rounded-xl p-4 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--brand-accent)] transition-colors">
                        <span className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)', color: 'var(--brand-accent)' }}>
                            <i className={`fa-solid ${a.icon}`} />
                        </span>
                        <span className="text-sm font-semibold text-[var(--text)] text-left">{a.label}</span>
                    </button>
                ))}
            </div>

            {/* Three cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* My Clients */}
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">My Clients</h3>
                        <span className="text-xs text-[var(--faint)]">{shownClients.length}</span>
                    </div>
                    <input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Search clients…" className={`${searchCls} mb-2`} />
                    <div className="flex gap-2 mb-3">
                        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className={selectCls}>
                            <option value="all">All</option><option value="week">This week</option><option value="month">This month</option>
                        </select>
                        <select value={clientSort} onChange={(e) => setClientSort(e.target.value)} className={selectCls}>
                            <option value="name">Sort: Name</option><option value="newest">Sort: Newest</option>
                        </select>
                    </div>
                    <ul className="space-y-1 overflow-y-auto max-h-64 -mr-2 pr-2">
                        {shownClients.length === 0 ? <li className="text-xs text-[var(--muted)] py-6 text-center">No clients found.</li> :
                            shownClients.map((c) => (
                                <li key={c.id}>
                                    <button onClick={() => navigate(`/clients/${c.id}`)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--overlay-weak)] text-left">
                                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'var(--brand-soft)', color: 'var(--brand-accent)' }}>{initials(c.firstName, c.lastName)}</span>
                                        <span className="min-w-0">
                                            <span className="block text-sm text-[var(--text)] truncate">{`${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()}</span>
                                            <span className="block text-xs text-[var(--faint)] truncate">{c.email || c.phone || '—'}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                    </ul>
                </div>

                {/* My Active Cases */}
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">My Active Cases</h3>
                        <span className="text-xs text-[var(--faint)]">{shownCases.length}</span>
                    </div>
                    <input value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)} placeholder="Search cases…" className={`${searchCls} mb-2`} />
                    <div className="flex gap-2 mb-3">
                        <select value={caseStatus} onChange={(e) => setCaseStatus(e.target.value)} className={selectCls}>
                            <option value="all">All</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="critical">Critical</option>
                        </select>
                        <select value={caseSort} onChange={(e) => setCaseSort(e.target.value)} className={selectCls}>
                            <option value="newest">Sort: Newest</option><option value="status">Sort: Status</option>
                        </select>
                    </div>
                    <ul className="space-y-1 overflow-y-auto max-h-64 -mr-2 pr-2">
                        {shownCases.length === 0 ? <li className="text-xs text-[var(--muted)] py-6 text-center">No active cases.</li> :
                            shownCases.map((c) => (
                                <li key={c.id}>
                                    <button onClick={() => navigate(`/cases/${c.id}/edit`)} className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-[var(--overlay-weak)] text-left">
                                        <span className="min-w-0">
                                            <span className="block text-sm text-[var(--text)] truncate">{c.caseNumber}</span>
                                            <span className="block text-xs text-[var(--faint)] truncate">{c.clientName || '—'}</span>
                                        </span>
                                        <span className={`text-[0.62rem] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badge(c.status)}`}>{pretty(c.status)}</span>
                                    </button>
                                </li>
                            ))}
                    </ul>
                </div>

                {/* Today's Workload */}
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Today's Workload</h3>
                        <span className="text-xs text-[var(--faint)]">{workload.length}</span>
                    </div>
                    <input value={workSearch} onChange={(e) => setWorkSearch(e.target.value)} placeholder="Search…" className={`${searchCls} mb-2`} />
                    <div className="flex gap-2 mb-3">
                        <select value={workFilter} onChange={(e) => setWorkFilter(e.target.value)} className={selectCls}>
                            <option value="all">All</option><option value="task">Tasks</option><option value="event">Events</option>
                        </select>
                    </div>
                    <ul className="space-y-1 overflow-y-auto max-h-64 -mr-2 pr-2">
                        {workload.length === 0 ? <li className="text-xs text-[var(--muted)] py-6 text-center">Nothing scheduled today.</li> :
                            workload.map((i) => (
                                <li key={i.id} className="flex items-center gap-3 p-2 rounded-lg">
                                    <span className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: i.color }} />
                                    <span className="min-w-0">
                                        <span className="block text-sm text-[var(--text)] truncate">{i.title}</span>
                                        <span className="block text-xs text-[var(--faint)] truncate">{i.meta}</span>
                                    </span>
                                </li>
                            ))}
                    </ul>
                </div>
            </div>

            {/* Case Trend */}
            <Section title="Case Trend" action={
                <div className="flex gap-1 rounded-lg p-0.5 bg-[var(--overlay-weak)] border border-[var(--border)]">
                    {(['day', 'week', 'month', 'year'] as Granularity[]).map((g) => (
                        <button key={g} onClick={() => setGran(g)}
                            className="text-xs px-3 py-1 rounded-md capitalize transition-colors"
                            style={gran === g ? { background: 'var(--brand)', color: '#fff' } : { color: 'var(--muted)' }}>
                            {g}
                        </button>
                    ))}
                </div>
            }>
                <LineChart points={trend} height={240} yUnit="Cases" />
            </Section>

            {/* Priority + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Today's Priority Cases">
                    {priority.length === 0 ? <div className="text-sm text-[var(--muted)] py-8 text-center">No active cases.</div> : (
                        <ul className="divide-y divide-[var(--border)]">
                            {priority.map((c) => (
                                <li key={c.id}>
                                    <button onClick={() => navigate(`/cases/${c.id}/edit`)} className="w-full flex items-center justify-between gap-2 py-3 text-left hover:opacity-80">
                                        <span className="min-w-0">
                                            <span className="block text-sm font-medium text-[var(--text)] truncate">{c.caseNumber}</span>
                                            <span className="block text-xs text-[var(--faint)] truncate">{c.clientName || '—'}</span>
                                        </span>
                                        <span className={`text-[0.62rem] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badge(c.status)}`}>{pretty(c.status)}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Section title="Recent Client Activity">
                    {activity.length === 0 ? <div className="text-sm text-[var(--muted)] py-8 text-center">No recent activity.</div> : (
                        <ul className="space-y-3">
                            {activity.map((a) => (
                                <li key={a.id} className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)', color: 'var(--brand-accent)' }}><i className={`fa-solid ${a.icon} text-sm`} /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm text-[var(--text)] truncate">{a.text || '—'}</span>
                                        <span className="block text-xs text-[var(--faint)] truncate">{a.sub}</span>
                                    </span>
                                    <span className="text-xs text-[var(--faint)] flex-shrink-0">{timeAgo(a.at)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>
            </div>

            {/* Appointments + Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Upcoming Appointments" action={<button onClick={() => navigate('/calendar')} className="text-xs font-semibold" style={{ color: 'var(--brand-accent)' }}>View calendar →</button>}>
                    {upcoming.length === 0 ? <div className="text-sm text-[var(--muted)] py-8 text-center">No upcoming appointments.</div> : (
                        <ul className="divide-y divide-[var(--border)]">
                            {upcoming.map((e) => (
                                <li key={e.id} className="flex items-center gap-3 py-3">
                                    <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)', color: EVENT_TYPE_COLOR[e.type] || 'var(--brand-accent)' }}><i className="fa-solid fa-calendar-check text-sm" /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm text-[var(--text)] truncate">{e.title}</span>
                                        <span className="block text-xs text-[var(--faint)] truncate">{pretty(e.type)}{e.clientName ? ` · ${e.clientName}` : ''}</span>
                                    </span>
                                    <span className="text-xs text-[var(--muted)] flex-shrink-0 text-right">
                                        {new Date(e.start).toLocaleDateString([], { day: '2-digit', month: 'short' })}<br />
                                        {e.allDay ? 'All day' : new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Section title="Tasks">
                    {openTasks.length === 0 ? <div className="text-sm text-[var(--muted)] py-8 text-center">No open tasks.</div> : (
                        <ul className="divide-y divide-[var(--border)]">
                            {openTasks.map((t) => {
                                const overdue = t.dueDate ? new Date(t.dueDate).getTime() < Date.now() : false;
                                return (
                                    <li key={t.id} className="flex items-center justify-between gap-2 py-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <i className="fa-regular fa-circle text-[var(--faint)]" />
                                            <span className="text-sm text-[var(--text)] truncate">{t.title}</span>
                                        </div>
                                        {t.dueDate && (
                                            <span className={`text-[0.62rem] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${overdue ? 'pill-red' : 'pill-brand'}`}>
                                                {new Date(t.dueDate).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Section>
            </div>
        </div>
    );
}
