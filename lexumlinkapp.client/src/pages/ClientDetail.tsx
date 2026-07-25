import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../services/api';

interface Client {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber: string;
    address: string;
    createdAt: string;
}

interface Claim {
    id: string;
    claimNumber: string;
    status: string;
    rafReference: string;
    amountRequested: number;
    createdAt: string;
}

interface Document {
    id: string;
    fileName: string;
    documentType: string;
    fileUrl: string;
    uploadedAt: string;
}

export default function ClientDetail() {
    const { id } = useParams<{ id: string }>();
    const { activeOrganization } = useAuth();
    const [client, setClient] = useState<Client | null>(null);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activeOrganization && id) fetchClientData();
    }, [activeOrganization, id]);

    const fetchClientData = async () => {
        try {
            const [clientRes, claimsRes, docsRes] = await Promise.all([
                api.get(`/clients/${id}`),
                api.get(`/claims?clientId=${id}`),
                api.get(`/documents?clientId=${id}`),
            ]);
            setClient(clientRes.data);
            setClaims(claimsRes.data);
            setDocuments(docsRes.data);
        } catch (err) {
            setError('Failed to load client data');
            console.error(err);
        } finally {
            setLoading(false);
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

    if (loading) return <div className="p-6 text-center">Loading client details...</div>;
    if (error) return <div className="p-6 text-red-300">{error}</div>;
    if (!client) return <div className="p-6 text-center">Client not found</div>;

    return (
        <div className="p-6 bg-[var(--bg)] text-[var(--text)]">
            <div className="mb-6">
                <Link to="/clients" className="text-[var(--brand-accent)] hover:underline">&larr; Back to Clients</Link>
            </div>
            <div className="bg-[var(--surface)] rounded-lg shadow p-6 mb-6">
                <h1 className="text-2xl font-bold text-[var(--text)] mb-4">{client.firstName} {client.lastName}</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><span className="font-medium">Email:</span> {client.email}</div>
                    <div><span className="font-medium">Phone:</span> {client.phone}</div>
                    <div><span className="font-medium">ID Number:</span> {client.idNumber}</div>
                    <div><span className="font-medium">Address:</span> {client.address}</div>
                    <div><span className="font-medium">Member since:</span> {new Date(client.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="mt-4">
                    <Link to={`/clients/${id}/edit`} className="bg-[var(--brand)] text-white px-4 py-2 rounded-md hover:bg-[var(--brand-hover)]">Edit Client</Link>
                </div>
            </div>

            {/* Claims Section */}
            <div className="bg-[var(--surface)] rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[var(--text)]">Claims</h2>
                    <Link to={`/claims/new?clientId=${id}`} className="text-[var(--brand-accent)] hover:underline">+ New Claim</Link>
                </div>
                {claims.length === 0 ? (
                    <p className="text-[var(--muted)]">No claims for this client.</p>
                ) : (
                    <table className="min-w-full divide-y divide-[var(--border)]">
                        <thead className="bg-[var(--overlay-weak)]">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Claim #</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">RAF Ref</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)] uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {claims.map(claim => (
                                <tr key={claim.id}>
                                    <td className="px-4 py-2"><Link to={`/claims/${claim.id}`} className="text-[var(--brand-accent)] hover:underline">{claim.claimNumber}</Link></td>
                                    <td className="px-4 py-2">{claim.rafReference || '-'}</td>
                                    <td className="px-4 py-2">R {claim.amountRequested?.toLocaleString()}</td>
                                    <td className="px-4 py-2"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(claim.status)}`}>{claim.status.replace('_', ' ')}</span></td>
                                    <td className="px-4 py-2">{new Date(claim.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Documents Section */}
            <div className="bg-[var(--surface)] rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[var(--text)]">Documents</h2>
                    <Link to={`/documents/upload?clientId=${id}`} className="text-[var(--brand-accent)] hover:underline">+ Upload Document</Link>
                </div>
                {documents.length === 0 ? (
                    <p className="text-[var(--muted)]">No documents for this client.</p>
                ) : (
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
                            {documents.map(doc => (
                                <tr key={doc.id}>
                                    <td className="px-4 py-2">{doc.fileName}</td>
                                    <td className="px-4 py-2">{doc.documentType}</td>
                                    <td className="px-4 py-2">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 text-right">
                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-accent)] hover:text-[var(--text)] mr-2">View</a>
                                        <Link to={`/documents/${doc.id}`} className="text-blue-300 hover:text-blue-200">Details</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}