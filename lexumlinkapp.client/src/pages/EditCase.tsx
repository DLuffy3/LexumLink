import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

interface Client {
    id: string;
    firstName: string;
    lastName: string;
}

interface MatterType {
    id: string;
    name: string;
    defaultPeriodMonths: number | null;
    notes: string | null;
}

interface TeamMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface CaseEvent {
    id: string;
    eventType: string;
    eventDate: string;
    notes: string | null;
    addedByName: string | null;
    createdAt: string;
}

interface CaseData {
    id: string;
    caseNumber: string;
    clientId: string;
    status: string;
    incidentDate: string;
    description: string;
    matterTypeId: string;
    assignedUserId: string;
    supervisorUserId: string;
    prescriptionDate: string;
    lodgementDate: string;
    statutoryNoticeDate: string;
    summonsServedDate: string;
}

export default function EditCase() {
    const { id } = useParams<{ id: string }>();
    const { activeOrganization } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [matterTypes, setMatterTypes] = useState<MatterType[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [events, setEvents] = useState<CaseEvent[]>([]);
    const [newEvent, setNewEvent] = useState({ eventType: '', eventDate: '', notes: '' });
    const [addingEvent, setAddingEvent] = useState(false);
    const [formData, setFormData] = useState<CaseData>({
        id: '',
        caseNumber: '',
        clientId: '',
        status: 'open',
        incidentDate: '',
        description: '',
        matterTypeId: '',
        assignedUserId: '',
        supervisorUserId: '',
        prescriptionDate: '',
        lodgementDate: '',
        statutoryNoticeDate: '',
        summonsServedDate: '',
    });

    useEffect(() => {
        if (id && activeOrganization) {
            fetchCase();
            fetchClients();
            fetchMatterTypes();
            fetchTeam();
            fetchEvents();
        }
    }, [id, activeOrganization]);

    const fetchCase = async () => {
        try {
            const res = await api.get(`/cases/${id}`);
            const data = res.data;
            setFormData({
                id: data.id,
                caseNumber: data.caseNumber,
                clientId: data.clientId,
                status: data.status,
                incidentDate: data.incidentDate ? data.incidentDate.split('T')[0] : '',
                description: data.description || '',
                matterTypeId: data.matterTypeId || '',
                assignedUserId: data.assignedUserId || '',
                supervisorUserId: data.supervisorUserId || '',
                prescriptionDate: data.prescriptionDate ? data.prescriptionDate.split('T')[0] : '',
                lodgementDate: data.lodgementDate ? data.lodgementDate.split('T')[0] : '',
                statutoryNoticeDate: data.statutoryNoticeDate ? data.statutoryNoticeDate.split('T')[0] : '',
                summonsServedDate: data.summonsServedDate ? data.summonsServedDate.split('T')[0] : '',
            });
        } catch (err) {
            console.error(err);
            setError('Failed to load case data');
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (err) {
            console.error('Failed to fetch clients', err);
        }
    };

    const fetchMatterTypes = async () => {
        try {
            const res = await api.get('/cases/matter-types');
            setMatterTypes(res.data);
        } catch (err) {
            console.error('Failed to fetch matter types', err);
        }
    };

    const fetchTeam = async () => {
        try {
            const res = await api.get('/cases/team');
            setTeam(res.data);
        } catch (err) {
            console.error('Failed to fetch team', err);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await api.get(`/cases/${id}/events`);
            setEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch case events', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const selectedMatterType = matterTypes.find(m => m.id === formData.matterTypeId);

    const recalculatePrescriptionDate = () => {
        setFormData({ ...formData, prescriptionDate: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.put(`/cases/${id}`, {
                ...formData,
                matterTypeId: formData.matterTypeId || null,
                assignedUserId: formData.assignedUserId || null,
                supervisorUserId: formData.supervisorUserId || null,
                prescriptionDate: formData.prescriptionDate || null,
                lodgementDate: formData.lodgementDate || null,
                statutoryNoticeDate: formData.statutoryNoticeDate || null,
                summonsServedDate: formData.summonsServedDate || null,
            });
            navigate('/cases');
        } catch (err) {
            console.error(err);
            setError('Failed to update case');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.eventType || !newEvent.eventDate) return;
        setAddingEvent(true);
        try {
            await api.post(`/cases/${id}/events`, newEvent);
            setNewEvent({ eventType: '', eventDate: '', notes: '' });
            await fetchEvents();
        } catch (err) {
            console.error('Failed to add event', err);
        } finally {
            setAddingEvent(false);
        }
    };

    const daysUntilPrescription = formData.prescriptionDate
        ? Math.ceil((new Date(formData.prescriptionDate).getTime() - Date.now()) / 86400000)
        : null;
    const prescriptionColor = daysUntilPrescription === null
        ? 'text-[var(--faint)]'
        : daysUntilPrescription < 0
            ? 'text-red-400'
            : daysUntilPrescription <= 30
                ? 'text-amber-400'
                : 'text-[var(--text)]';

    if (loading) {
        return (
            <main className="p-6 pt-16">
                <Spinner />
            </main>
        );
    }

    return (
        <>
            <HelpButton
                    title="Edit Case"
                    description="Update this case's details or status."
                    steps={[
                        'Change any field, including status, as the case progresses.',
                        'Click "Save Changes" to apply your edits, or Cancel to leave without saving.',
                    ]}
                />

            <main className="p-6 pt-16">
                    <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-lg shadow p-6">
                        <h1 className="text-2xl font-bold mb-6">Edit Case</h1>
                        {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded mb-4">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Client *</label>
                                <select
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                    required
                                >
                                    <option value="">Select a client</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.firstName} {client.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Case Number</label>
                                <input
                                    type="text"
                                    value={formData.caseNumber}
                                    disabled
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--faint)] rounded p-2 cursor-not-allowed"
                                />
                                <p className="text-xs text-[var(--faint)] mt-1">Assigned automatically — can't be changed.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Incident Date</label>
                                <input
                                    type="date"
                                    name="incidentDate"
                                    value={formData.incidentDate}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="closed">Closed</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Description</label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                />
                            </div>

                            <div className="pt-2 border-t border-[var(--border)]">
                                <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Prescription tracking</h2>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Matter Type</label>
                                <select
                                    name="matterTypeId"
                                    value={formData.matterTypeId}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                >
                                    <option value="">Not set</option>
                                    {matterTypes.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                {selectedMatterType?.notes && (
                                    <p className="text-xs text-[var(--faint)] mt-1">{selectedMatterType.notes}</p>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-[var(--muted)]">Prescription Date</label>
                                    <button
                                        type="button"
                                        onClick={recalculatePrescriptionDate}
                                        className="text-xs font-medium text-[var(--brand-accent)] hover:underline"
                                    >
                                        Recalculate from Matter Type
                                    </button>
                                </div>
                                <input
                                    type="date"
                                    name="prescriptionDate"
                                    value={formData.prescriptionDate}
                                    onChange={handleChange}
                                    className={`w-full bg-[var(--overlay-weak)] border border-[var(--border)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)] font-semibold ${prescriptionColor}`}
                                />
                                {daysUntilPrescription !== null && (
                                    <p className={`text-xs mt-1 ${prescriptionColor}`}>
                                        {daysUntilPrescription < 0
                                            ? `Prescribed ${Math.abs(daysUntilPrescription)} day(s) ago`
                                            : `${daysUntilPrescription} day(s) remaining`}
                                        {' — not legal advice, verify independently.'}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Lodgement Date</label>
                                    <input
                                        type="date"
                                        name="lodgementDate"
                                        value={formData.lodgementDate}
                                        onChange={handleChange}
                                        className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Statutory Notice Date</label>
                                    <input
                                        type="date"
                                        name="statutoryNoticeDate"
                                        value={formData.statutoryNoticeDate}
                                        onChange={handleChange}
                                        className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Summons Served Date</label>
                                <input
                                    type="date"
                                    name="summonsServedDate"
                                    value={formData.summonsServedDate}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Assigned Handler</label>
                                    <select
                                        name="assignedUserId"
                                        value={formData.assignedUserId}
                                        onChange={handleChange}
                                        className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                    >
                                        <option value="">Unassigned</option>
                                        {team.map(u => (
                                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Supervisor</label>
                                    <select
                                        name="supervisorUserId"
                                        value={formData.supervisorUserId}
                                        onChange={handleChange}
                                        className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                    >
                                        <option value="">None</option>
                                        {team.map(u => (
                                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-[var(--brand)] text-white px-4 py-2 rounded hover:bg-[var(--brand-hover)] disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/cases')}
                                    className="bg-[var(--overlay-med)] text-[var(--text)] px-4 py-2 rounded hover:bg-[var(--overlay-strong)]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-lg shadow p-6 mt-6">
                        <h2 className="text-lg font-bold mb-4">Event history</h2>

                        <form onSubmit={handleAddEvent} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 mb-5">
                            <input
                                type="text"
                                placeholder="Event type (e.g. Summons served)"
                                value={newEvent.eventType}
                                onChange={e => setNewEvent({ ...newEvent, eventType: e.target.value })}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            />
                            <input
                                type="date"
                                value={newEvent.eventDate}
                                onChange={e => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            />
                            <button
                                type="submit"
                                disabled={addingEvent || !newEvent.eventType || !newEvent.eventDate}
                                className="bg-[var(--brand-soft)] text-[var(--brand-accent)] px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-[var(--brand)] hover:text-white transition-colors disabled:opacity-50"
                            >
                                {addingEvent ? 'Adding...' : 'Add Event'}
                            </button>
                        </form>

                        {events.length === 0 ? (
                            <p className="text-sm text-[var(--faint)]">No events logged yet.</p>
                        ) : (
                            <ul className="space-y-3">
                                {events.map(evt => (
                                    <li key={evt.id} className="border-l-2 border-[var(--border)] pl-3">
                                        <div className="flex items-baseline justify-between">
                                            <span className="font-semibold text-sm text-[var(--text)]">{evt.eventType}</span>
                                            <span className="text-xs text-[var(--faint)]">{new Date(evt.eventDate).toLocaleDateString()}</span>
                                        </div>
                                        {evt.notes && <p className="text-xs text-[var(--muted)] mt-0.5">{evt.notes}</p>}
                                        {evt.addedByName && <p className="text-xs text-[var(--faint)] mt-0.5">Added by {evt.addedByName}</p>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
            </main>
        </>
    );
}