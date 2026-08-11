import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

interface Case {
    id: string;
    caseNumber: string;
    clientName?: string;
}

interface ClaimData {
    id: string;
    claimNumber: string;
    caseId: string;
    status: string;
    rafReference: string;
    amountRequested: number | null;
    amountAwarded: number | null;
}

export default function EditClaim() {
    const { id } = useParams<{ id: string }>();
    const { activeOrganization } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [cases, setCases] = useState<Case[]>([]);
    const [formData, setFormData] = useState<ClaimData>({
        id: '',
        claimNumber: '',
        caseId: '',
        status: 'in_progress',
        rafReference: '',
        amountRequested: null,
        amountAwarded: null,
    });

    useEffect(() => {
        if (id && activeOrganization) {
            fetchClaim();
            fetchCases();
        }
    }, [id, activeOrganization]);

    const fetchClaim = async () => {
        try {
            const res = await api.get(`/claims/${id}`);
            const data = res.data;
            setFormData({
                id: data.id,
                claimNumber: data.claimNumber,
                caseId: data.caseId,
                status: data.status,
                rafReference: data.rafReference || '',
                amountRequested: data.amountRequested,
                amountAwarded: data.amountAwarded,
            });
        } catch (err) {
            console.error(err);
            setError('Failed to load claim data');
        } finally {
            setLoading(false);
        }
    };

    const fetchCases = async () => {
        try {
            const res = await api.get('/cases');
            setCases(res.data);
        } catch (err) {
            console.error('Failed to fetch cases', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormData({ ...formData, [name]: value === '' ? null : parseFloat(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.put(`/claims/${id}`, formData);
            navigate('/claims');
        } catch (err) {
            console.error(err);
            setError('Failed to update claim');
        } finally {
            setSubmitting(false);
        }
    };

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
                    title="Edit RAF Claim"
                    description="Update a claim's status or amounts."
                    steps={[
                        'Add or adjust the requested and awarded amounts as they become known.',
                        'Update the status as the claim moves through the RAF process.',
                        'Click "Save Changes" to apply, or Cancel to leave without saving.',
                    ]}
                />

            <main className="p-6 pt-16">
                    <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-lg shadow p-6">
                        <h1 className="text-2xl font-bold mb-6">Edit RAF Claim</h1>
                        {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded mb-4">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Case *</label>
                                <select
                                    name="caseId"
                                    value={formData.caseId}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                    required
                                >
                                    <option value="">Select a case</option>
                                    {cases.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.caseNumber} - {c.clientName || 'No client'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Claim Number *</label>
                                <input
                                    type="text"
                                    name="claimNumber"
                                    value={formData.claimNumber}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">RAF Reference</label>
                                <input
                                    type="text"
                                    name="rafReference"
                                    value={formData.rafReference}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Amount Requested (R)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="amountRequested"
                                    value={formData.amountRequested ?? ''}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Amount Awarded (R)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="amountAwarded"
                                    value={formData.amountAwarded ?? ''}
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
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="critical">Critical</option>
                                </select>
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
                                    onClick={() => navigate('/claims')}
                                    className="bg-[var(--overlay-med)] text-[var(--text)] px-4 py-2 rounded hover:bg-[var(--overlay-strong)]"
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