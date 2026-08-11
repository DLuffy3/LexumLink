import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import HelpButton from '../components/HelpButton';
import api, { SERVER_ORIGIN } from '../services/api';
import { motion } from 'framer-motion';
import Spinner from '../components/Spinner';

interface Client {
    id: string;
    firstName: string;
    lastName: string;
}

interface Document {
    id: string;
    fileName: string;
    documentType: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    clientName: string;
}

const tabs = [
    { key: 'raf_forms', label: 'RAF Forms' },
    { key: 'police_reports', label: 'Police Reports' },
    { key: 'medical', label: 'Medical' },
    { key: 'financial', label: 'Financial' },
    { key: 'identity', label: 'Identity' },
    { key: 'litigation', label: 'Litigation' },
];

export default function Documents() {
    const { activeOrganization } = useAuth();
    const [activeTab, setActiveTab] = useState('raf_forms');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (activeOrganization) {
            fetchDocuments();
            fetchClients();
        }
    }, [activeTab, activeOrganization]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/documents?documentType=${activeTab}`);
            setDocuments(res.data);
        } catch (err) {
            console.error('Failed to fetch documents', err);
            setError('Could not load documents.');
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedClientId || !selectedFile) {
            alert('Please select a client and a file.');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('clientId', selectedClientId);
        formData.append('documentType', activeTab);
        formData.append('file', selectedFile);
        try {
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setShowUploadModal(false);
            setSelectedClientId('');
            setSelectedFile(null);
            fetchDocuments();
        } catch (err) {
            console.error('Upload failed', err);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this document?')) {
            try {
                await api.delete(`/documents/${id}`);
                fetchDocuments();
            } catch (err) {
                console.error('Delete failed', err);
                alert('Delete failed');
            }
        }
    };

    const filteredDocuments = documents.filter(doc =>
        (doc.clientName && doc.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!activeOrganization) return <main className="p-6 pt-16"><Spinner /></main>;

    return (
        <>
            <HelpButton
                title="Documents"
                description="Supporting documents organised by category — RAF forms, police reports, medical, financial, identity and litigation."
                steps={[
                    'Use the tabs to filter by document type.',
                    'Click "Upload Document" to add a new file.',
                    'Select the client it belongs to and tag it with the right type.',
                ]}
                tips={['Larger files may take a moment to upload — wait for the confirmation before navigating away.']}
            />

            <main className="p-6 pt-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <h1 className="text-2xl font-bold text-[var(--text)]">Documents</h1>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search by client name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded px-3 py-2 w-full sm:w-64 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
                            />
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-md text-center whitespace-nowrap"
                            >
                                + Upload Document
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 border-b border-[var(--border)] mb-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.key
                                        ? 'bg-[var(--surface)] text-[var(--brand-accent)] border-t border-l border-r border-[var(--border)] -mb-px'
                                        : 'text-[var(--muted)] hover:text-[var(--text)]'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Spinner size={50} />
                        </div>
                    ) : error ? (
                        <div className="text-red-300 py-10">{error}</div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="text-center text-[var(--muted)] py-10">No documents found in this category.</div>
                    ) : (
                        <div className="bg-[var(--surface)] rounded-lg shadow overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--border)]">
                                <thead className="bg-[var(--overlay-weak)]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">File Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Uploaded</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {filteredDocuments.map(doc => (
                                        <tr key={doc.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <a href={`${SERVER_ORIGIN}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-accent)] hover:underline">
                                                    {doc.fileName}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{doc.clientName || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="text-red-300 hover:text-red-200"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-[var(--backdrop)] transition-opacity" onClick={() => setShowUploadModal(false)} />
                        <div className="bg-[var(--surface)] rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                            <div className="bg-[var(--surface)] px-4 pt-5 pb-4 sm:p-6">
                                <h3 className="text-lg font-medium text-[var(--text)] mb-4">Upload Document</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--muted)]">Client</label>
                                        <select
                                            value={selectedClientId}
                                            onChange={(e) => setSelectedClientId(e.target.value)}
                                            className="mt-1 block w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] rounded-md p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]"
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
                                        <label className="block text-sm font-medium text-[var(--muted)]">File</label>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="mt-1 block w-full"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                        />
                                    </div>
                                    <p className="text-xs text-[var(--muted)]">Allowed: PDF, images, Word, Excel (max 10MB)</p>
                                </div>
                            </div>
                            <div className="bg-[var(--overlay-weak)] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[var(--brand)] text-base font-medium text-white hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-ring)] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-[var(--border)] shadow-sm px-4 py-2 bg-[var(--overlay-weak)] text-base font-medium text-[var(--muted)] hover:bg-[var(--overlay-weak)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-ring)] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
