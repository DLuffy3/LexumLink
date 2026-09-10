import { useEffect, useState } from 'react';
import api from '../services/api';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

interface MatterType {
    id: string;
    name: string;
    defaultPeriodMonths: number | null;
    notes: string | null;
    isActive: boolean;
    sortOrder: number;
}

export default function SuperAdminMatterTypes() {
    const [types, setTypes] = useState<MatterType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);
    const [savedId, setSavedId] = useState<string | null>(null);

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            const res = await api.get('/admin/matter-types');
            setTypes(res.data);
        } catch (err) {
            console.error('Failed to load matter types', err);
            setError('Failed to load matter types');
        } finally {
            setLoading(false);
        }
    };

    const updateLocal = (id: string, changes: Partial<MatterType>) => {
        setTypes(prev => prev.map(t => (t.id === id ? { ...t, ...changes } : t)));
    };

    const handleSave = async (t: MatterType) => {
        setSavingId(t.id);
        setSavedId(null);
        try {
            await api.put(`/admin/matter-types/${t.id}`, {
                defaultPeriodMonths: t.defaultPeriodMonths,
                notes: t.notes,
                isActive: t.isActive,
            });
            setSavedId(t.id);
            setTimeout(() => setSavedId(null), 2000);
        } catch (err) {
            console.error('Failed to save matter type', err);
            setError(`Failed to save "${t.name}"`);
        } finally {
            setSavingId(null);
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
                title="Matter Types"
                description="The claim/matter types used for prescription tracking on cases, modelled on LPIIF's Prescription Alert system."
                steps={[
                    'Set the default prescription period (in months) that a case\'s Prescription Date is auto-calculated from, using the Incident Date.',
                    'Leave the period blank for matter types where the period depends on case-specific facts — those cases will require a manually entered Prescription Date.',
                    'Deactivate a matter type to hide it from the New/Edit Case dropdown without deleting it.',
                ]}
                tips={['These defaults are a starting point, not legal advice. Verify each period against current legislation for your practice before relying on it.']}
            />

            <main className="p-6 pt-16">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Matter Types</h1>
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm p-3 rounded mb-6">
                        Default prescription periods below are starting points only, not legal advice. Verify and adjust
                        them for your own practice before relying on the auto-calculated Prescription Date.
                    </div>

                    {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded mb-4">{error}</div>}

                    <div className="bg-[var(--surface)] rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--border)]">
                            <thead className="bg-[var(--overlay-weak)]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Matter Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider w-32">Period (months)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Notes</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider w-24">Active</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider w-28"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {types.map(t => (
                                    <tr key={t.id}>
                                        <td className="px-4 py-3 align-top text-sm text-[var(--text)] font-medium">{t.name}</td>
                                        <td className="px-4 py-3 align-top">
                                            <input
                                                type="number"
                                                min={0}
                                                value={t.defaultPeriodMonths ?? ''}
                                                placeholder="Manual"
                                                onChange={e => updateLocal(t.id, { defaultPeriodMonths: e.target.value === '' ? null : Number(e.target.value) })}
                                                className="w-24 bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-1.5 text-sm focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                            />
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <textarea
                                                value={t.notes ?? ''}
                                                rows={2}
                                                onChange={e => updateLocal(t.id, { notes: e.target.value })}
                                                className="w-full min-w-[16rem] bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-1.5 text-sm focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                                            />
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <input
                                                type="checkbox"
                                                checked={t.isActive}
                                                onChange={e => updateLocal(t.id, { isActive: e.target.checked })}
                                                className="h-4 w-4"
                                            />
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <button
                                                type="button"
                                                onClick={() => handleSave(t)}
                                                disabled={savingId === t.id}
                                                className="bg-[var(--brand-soft)] text-[var(--brand-accent)] px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-[var(--brand)] hover:text-white transition-colors disabled:opacity-50"
                                            >
                                                {savingId === t.id ? 'Saving...' : savedId === t.id ? 'Saved ✓' : 'Save'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </>
    );
}
