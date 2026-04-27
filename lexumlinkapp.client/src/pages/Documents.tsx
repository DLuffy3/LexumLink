import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
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
    const [sidebarOpen, setSidebarOpen] = useState(true);
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

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const filteredDocuments = documents.filter(doc =>
        (doc.clientName && doc.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!activeOrganization) return <div className="p-6">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                <div className="fixed top-4 left-4 z-30">
                    <button onClick={toggleSidebar} className="p-2 rounded-md bg-white shadow-md">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                <main className="p-6 pt-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full"
                    >
                        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                            <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Search by client name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="border rounded px-3 py-2 w-64"
                                />
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800"
                                >
                                    + Upload Document
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2 border-b mb-6">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.key
                                            ? 'bg-white text-red-700 border-t border-l border-r border-gray-200 -mb-px'
                                            : 'text-gray-500 hover:text-gray-700'
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
                            <div className="text-red-600 py-10">{error}</div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">No documents found in this category.</div>
                        ) : (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredDocuments.map(doc => (
                                            <tr key={doc.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline">
                                                        {doc.fileName}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{doc.clientName || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => handleDelete(doc.id)}
                                                        className="text-red-600 hover:text-red-800"
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
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUploadModal(false)} />
                        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Client</label>
                                        <select
                                            value={selectedClientId}
                                            onChange={(e) => setSelectedClientId(e.target.value)}
                                            className="mt-1 block w-full border rounded-md p-2"
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
                                        <label className="block text-sm font-medium text-gray-700">File</label>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="mt-1 block w-full"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Allowed: PDF, images, Word, Excel (max 10MB)</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-700 text-base font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}