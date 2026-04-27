import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import Spinner from '../components/Spinner';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

interface Case {
    id: string;
    status: string;
}

interface Claim {
    id: string;
    status: string;
}

interface Stats {
    activeCases: number;
    pendingDocs: number;
    rafClaims: number;
    claimsByStatus: {
        completed: number;
        inProgress: number;
        critical: number;
    };
}

export default function Dashboard() {
    const { activeOrganization } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [stats, setStats] = useState<Stats>({
        activeCases: 0,
        pendingDocs: 0,
        rafClaims: 0,
        claimsByStatus: { completed: 0, inProgress: 0, critical: 0 },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activeOrganization) fetchDashboardData();
    }, [activeOrganization]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch cases
            let cases: Case[] = [];
            try {
                const casesRes = await api.get('/cases');
                cases = casesRes.data;
            } catch (err) {
                console.warn('Failed to fetch cases', err);
            }
            const activeCasesCount = cases.filter(c => c.status !== 'closed').length;

            // Fetch claims
            let claims: Claim[] = [];
            try {
                const claimsRes = await api.get('/claims');
                claims = claimsRes.data;
            } catch (err) {
                console.warn('Failed to fetch claims', err);
            }
            const rafClaimsCount = claims.length;
            const claimsByStatus = {
                completed: claims.filter(c => c.status === 'completed').length,
                inProgress: claims.filter(c => c.status === 'in_progress').length,
                critical: claims.filter(c => c.status === 'critical').length,
            };

            // For pending documents, we might not have an endpoint. Set to 0 or fetch if available.
            let pendingDocsCount = 0;
            try {
                const docsRes = await api.get('/documents');
                // If documents have a status field, filter. Otherwise, count all.
                pendingDocsCount = docsRes.data.length;
            } catch (err) {
                console.warn('Failed to fetch documents', err);
            }

            setStats({
                activeCases: activeCasesCount,
                pendingDocs: pendingDocsCount,
                rafClaims: rafClaimsCount,
                claimsByStatus,
            });
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
            setError('Unable to load dashboard data. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const pieData = [
        { name: 'Completed', value: stats.claimsByStatus.completed },
        { name: 'In Progress', value: stats.claimsByStatus.inProgress },
        { name: 'Critical', value: stats.claimsByStatus.critical },
    ].filter(item => item.value > 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                <div className="fixed top-4 left-4 z-30">
                    <button onClick={toggleSidebar} className="p-2 rounded-md bg-white shadow-md text-gray-500 hover:text-gray-700 focus:outline-none">
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
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spinner size={50} />
                            </div>
                        ) : error ? (
                            <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 hover:shadow-md transition-all">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-red-100 rounded-full">
                                                <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-gray-500">Active Cases</p>
                                                <p className="text-2xl font-bold text-gray-800">{stats.activeCases}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500 hover:shadow-md transition-all">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-yellow-100 rounded-full">
                                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-gray-500">Total Documents</p>
                                                <p className="text-2xl font-bold text-gray-800">{stats.pendingDocs}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-md transition-all">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-blue-100 rounded-full">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-gray-500">RAF Claims</p>
                                                <p className="text-2xl font-bold text-gray-800">{stats.rafClaims}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                    <div className="bg-white rounded-lg shadow p-6">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4">Claims Status</h3>
                                        {pieData.length > 0 ? (
                                            <div className="flex justify-center w-full py-4">
                                                {/* @ts-expect-error - recharts types incompatible with React 19 */}
                                                <PieChart width={280} height={280}>
                                                    {/* @ts-expect-error - recharts types incompatible with React 19 */}
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={40} 
                                                        outerRadius={90}
                                                        labelLine={false}
                                                        label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {pieData.map((_entry, index) => (
                                                            /* @ts-expect-error - recharts types incompatible with React 19 */
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    {/* @ts-expect-error - recharts types incompatible with React 19 */}
                                                    <Legend verticalAlign="bottom" height={36} />
                                                </PieChart>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-500">No claim data available</div>
                                        )}
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-6">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4">Calendar</h3>
                                        <Calendar
                                            onChange={(value) => setSelectedDate(value as Date)}
                                            value={selectedDate}
                                            className="rounded-md border-0"
                                        />
                                        <div className="mt-4">
                                            <h4 className="font-medium text-gray-700">Upcoming / Scheduled</h4>
                                            <p className="text-sm text-gray-500">No upcoming tasks</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h3>
                                    <p className="text-gray-500">No recent activity</p>
                                </div>
                            </>
                        )}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}