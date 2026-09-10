import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import HelpButton from '../components/HelpButton';
import { AxiosError } from 'axios';

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

export default function NewCase() {
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [matterTypes, setMatterTypes] = useState<MatterType[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [formData, setFormData] = useState({
        clientId: '',
        incidentDate: '',
        status: 'open',        // lowercase
        description: '',
        matterTypeId: '',
        assignedUserId: '',
        supervisorUserId: '',
        prescriptionDate: '',
        lodgementDate: '',
        statutoryNoticeDate: '',
        summonsServedDate: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchClients();
        fetchMatterTypes();
        fetchTeam();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (err) {
            console.error('Failed to fetch clients', err);
            setError('Could not load clients. Please try again.');
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

    const selectedMatterType = matterTypes.find(m => m.id === formData.matterTypeId);
    const previewPrescriptionDate = (() => {
        if (formData.prescriptionDate) return null; // explicit value already set, no preview needed
        if (!formData.incidentDate || !selectedMatterType?.defaultPeriodMonths) return null;
        const d = new Date(formData.incidentDate);
        d.setMonth(d.getMonth() + selectedMatterType.defaultPeriodMonths);
        return d.toISOString().split('T')[0];
    })();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Format incidentDate as YYYY-MM-DD (optional – backend can parse ISO)
        const payload = {
            ...formData,
            incidentDate: formData.incidentDate ? new Date(formData.incidentDate).toISOString().split('T')[0] : null,
            matterTypeId: formData.matterTypeId || null,
            assignedUserId: formData.assignedUserId || null,
            supervisorUserId: formData.supervisorUserId || null,
            // Leave prescriptionDate unset so the server auto-calculates it from the
            // occurrence date + matter type, unless the user typed an explicit override.
            prescriptionDate: formData.prescriptionDate || null,
            lodgementDate: formData.lodgementDate || null,
            statutoryNoticeDate: formData.statutoryNoticeDate || null,
            summonsServedDate: formData.summonsServedDate || null,
        };

        try {
            await api.post('/cases', payload);
            navigate('/cases');
        } catch (err: unknown) {
            console.error('Failed to create case', err);
            let errorMsg = 'Failed to create new case.';
            if (err instanceof AxiosError && err.response) {
                errorMsg = err.response.data?.error || JSON.stringify(err.response.data) || errorMsg;
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <HelpButton
                    title="Add New Case"
                    description="Create a case for an existing client."
                    steps={[
                        'Select the client this case belongs to.',
                        'A case number is assigned automatically once you save.',
                        'Set the status — most new cases start as Open.',
                        'Click "Create Case" to save, or Cancel to go back without saving.',
                    ]}
                />
            <main className="p-6 pt-16">
                    <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-lg shadow p-6">
                        <h1 className="text-2xl font-bold mb-6">Add New Case</h1>
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
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Incident Date *</label>
                                <input
                                    type="date"
                                    name="incidentDate"
                                    value={formData.incidentDate}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                    required
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
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Prescription Date</label>
                                <input
                                    type="date"
                                    name="prescriptionDate"
                                    value={formData.prescriptionDate}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                />
                                <p className="text-xs text-[var(--faint)] mt-1">
                                    {previewPrescriptionDate
                                        ? `Leave blank to auto-calculate: ${previewPrescriptionDate} (based on matter type). Not legal advice — verify before relying on it.`
                                        : 'Leave blank to auto-calculate from Incident Date + Matter Type where available, or set manually.'}
                                </p>
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
                                    disabled={loading}
                                    className="flex-1 bg-[var(--brand)] text-white py-2 rounded hover:bg-[var(--brand-hover)] disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Case'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/cases')}
                                    className="flex-1 bg-[var(--overlay-med)] text-[var(--text)] py-2 rounded hover:bg-[var(--overlay-strong)]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
            </main>
        </>
    );
}