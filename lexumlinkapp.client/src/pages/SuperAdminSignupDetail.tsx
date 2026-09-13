import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { SERVER_ORIGIN } from '../services/api';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

interface RegistrationDetail {
    id: string;
    clientReferenceNumber: string;
    companyName: string;
    tradingName: string | null;
    companyRegistrationNumber: string | null;
    vatNumber: string | null;
    natureOfBusiness: string | null;
    contactFullName: string;
    contactPosition: string | null;
    contactMobile: string;
    contactAlternateNumber: string | null;
    contactEmail: string;
    contactWhatsApp: string | null;
    physicalAddress: string;
    postalAddress: string | null;
    province: string | null;
    postalCode: string | null;
    servicePackage: string;
    servicePackageOther: string | null;
    additionalRequirements: string | null;
    monthlyServiceFee: number | null;
    paymentDuePreference: string | null;
    paymentDueOther: string | null;
    declarationAccepted: boolean;
    popiaConsent: boolean;
    clientInitials: string;
    signedFullName: string;
    signedPosition: string | null;
    signatureImageUrl: string;
    signedAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    agreementSnapshot: string;
    status: string;
    reviewedByName: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    linkedOrganizationId: string | null;
}

const PLAN_PRESETS: Record<string, { maxUsers: number; maxClients: number | null; storageLimitGb: number }> = {
    starter: { maxUsers: 1, maxClients: 25, storageLimitGb: 5 },
    professional: { maxUsers: 5, maxClients: 250, storageLimitGb: 25 },
    custom: { maxUsers: 10, maxClients: null, storageLimitGb: 100 },
};

const packageToPlan = (pkg: string) => (pkg === 'starter' || pkg === 'professional' ? pkg : 'custom');

export default function SuperAdminSignupDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [reg, setReg] = useState<RegistrationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [emailWarning, setEmailWarning] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [activateForm, setActivateForm] = useState({
        organizationName: '',
        plan: 'starter',
        maxUsers: 1,
        maxClients: 25 as number | null,
        storageLimitGb: 5,
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
    });

    useEffect(() => {
        if (id) fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            const res = await api.get(`/admin/client-registrations/${id}`);
            const data: RegistrationDetail = res.data;
            setReg(data);
            const plan = packageToPlan(data.servicePackage);
            const preset = PLAN_PRESETS[plan];
            const [firstName, ...rest] = data.contactFullName.split(' ');
            setActivateForm({
                organizationName: data.companyName,
                plan,
                maxUsers: preset.maxUsers,
                maxClients: preset.maxClients,
                storageLimitGb: preset.storageLimitGb,
                adminFirstName: firstName || '',
                adminLastName: rest.join(' '),
                adminEmail: data.contactEmail,
            });
        } catch (err) {
            console.error('Failed to load registration', err);
            setError('Failed to load this sign-up');
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = (plan: string) => {
        const preset = PLAN_PRESETS[plan];
        setActivateForm(f => ({ ...f, plan, maxUsers: preset.maxUsers, maxClients: preset.maxClients, storageLimitGb: preset.storageLimitGb }));
    };

    const handleActivate = async () => {
        setBusy(true);
        setError('');
        setEmailWarning(null);
        try {
            const res = await api.post(`/admin/client-registrations/${id}/activate`, activateForm);
            if (res.data.emailWarning) setEmailWarning(res.data.emailWarning as string);
            await fetchDetail();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setError(axiosErr.response?.data?.error || 'Failed to activate this sign-up');
        } finally {
            setBusy(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) { setError('Please provide a reason for rejecting.'); return; }
        setBusy(true);
        setError('');
        try {
            await api.post(`/admin/client-registrations/${id}/reject`, { reason: rejectReason });
            await fetchDetail();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setError(axiosErr.response?.data?.error || 'Failed to reject this sign-up');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <main className="p-6 pt-16">
                <Spinner />
            </main>
        );
    }

    if (!reg) {
        return (
            <main className="p-6 pt-16">
                <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-4 rounded">{error || 'Sign-up not found'}</div>
            </main>
        );
    }

    return (
        <>
            <HelpButton
                title="Signup Detail"
                description="Review everything the client submitted and signed before activating their account."
                steps={[
                    'Check the submitted details and the signed agreement text below.',
                    'Adjust the organization name, plan and admin user details if needed, then Activate.',
                    'Activating creates the Organization and first admin User, and emails them their login and a temporary password.',
                ]}
            />

            <main className="p-6 pt-16">
                <div className="max-w-4xl mx-auto space-y-6">
                    <button onClick={() => navigate('/super-admin/signups')} className="text-sm text-[var(--muted)] hover:text-[var(--text)]">← Back to Signups</button>

                    {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded">{error}</div>}
                    {emailWarning && (
                        <div className="bg-amber-500/12 border border-amber-500/30 text-amber-300 p-3 rounded">
                            Account activated, but the welcome email was not sent: {emailWarning}
                            {' '}Set a password for this user directly from Super Admin &gt; Users, or fix email settings and use "Send Test Email" in Super Admin &gt; Settings to confirm it works.
                        </div>
                    )}

                    <div className="bg-[var(--surface)] rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl font-bold text-[var(--text)]">{reg.companyName} <span className="text-[var(--faint)] font-normal">· {reg.clientReferenceNumber}</span></h1>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${reg.status === 'pending' ? 'pill-amber' : reg.status === 'activated' ? 'pill-green' : 'pill-red'}`}>{reg.status}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-6">
                            <div><span className="text-[var(--faint)]">Contact:</span> {reg.contactFullName} ({reg.contactPosition || '—'})</div>
                            <div><span className="text-[var(--faint)]">Email:</span> {reg.contactEmail}</div>
                            <div><span className="text-[var(--faint)]">Mobile:</span> {reg.contactMobile}</div>
                            <div><span className="text-[var(--faint)]">WhatsApp:</span> {reg.contactWhatsApp || '—'}</div>
                            <div className="sm:col-span-2"><span className="text-[var(--faint)]">Address:</span> {reg.physicalAddress}</div>
                            <div><span className="text-[var(--faint)]">Package:</span> <span className="capitalize">{reg.servicePackage === 'other' ? reg.servicePackageOther : reg.servicePackage}</span></div>
                            <div><span className="text-[var(--faint)]">Monthly fee:</span> {reg.monthlyServiceFee != null ? `R${reg.monthlyServiceFee} / user / mo` : 'To be confirmed'}</div>
                            <div><span className="text-[var(--faint)]">Payment due:</span> {reg.paymentDuePreference === 'Other' ? reg.paymentDueOther : reg.paymentDuePreference}</div>
                            {reg.additionalRequirements && <div className="sm:col-span-2"><span className="text-[var(--faint)]">Requirements:</span> {reg.additionalRequirements}</div>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text)] mb-2">Signature</h2>
                                <div className="bg-white rounded border border-[var(--border)] p-2 inline-block">
                                    <img src={`${SERVER_ORIGIN}${reg.signatureImageUrl}`} alt="Signature" className="max-h-32" />
                                </div>
                                <p className="text-xs text-[var(--faint)] mt-2">
                                    Signed by {reg.signedFullName}{reg.signedPosition ? `, ${reg.signedPosition}` : ''} on {new Date(reg.signedAt).toLocaleString()}
                                </p>
                                <p className="text-xs text-[var(--faint)]">IP: {reg.ipAddress || '—'}</p>
                                <p className="text-xs text-[var(--faint)]">POPIA consent: {reg.popiaConsent ? 'Yes' : 'No'} · Initials: {reg.clientInitials}</p>
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text)] mb-2">Signed Agreement</h2>
                                <div className="bg-[var(--overlay-weak)] border border-[var(--border)] rounded p-3 text-xs whitespace-pre-wrap max-h-64 overflow-y-auto font-mono text-[var(--muted)]">
                                    {reg.agreementSnapshot}
                                </div>
                            </div>
                        </div>

                        {reg.status === 'pending' && (
                            <div className="border-t border-[var(--border)] pt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Activate</h2>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Organization Name</label>
                                            <input value={activateForm.organizationName} onChange={e => setActivateForm(f => ({ ...f, organizationName: e.target.value }))} className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Plan</label>
                                            <select value={activateForm.plan} onChange={e => handlePlanChange(e.target.value)} className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 text-sm">
                                                <option value="starter">Starter</option>
                                                <option value="professional">Professional</option>
                                                <option value="custom">Custom / Enterprise</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Max Users</label>
                                                <input type="number" min={1} value={activateForm.maxUsers} onChange={e => setActivateForm(f => ({ ...f, maxUsers: Number(e.target.value) }))} className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Max Clients</label>
                                                <input type="number" min={0} value={activateForm.maxClients ?? ''} placeholder="Unlimited" onChange={e => setActivateForm(f => ({ ...f, maxClients: e.target.value === '' ? null : Number(e.target.value) }))} className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Storage (GB)</label>
                                                <input type="number" min={1} value={activateForm.storageLimitGb} onChange={e => setActivateForm(f => ({ ...f, storageLimitGb: Number(e.target.value) }))} className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 text-sm" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Admin First Name</label>
                                                <input value={activateForm.adminFirstName} onChange={e => setActivateForm(f => ({ ...f, adminFirstName: e.target.value }))} className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Admin Last Name</label>
                                                <input value={activateForm.adminLastName} onChange={e => setActivateForm(f => ({ ...f, adminLastName: e.target.value }))} className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Admin Email (login)</label>
                                            <input type="email" value={activateForm.adminEmail} onChange={e => setActivateForm(f => ({ ...f, adminEmail: e.target.value }))} className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 text-sm" />
                                        </div>
                                        <button
                                            onClick={handleActivate}
                                            disabled={busy}
                                            className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded disabled:opacity-50"
                                        >
                                            {busy ? 'Activating...' : 'Activate & Send Login'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Reject</h2>
                                    <textarea
                                        rows={3}
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="Reason (kept internally, not emailed automatically)"
                                        className="w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded p-2 text-sm mb-3"
                                    />
                                    <button
                                        onClick={handleReject}
                                        disabled={busy}
                                        className="bg-[var(--overlay-med)] hover:bg-red-500/20 text-red-300 px-4 py-2 rounded disabled:opacity-50"
                                    >
                                        {busy ? 'Rejecting...' : 'Reject Signup'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {reg.status === 'activated' && (
                            <div className="border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
                                Activated by {reg.reviewedByName || '—'} on {reg.reviewedAt ? new Date(reg.reviewedAt).toLocaleString() : '—'}.
                            </div>
                        )}
                        {reg.status === 'rejected' && (
                            <div className="border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
                                Rejected by {reg.reviewedByName || '—'} on {reg.reviewedAt ? new Date(reg.reviewedAt).toLocaleString() : '—'}.
                                {reg.rejectionReason && <p className="mt-1">Reason: {reg.rejectionReason}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
