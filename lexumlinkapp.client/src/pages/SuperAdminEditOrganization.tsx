import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

interface OrgForm {
    name: string;
    plan: string;
    maxUsers: number;
    maxClients: number | null;
    storageLimitGb: number;
    isActive: boolean;
}

// Suggested defaults per plan, matching the public Pricing page. Selecting a plan
// pre-fills these — the admin can still fine-tune any value afterwards.
const PLAN_PRESETS: Record<string, { maxUsers: number; maxClients: number | null; storageLimitGb: number }> = {
    starter: { maxUsers: 1, maxClients: 25, storageLimitGb: 5 },
    professional: { maxUsers: 5, maxClients: 250, storageLimitGb: 25 },
    custom: { maxUsers: 10, maxClients: null, storageLimitGb: 100 },
};

export default function SuperAdminEditOrganization() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [unlimitedClients, setUnlimitedClients] = useState(false);
    const [formData, setFormData] = useState<OrgForm>({
        name: '',
        plan: 'starter',
        maxUsers: 1,
        maxClients: 25,
        storageLimitGb: 5,
        isActive: true,
    });

    useEffect(() => {
        if (id) fetchOrg();
    }, [id]);

    const fetchOrg = async () => {
        try {
            const res = await api.get(`/admin/organizations/${id}`);
            const data = res.data;
            setFormData({
                name: data.name,
                plan: data.plan,
                maxUsers: data.maxUsers,
                maxClients: data.maxClients,
                storageLimitGb: data.storageLimitGb,
                isActive: data.isActive,
            });
            setUnlimitedClients(data.maxClients === null);
        } catch (err) {
            console.error(err);
            setError('Failed to load organization data');
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const plan = e.target.value;
        const preset = PLAN_PRESETS[plan];
        setFormData({
            ...formData,
            plan,
            maxUsers: preset.maxUsers,
            maxClients: preset.maxClients,
            storageLimitGb: preset.storageLimitGb,
        });
        setUnlimitedClients(preset.maxClients === null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else if (type === 'number') {
            setFormData({ ...formData, [name]: value === '' ? 0 : parseInt(value, 10) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const toggleUnlimitedClients = (checked: boolean) => {
        setUnlimitedClients(checked);
        setFormData({ ...formData, maxClients: checked ? null : (formData.maxClients ?? 25) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.put(`/admin/organizations/${id}`, {
                name: formData.name,
                plan: formData.plan,
                maxUsers: formData.maxUsers,
                maxClients: unlimitedClients ? null : formData.maxClients,
                storageLimitGb: formData.storageLimitGb,
                isActive: formData.isActive,
            });
            navigate('/super-admin/organizations');
        } catch (err: unknown) {
            console.error(err);
            let errorMessage = 'Failed to update organization';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { error?: string } } };
                errorMessage = axiosError.response?.data?.error || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (!user?.isSuperAdmin) {
        return <div className="p-6 text-red-300">Access denied. Super admin only.</div>;
    }

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
                title="Edit Organization"
                description="Change an organisation's name, plan and usage limits."
                steps={[
                    'Changing the plan pre-fills suggested user/client/storage limits — you can still adjust any of them.',
                    'Tick "Unlimited clients" for organisations that shouldn\'t have a client cap.',
                    'Untick "Active" to deactivate an organisation — this is a soft block you can reverse at any time.',
                ]}
            />
            <main className="p-6 pt-16">
                <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold mb-6">Edit Organization</h1>
                    {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded mb-4">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Organization Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Plan</label>
                            <select
                                name="plan"
                                value={formData.plan}
                                onChange={handlePlanChange}
                                className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            >
                                <option value="starter">Starter</option>
                                <option value="professional">Professional</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Max Users</label>
                                <input
                                    type="number"
                                    min={1}
                                    name="maxUsers"
                                    value={formData.maxUsers}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Storage Limit (GB)</label>
                                <input
                                    type="number"
                                    min={1}
                                    name="storageLimitGb"
                                    value={formData.storageLimitGb}
                                    onChange={handleChange}
                                    className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Max Clients</label>
                            <input
                                type="number"
                                min={1}
                                name="maxClients"
                                value={unlimitedClients ? '' : (formData.maxClients ?? '')}
                                onChange={handleChange}
                                disabled={unlimitedClients}
                                placeholder={unlimitedClients ? 'Unlimited' : ''}
                                className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)] disabled:opacity-50"
                            />
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="unlimitedClients"
                                    checked={unlimitedClients}
                                    onChange={(e) => toggleUnlimitedClients(e.target.checked)}
                                />
                                <label htmlFor="unlimitedClients" className="text-sm text-[var(--text)]">Unlimited clients</label>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                            <input type="checkbox" name="isActive" id="isActive" checked={formData.isActive} onChange={handleChange} className="mt-2" />
                            <label htmlFor="isActive" className="text-sm text-[var(--text)] mt-2">Active (unchecking deactivates the organisation)</label>
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
                                onClick={() => navigate('/super-admin/organizations')}
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
