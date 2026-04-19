import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';

interface Document {
    id: string;
    fileName: string;
    documentType: string;
    clientId: string;
    clientName?: string;
    caseId?: string;
    caseNumber?: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: string;
}

export default function Documents() {
    const { activeOrganization } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        if (activeOrganization) fetchDocuments();
    }, [activeOrganization]);

    const fetchDocuments = async () => {
        try {
            const res = await api.get('/documents');
            setDocuments(res.data);
        } catch (err) {
            console.error('Failed to fetch documents', err);
            // Mock data for development
            setDocuments([
                {
                    id: '1',
                    fileName: 'SAPS_Report_123.pdf',
                    documentType: 'police_report',
                    clientId: '101',
                    clientName: 'John Doe',
                    caseId: '1',
                    caseNumber: 'C-2024-001',
                    fileUrl: '#',
                    fileSize: 1024000,
                    uploadedAt: '2024-01-20T10:00:00Z',
                },
                {
                    id: '2',
                    fileName: 'Medical_Records_Smith.pdf',
                    documentType: 'medical',
                    clientId: '102',
                    clientName: 'Jane Smith',
                    caseId: '2',
                    caseNumber: 'C-2024-002',
                    fileUrl: '#',
                    fileSize: 2048000,
                    uploadedAt: '2024-02-25T14:30:00Z',
                },
                {
                    id: '3',
                    fileName: 'RAF_Claim_Form.pdf',
                    documentType: 'raf_form',
                    clientId: '101',
                    clientName: 'John Doe',
                    caseId: '1',
                    caseNumber: 'C-2024-001',
                    fileUrl: '#',
                    fileSize: 512000,
                    uploadedAt: '2024-01-18T09:15:00Z',
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const documentTypeLabels: Record<string, string> = {
        raf_form: 'RAF Form',
        police_report: 'Police Report',
        medical: 'Medical Record',
        financial: 'Financial Document',
        identity: 'Identity Document',
        litigation: 'Litigation Document',
    };

    const filteredDocuments = filterType === 'all'
        ? documents
        : documents.filter(doc => doc.documentType === filterType);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (loading) return <div className="p-6">Loading documents...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Main content */}
            <div>
                {/* Top toggle button */}
                <div className="fixed top-4 left-4 z-30">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-md bg-white shadow-md text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
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
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
                            <Link to="/documents/upload" className="bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800">
                                Upload Document
                            </Link>
                        </div>

                        {/* Filter tabs */}
                        <div className="mb-6 flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterType === 'all'
                                        ? 'bg-red-700 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                All
                            </button>
                            {Object.entries(documentTypeLabels).map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setFilterType(value)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterType === value
                                            ? 'bg-red-700 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredDocuments.map((doc) => (
                                        <tr key={doc.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link to={`/documents/${doc.id}`} className="text-red-700 hover:underline">
                                                    {doc.fileName}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {documentTypeLabels[doc.documentType] || doc.documentType}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {doc.clientName || doc.clientId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {doc.caseNumber || (doc.caseId ? `Case ${doc.caseId}` : '-')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {formatFileSize(doc.fileSize)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                >
                                                    View
                                                </a>
                                                <Link to={`/documents/${doc.id}/edit`} className="text-gray-600 hover:text-gray-900">
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredDocuments.length === 0 && (
                                <div className="p-6 text-center text-gray-500">
                                    No documents found. Click "Upload Document" to add one.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}