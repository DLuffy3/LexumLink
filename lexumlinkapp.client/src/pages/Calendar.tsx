import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalItem {
    id: string;
    source: 'event' | 'task' | 'case';
    editable: boolean;
    type: string;
    title: string;
    start: string;
    end: string | null;
    allDay: boolean;
    location: string | null;
    notes: string | null;
    clientId: string | null;
    clientName: string | null;
    caseId: string | null;
    caseNumber: string | null;
}
interface ClientOpt { id: string; firstName?: string; lastName?: string; }
interface CaseOpt { id: string; caseNumber?: string; }

interface FormState {
    title: string;
    eventType: string;
    date: string;
    allDay: boolean;
    startTime: string;
    endTime: string;
    location: string;
    clientId: string;
    caseId: string;
    notes: string;
}

// ─── Meta ──────────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
    appointment: { label: 'Appointment', color: '#C9A24B', icon: 'fa-calendar-check' },
    follow_up: { label: 'Follow-up', color: '#4C86A8', icon: 'fa-rotate-right' },
    court_date: { label: 'Court date', color: '#A31515', icon: 'fa-gavel' },
    medical_assessment: { label: 'Medical assessment', color: '#2E8B6F', icon: 'fa-stethoscope' },
    task_deadline: { label: 'Task deadline', color: '#8E7E69', icon: 'fa-list-check' },
    case_deadline: { label: 'Case deadline', color: '#C1121F', icon: 'fa-folder-open' },
};
const EVENT_TYPES = ['appointment', 'follow_up', 'court_date', 'medical_assessment'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ─── Date helpers ───────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const sameDay = (a: Date, b: Date) => ymd(a) === ymd(b);
const timeStr = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function buildGrid(view: Date): Date[] {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const gridStart = new Date(first);
    gridStart.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        return d;
    });
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function Calendar() {
    const { activeOrganization } = useAuth();
    const [view, setView] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
    const [selected, setSelected] = useState(() => new Date());
    const [items, setItems] = useState<CalItem[]>([]);
    const [clients, setClients] = useState<ClientOpt[]>([]);
    const [cases, setCases] = useState<CaseOpt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<FormState>({
        title: '', eventType: 'appointment', date: ymd(new Date()), allDay: false,
        startTime: '09:00', endTime: '', location: '', clientId: '', caseId: '', notes: '',
    });

    const grid = buildGrid(view);

    const fetchFeed = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const gridStart = grid[0];
            const gridEnd = new Date(grid[41]);
            gridEnd.setDate(gridEnd.getDate() + 1);
            const res = await api.get('/events', { params: { start: gridStart.toISOString(), end: gridEnd.toISOString() } });
            setItems(res.data);
        } catch (err) {
            console.error('Failed to load calendar', err);
            setError('Unable to load calendar events. Please refresh.');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    useEffect(() => {
        if (activeOrganization) fetchFeed();
    }, [activeOrganization, fetchFeed]);

    useEffect(() => {
        if (!activeOrganization) return;
        api.get('/clients').then((r) => setClients(r.data)).catch(() => { });
        api.get('/cases').then((r) => setCases(r.data)).catch(() => { });
    }, [activeOrganization]);

    const itemsOn = (d: Date) => items
        .filter((i) => sameDay(new Date(i.start), d))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const openAdd = () => {
        setEditingId(null);
        setForm({
            title: '', eventType: 'appointment', date: ymd(selected), allDay: false,
            startTime: '09:00', endTime: '', location: '', clientId: '', caseId: '', notes: '',
        });
        setModalOpen(true);
    };

    const openEdit = (item: CalItem) => {
        if (!item.editable) return;
        const s = new Date(item.start);
        const e = item.end ? new Date(item.end) : null;
        setEditingId(item.id);
        setForm({
            title: item.title,
            eventType: item.type,
            date: ymd(s),
            allDay: item.allDay,
            startTime: `${pad(s.getHours())}:${pad(s.getMinutes())}`,
            endTime: e ? `${pad(e.getHours())}:${pad(e.getMinutes())}` : '',
            location: item.location ?? '',
            clientId: item.clientId ?? '',
            caseId: item.caseId ?? '',
            notes: item.notes ?? '',
        });
        setModalOpen(true);
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const startAt = new Date(`${form.date}T${form.allDay ? '00:00' : (form.startTime || '09:00')}`).toISOString();
            const endAt = !form.allDay && form.endTime ? new Date(`${form.date}T${form.endTime}`).toISOString() : null;
            const payload = {
                title: form.title,
                eventType: form.eventType,
                startAt,
                endAt,
                allDay: form.allDay,
                location: form.location || null,
                notes: form.notes || null,
                clientId: form.clientId || null,
                caseId: form.caseId || null,
                assignedUserId: null,
            };
            if (editingId) await api.put(`/events/${editingId}`, payload);
            else await api.post('/events', payload);
            setModalOpen(false);
            await fetchFeed();
        } catch (err) {
            console.error('Failed to save event', err);
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            await api.delete(`/events/${editingId}`);
            setModalOpen(false);
            await fetchFeed();
        } catch (err) {
            console.error('Failed to delete event', err);
        } finally {
            setSaving(false);
        }
    };
    const today = new Date();
    const inMonth = (d: Date) => d.getMonth() === view.getMonth();

    const inputCls = 'w-full text-sm px-3 py-2 rounded-lg bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] outline-none focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[var(--brand-ring)]';
    const labelCls = 'text-[0.68rem] tracking-[0.12em] uppercase mb-1.5 block text-[var(--muted)]';

    return (
        <>
            <HelpButton
                title="Calendar"
                description="Track appointments, follow-ups, court dates, medical assessments and deadlines in one place."
                steps={[
                    'Click any date to add a new event.',
                    'Choose the event type — appointment, follow-up, court date or medical assessment.',
                    'Link the event to a client or case so it shows up on their record too.',
                    'Click an existing event to edit or delete it.',
                ]}
                tips={['Use the arrows next to the month name to move forward or back.']}
            />

            <main className="p-6 pt-16">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="font-['Grifter'] text-3xl font-bold">{MONTHS[view.getMonth()]} {view.getFullYear()}</h1>
                        <p className="text-sm text-[var(--muted)] mt-1">Appointments, follow-ups, court dates, medical assessments &amp; deadlines.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="w-9 h-9 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--overlay-weak)]" aria-label="Previous month">
                            <i className="fa-solid fa-chevron-left" />
                        </button>
                        <button onClick={() => { const n = new Date(); setView(new Date(n.getFullYear(), n.getMonth(), 1)); setSelected(n); }} className="px-3 h-9 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--overlay-weak)]">
                            Today
                        </button>
                        <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="w-9 h-9 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--overlay-weak)]" aria-label="Next month">
                            <i className="fa-solid fa-chevron-right" />
                        </button>
                        <button onClick={openAdd} className="ml-1 inline-flex items-center gap-2 px-4 h-9 rounded-lg text-white text-sm font-semibold bg-[var(--brand)] hover:bg-[var(--brand-hover)]">
                            <i className="fa-solid fa-plus" /> Add event
                        </button>
                    </div>
                </div>

                {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-4 rounded-lg mb-6">{error}</div>}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                    {/* Month grid */}
                    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-[var(--border)]">
                            {WEEKDAYS.map((w) => (
                                <div key={w} className="px-2 py-3 text-center text-[0.68rem] tracking-widest uppercase text-[var(--muted)]">{w}</div>
                            ))}
                        </div>
                        {loading ? (
                            <div className="py-20"><Spinner size={44} /></div>
                        ) : (
                            <div className="grid grid-cols-7">
                                {grid.map((d, i) => {
                                    const dayItems = itemsOn(d);
                                    const isToday = sameDay(d, today);
                                    const isSel = sameDay(d, selected);
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelected(new Date(d))}
                                            className="text-left min-h-[92px] p-2 border-b border-r border-[var(--border)] transition-colors hover:bg-[var(--overlay-weak)] focus:outline-none"
                                            style={{ background: isSel ? 'var(--brand-soft)' : undefined, opacity: inMonth(d) ? 1 : 0.4 }}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span
                                                    className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                                                    style={isToday ? { background: 'var(--brand)', color: '#fff' } : { color: 'var(--text)' }}
                                                >
                                                    {d.getDate()}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {dayItems.slice(0, 3).map((it) => (
                                                    <div key={it.source + it.id} className="flex items-center gap-1.5 text-[0.68rem] leading-tight truncate" style={{ color: 'var(--text)' }}>
                                                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: (TYPE_META[it.type]?.color) || 'var(--brand-accent)' }} />
                                                        <span className="truncate">{it.title}</span>
                                                    </div>
                                                ))}
                                                {dayItems.length > 3 && (
                                                    <div className="text-[0.62rem] text-[var(--faint)]">+{dayItems.length - 3} more</div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Day agenda */}
                    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-xs uppercase tracking-widest text-[var(--muted)]">{WEEKDAYS[selected.getDay()]}</div>
                                <div className="font-['Grifter'] text-xl font-bold">{MONTHS[selected.getMonth()].slice(0, 3)} {selected.getDate()}</div>
                            </div>
                            <button onClick={openAdd} className="w-8 h-8 rounded-lg text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)]" aria-label="Add event"><i className="fa-solid fa-plus" /></button>
                        </div>

                        {itemsOn(selected).length === 0 ? (
                            <div className="text-center text-sm text-[var(--muted)] py-10">Nothing scheduled.</div>
                        ) : (
                            <ul className="space-y-2">
                                {itemsOn(selected).map((it) => {
                                    const meta = TYPE_META[it.type] || { label: it.type, color: 'var(--brand-accent)', icon: 'fa-calendar' };
                                    return (
                                        <li key={it.source + it.id}>
                                            <button
                                                onClick={() => openEdit(it)}
                                                className={`w-full text-left rounded-lg p-3 border border-[var(--border)] bg-[var(--overlay-weak)] ${it.editable ? 'hover:bg-[var(--overlay-med)] cursor-pointer' : 'cursor-default'}`}
                                                style={{ borderLeft: `3px solid ${meta.color}` }}
                                            >
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <i className={`fa-solid ${meta.icon} text-xs`} style={{ color: meta.color }} />
                                                    <span className="text-sm font-medium truncate">{it.title}</span>
                                                </div>
                                                <div className="text-xs text-[var(--muted)] flex flex-wrap gap-x-3">
                                                    <span>{it.allDay ? 'All day' : timeStr(it.start)}{!it.allDay && it.end ? ` – ${timeStr(it.end)}` : ''}</span>
                                                    {it.clientName && <span><i className="fa-solid fa-user text-[0.6rem] mr-1" />{it.clientName}</span>}
                                                    {!it.editable && <span className="text-[var(--faint)]">{meta.label}</span>}
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {/* Legend */}
                        <div className="mt-5 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-2">
                            {Object.entries(TYPE_META).map(([k, m]) => (
                                <div key={k} className="flex items-center gap-2 text-[0.7rem] text-[var(--muted)]">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                                    <span className="truncate">{m.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--backdrop)' }} onClick={() => setModalOpen(false)}>
                    <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-['Grifter'] text-xl font-bold">{editingId ? 'Edit event' : 'New event'}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--text)]" aria-label="Close"><i className="fa-solid fa-xmark" /></button>
                        </div>

                        <form onSubmit={save} className="space-y-4">
                            <div>
                                <label className={labelCls}>Title</label>
                                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Consultation with client" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Type</label>
                                    <select className={inputCls} value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
                                        {EVENT_TYPES.map((t) => <option key={t} value={t} style={{ background: 'var(--surface)' }}>{TYPE_META[t].label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Date</label>
                                    <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                <input type="checkbox" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })} />
                                All day
                            </label>
                            {!form.allDay && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Start time</label>
                                        <input type="time" className={inputCls} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>End time</label>
                                        <input type="time" className={inputCls} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className={labelCls}>Location</label>
                                <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Office / Court / Hospital" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Client (optional)</label>
                                    <select className={inputCls} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                                        <option value="" style={{ background: 'var(--surface)' }}>None</option>
                                        {clients.map((c) => <option key={c.id} value={c.id} style={{ background: 'var(--surface)' }}>{`${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Case (optional)</label>
                                    <select className={inputCls} value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })}>
                                        <option value="" style={{ background: 'var(--surface)' }}>None</option>
                                        {cases.map((c) => <option key={c.id} value={c.id} style={{ background: 'var(--surface)' }}>{c.caseNumber ?? c.id}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Notes</label>
                                <textarea rows={3} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                {editingId ? (
                                    <button type="button" onClick={remove} disabled={saving} className="text-sm text-red-300 hover:text-red-200"><i className="fa-solid fa-trash mr-1.5" />Delete</button>
                                ) : <span />}
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--overlay-weak)]">Cancel</button>
                                    <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] disabled:opacity-50">{saving ? 'Saving…' : 'Save event'}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
