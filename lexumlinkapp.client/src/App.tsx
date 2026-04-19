import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OrganizationGuard } from './components/OrganizationGuard';
import { SuperAdminGuard } from './components/SuperAdminGaurd';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Cases from './pages/Cases';
import Claims from './pages/Claims';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import CreateUser from './pages/CreateUser';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import NewCase from './pages/NewCase';
import NewClaim from './pages/NewClaim';
import SuperAdminTickets from './pages/SuperAdminTickets';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <OrganizationGuard>
                                <Dashboard />
                            </OrganizationGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/clients" element={
                        <ProtectedRoute>
                            <OrganizationGuard>
                                <Clients />
                            </OrganizationGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/clients/:id" element={
                        <ProtectedRoute>
                            <OrganizationGuard>
                                <ClientDetail />
                            </OrganizationGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/cases" element={
                        <ProtectedRoute>
                            <OrganizationGuard>
                                <Cases />
                            </OrganizationGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/claims" element={
                        <ProtectedRoute>
                            <OrganizationGuard>
                                <Claims />
                            </OrganizationGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/documents" element={
                        <ProtectedRoute>
                            <OrganizationGuard>
                                <Documents />
                            </OrganizationGuard>
                        </ProtectedRoute>
                    } />
                    <Route path="/documents" element={
                        <ProtectedRoute>
                            <OrganizationGuard>
                                <Documents />
                            </OrganizationGuard>
                        </ProtectedRoute>
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