import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api, { SERVER_ORIGIN } from '../services/api';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

interface DashboardClient {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    idNumber: string | null;
    address: string | null;
    photoUrl: string | null;
    createdAt: string;
}

interface UpcomingEvent {
    id: string;
    title: string;
    eventType: string;
    startAt: string;
    location: string | null;
}

interface DocCategory {
    key: string;
    label: string;
    uploaded: boolean;
    count: number;
}

interface DocItem {
    id: string;
    fileName: string;
    documentType: string;
    fileUrl: string;
    uploadedAt: string;
}

interface ClaimItem {
    id: string;
    claimNumber: string;
    caseId: string;
    caseNumber: string;
    status: string;
    rafReference: string | null;
    amountRequested: number | null;
    amountAwarded: number | null;
    outstanding: number;
}

interface DashboardData {
    client: DashboardClient;
    upcomingEvents: UpcomingEvent[];
    documents: { categories: DocCategory[]; pendingCategories: string[]; all: DocItem[] };
    claims: { items: ClaimItem[]; totalRequested: number; totalAwarded: number; totalOutstanding: number };
    cases: { total: number; open: number; inProgress: number; critical: number; closed: number };
}

const EVENT_TYPE_META: Record<string, { label: string; icon: string }> = {
    appointment: { label: 'Appointment', icon: 'fa-calendar-check' },
    follow_up: { label: 'Follow-up', icon: 'fa-rotate-right' },
    court_date: { label: 'Court date', icon: 'fa-gavel' },
    medical_assessment: { label: 'Medical assessment', icon: 'fa-stethoscope' },
};

const DOC_ICONS: Record<string, string> = {
    raf_forms: 'fa-file-lines',
    police_reports: 'fa-shield-halved',
    medical: 'fa-stethoscope',
    financial: 'fa-money-check-dollar',
    identity: 'fa-id-card',
    litigation: 'fa-scale-balanced',
};

const money = (n: number | null | undefined) =>
    `R ${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ClientDetail() {
    const { id } = useParams<{ id: string }>();
    const { activeOrganization } = useAuth();
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [photoError, setPhotoError] = useState('');

    useEffect(() => {
        if (activeOrganization && id) fetchDashboard();
    }, [activeOrganization, id]);

    const fetchDashboard = async () => {
        try {
            const res = await api.get(`/clients/${id}/dashboard`);
            setData(res.data);
        } catch (err) {
            setError('Failed to load client data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;
        setUploading(true);
        setPhotoError('');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post(`/clients/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setData((prev) => prev ? { ...prev, client: { ...prev.client, photoUrl: `${res.data.photoUrl}?t=${Date.now()}` } } : prev);
        } catch (err) {
            const e2 = err as { response?: { data?: { error?: string } } };
            setPhotoError(e2.response?.data?.error || 'Upload failed. Use a JPG or PNG under 10MB.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            completed: 'pill-green',
            in_progress: 'pill-amber',
            critical: 'pill-red',
        };
        return colors[status] || 'pill-neutral';
    };

    const caseBadge = (label: string, count: number, pill: string) => (
        <div className="bg-[var(--surface)] rounded-lg shadow p-3 text-center border border-[var(--border)]">
            <p className="text-2xl font-bold">{count}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pill}`}>{label}</span>
        </div>
    );

    if (loading) {
        return (
            <main className="p-6 pt-16">
                <Spinner />
            </main>
        );
    }

    if (error || !data) {
        return (
            <main className="p-6 pt-16">
                <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-4 rounded">{error || 'Client not found'}</div>
            </main>
        );
    }

    const { client, upcomingEvents, documents, claims, cases } = data;
    const initials = `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`.toUpperCase() || '?';

    return (
        <>
            <HelpButton
                title="Client Dashboard"
                description="A single view of everything tied to this client — upcoming events, document checklist, and outstanding payments."
                steps={[
                    'Click the photo to upload or change this client\'s picture.',
                    'The document checklist shows which categories are pending so you know what to chase.',
                    'Outstanding payments totals the gap between requested and awarded amounts across every claim.',
                    'Full claim and document lists are further down the page.',
                ]}
            />

            <main className="p-6 pt-16 max-w-5xl mx-auto">
                    <div className="mb-6">
                        <Link to="/clients" className="text-[var(--brand-accent)] hover:underline">&larr; Back to Clients</Link>
                    </div>

                    {/* Header card */}
                    <div className="bg-[var(--surface)] rounded-lg shadow p-6 mb-6">
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            <button
                                onClick={() => fileRef.current?.click()}
                                title="Change profile picture"
                                className="relative w-20 h-20 flex-shrink-0"
                            >
                                <span
                                    className="block w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                                    style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-border)' }}
                                >
                                    {client.photoUrl ? (
                                        <img key={client.photoUrl} src={`${SERVER_ORIGIN}${client.photoUrl}`} alt={`${client.firstName} ${client.lastName}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-bold" style={{ color: 'var(--brand-accent)' }}>{initials}</span>
                                    )}
                                </span>
                                <span
                                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white"
                                    style={{ background: 'var(--brand)', border: '2px solid var(--surface)' }}
                                >
                                    <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'} text-xs`} />
                                </span>
                            </button>
                            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.bmp" className="hidden" onChange={handlePhotoChange} />

                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold text-[var(--text)] mb-1">{client.firstName} {client.lastName}</h1>
                                {photoError && <p className="text-xs pill-red inline-block px-2 py-1 rounded mb-2">{photoError}</p>}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[var(--muted)] mt-2">
                                    <div><i className="fa-solid fa-envelope w-4 mr-2 text-[var(--faint)]" />{client.email || '—'}</div>
                                    <div><i className="fa-solid fa-phone w-4 mr-2 text-[var(--faint)]" />{client.phone || '—'}</div>
                                    <div><i className="fa-solid fa-id-card w-4 mr-2 text-[var(--faint)]" />{client.idNumber || '—'}</div>
                                    <div><i className="fa-solid fa-location-dot w-4 mr-2 text-[var(--faint)]" />{client.address || '—'}</div>
                                    <div><i className="fa-solid fa-calendar w-4 mr-2 text-[var(--faint)]" />Client since {new Date(client.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="mt-4">
                                    <Link to={`/clients/${id}/edit`} className="bg-[var(--brand)] text-white px-4 py-2 rounded-md hover:bg-[var(--brand-hover)] text-sm">Edit Client</Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Case status strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {caseBadge('Open', cases.open, 'pill-green')}
                        {caseBadge('In Progress', cases.inProgress, 'pill-amber')}
                        {caseBadge('Critical', cases.critical, 'pill-red')}
                        {caseBadge('Closed', cases.closed, 'pill-neutral')}
                    </div>

                    {/* Overview cards */}
                    <div className="grid lg:grid-cols-3 gap-4 mb-6">
                        {/* Upcoming events */}
                        <div className="bg-[var(--surface)] rounded-lg shadow p-5 border border-[var(--border)]">
                            <h2 className="font-semibold mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-calendar-days text-[var(--brand-accent)]" /> Upcoming Events
                            </h2>
                            {upcomingEvents.length === 0 ? (
                                <p className="text-sm text-[var(--muted)]">No upcoming events for this client.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {upcomingEvents.map((ev) => {
                                        const meta = EVENT_TYPE_META[ev.eventType] || { label: ev.eventType, icon: 'fa-calendar' };
                                        return (
                                            <li key={ev.id} className="flex items-start gap-3 text-sm">
                                                <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)' }}>
                                                    <i className={`fa-solid ${meta.icon} text-xs`} style={{ color: 'var(--brand-accent)' }} />
                                                </span>
                                                <div>
                                                    <p className="font-medium">{ev.title}</p>
                                                    <p className="text-xs text-[var(--muted)]">
                                                        {new Date(ev.startAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        {ev.location ? ` · ${ev.location}` : ''}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                            <Link to="/calendar" className="text-xs text-[var(--brand-accent)] hover:underline mt-3 inline-block">Open Calendar →</Link>
                        </div>

                        {/* Document checklist */}
                        <div className="bg-[var(--surface)] rounded-lg shadow p-5 border border-[var(--border)]">
                            <h2 className="font-semibold mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-clipboard-check text-[var(--brand-accent)]" /> Documents
                            </h2>
                            <ul className="space-y-2">
                                {documents.categories.map((cat) => (
                                    <li key={cat.key} className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <i className={`fa-solid ${DOC_ICONS[cat.key] || 'fa-file'} text-xs text-[var(--faint)]`} />
                                            {cat.label}
                                        </span>
                                        {cat.uploaded ? (
                                            <span className="pill-green text-xs px-2 py-0.5 rounded-full"><i className="fa-solid fa-check text-[0.6rem] mr-1" />{cat.count}</span>
                                        ) : (
                                            <span className="pill-red text-xs px-2 py-0.5 rounded-full">Pending</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {documents.pendingCategories.length > 0 && (
                                <p className="text-xs text-[var(--muted)] mt-3">
                                    Pending: {documents.pendingCategories.join(', ')}
                                </p>
                            )}
                            <Link to={`/documents`} className="text-xs text-[var(--brand-accent)] hover:underline mt-3 inline-block">Upload a document →</Link>
                        </div>

                        {/* Outstanding payments */}
                        <div className="bg-[var(--surface)] rounded-lg shadow p-5 border border-[var(--border)]">
                            <h2 className="font-semibold mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-sack-dollar text-[var(--brand-accent)]" /> Outstanding Payments
                            </h2>
                            <p className="text-2xl font-bold" style={{ color: claims.totalOutstanding > 0 ? 'var(--brand-accent)' : 'var(--text)' }}>
                                {money(claims.totalOutstanding)}
                            </p>
                            <p className="text-xs text-[var(--muted)] mb-3">
                                {money(claims.totalAwarded)} awarded of {money(claims.totalRequested)} requested
                            </p>
                            {claims.items.filter((c) => c.outstanding > 0).slice(0, 3).map((c) => (
                                <div key={c.id} className="flex items-center justify-between text-sm py-1 border-t border-[var(--border)]">
                                    <Link to={`/claims/${c.id}/edit`} className="text-[var(--brand-accent)] hover:underline">{c.claimNumber}</Link>
                                    <span>{money(c.outstanding)}</span>
                                </div>
                            ))}
                            {claims.items.length === 0 && <p className="text-sm text-[var(--muted)]">No claims for this client yet.</p>}
                        </div>
                    </div>

                    {/* Claims Section */}
                    <div className="bg-[var(--surface)] rounded-lg shadow p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-[var(--text)]">All Claims</h2>
                            <Link to={`/claims/new?clientId=${id}`} className="text-[var(--brand-accent)] hover:underline">+ New Claim</Link>
                        </div>
                        {claims.items.length === 0 ? (
                            <p className="text-[var(--muted)]">No claims for this client.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[var(--border)]">
                                    <thead className="bg-[var(--overlay-weak)]">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Claim #</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Case</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Requested</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Awarded</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Outstanding</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {claims.items.map(claim => (
                                            <tr key={claim.id}>
                                                <td className="px-4 py-2"><Link to={`/claims/${claim.id}/edit`} className="text-[var(--brand-accent)] hover:underline">{claim.claimNumber}</Link></td>
                                                <td className="px-4 py-2">{claim.caseNumber}</td>
                                                <td className="px-4 py-2">{money(claim.amountRequested)}</td>
                                                <td className="px-4 py-2">{money(claim.amountAwarded)}</td>
                                                <td className="px-4 py-2">{money(claim.outstanding)}</td>
                                                <td className="px-4 py-2"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(claim.status)}`}>{claim.status.replace('_', ' ')}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Documents Section */}
                    <div className="bg-[var(--surface)] rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-[var(--text)]">All Documents</h2>
                            <Link to="/documents" className="text-[var(--brand-accent)] hover:underline">+ Upload Document</Link>
                        </div>
                        {documents.all.length === 0 ? (
                            <p className="text-[var(--muted)]">No documents for this client.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[var(--border)]">
                                    <thead className="bg-[var(--overlay-weak)]">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">File Name</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Uploaded</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted)] uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {documents.all.map(doc => (
                                            <tr key={doc.id}>
                                                <td className="px-4 py-2">{doc.fileName}</td>
                                                <td className="px-4 py-2">{doc.documentType}</td>
                                                <td className="px-4 py-2">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <a href={`${SERVER_ORIGIN}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-accent)] hover:text-[var(--text)]">View</a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
            </main>
        </>
    );
}
