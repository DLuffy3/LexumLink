import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OrganizationGuard } from './components/OrganizationGuard';
import { SuperAdminGuard } from './components/SuperAdminGaurd';
import { Suspense, lazy } from 'react';
import Spinner from './components/Spinner';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import ClientDetail from './pages/ClientDetail';
import Settings from './pages/Settings';
import CreateUser from './pages/CreateUser';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import NewCase from './pages/NewCase';
import NewClaim from './pages/NewClaim';
import SuperAdminTickets from './pages/SuperAdminTickets';
import './App.css';

function App() {
    const Dashboard = lazy(() => import('./pages/Dashboard'));
    const Clients = lazy(() => import('./pages/Clients'));
    const Cases = lazy(() => import('./pages/Cases'));
    const Claims = lazy(() => import('./pages/Claims'));
    const Documents = lazy(() => import('./pages/Documents'));
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/dashboard" element={
                        <Suspense fallback={<Spinner/>}>
                          <ProtectedRoute>
                            <OrganizationGuard>
                                <Dashboard />
                            </OrganizationGuard>
                          </ProtectedRoute>
                        </Suspense>
                    } />
                    <Route path="/clients" element={
                        <Suspense fallback={<Spinner />}>
                            <ProtectedRoute>
                                <OrganizationGuard>
                                    <Clients />
                                </OrganizationGuard>
                            </ProtectedRoute>
                        </Suspense>
                    } />
                    <Route path="/clients/:id" element={
                        <ProtectedRoute>
                            <OrganizationGuard>
                                <ClientDetail />
                            </OrganizationGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/cases" element={
                        <Suspense fallback={<Spinner />}>
                            <ProtectedRoute>
                                <OrganizationGuard>
                                    <Cases />
                                </OrganizationGuard>
                            </ProtectedRoute>
                        </Suspense>
                    } />
                    <Route path="/claims" element={
                        <Suspense fallback={<Spinner />}>
                            <ProtectedRoute>
                                <OrganizationGuard>
                                    <Claims />
                                </OrganizationGuard>
                            </ProtectedRoute>
                        </Suspense>
                    } />
                    <Route path="/documents" element={
                        <Suspense fallback={<Spinner />}>
                            <ProtectedRoute>
                                <OrganizationGuard>
                                    <Documents />
                                </OrganizationGuard>
                            </ProtectedRoute>
                        </Suspense>
                    } />
                    <Route path="/settings" element={
                        <ProtectedRoute>
                            <OrganizationGuard>
                                <Settings />
                            </OrganizationGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/users/new" element={
                        <ProtectedRoute>
                            <SuperAdminGuard>
                                <CreateUser />
                            </SuperAdminGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/super-admin" element={
                        <ProtectedRoute>
                            <SuperAdminGuard>
                                <SuperAdminDashboard />
                            </SuperAdminGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/cases/new" element={
                        <ProtectedRoute>
                            <OrganizationGuard>
                                <NewCase />
                            </OrganizationGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/claims/new" element={
                        <ProtectedRoute>
                            <OrganizationGuard>
                                <NewClaim />
                            </OrganizationGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/tickets" element={
                        <ProtectedRoute>
                            <SuperAdminGuard>
                                <SuperAdminTickets />
                            </SuperAdminGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;