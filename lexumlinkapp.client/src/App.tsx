import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { SidebarProvider } from './context/SidebarProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OrganizationGuard } from './components/OrganizationGuard';
import { SuperAdminGuard } from './components/SuperAdminGaurd';
import { Suspense, lazy } from 'react';
import Spinner from './components/Spinner';
import MarketingLayout from './marketing/MarketingLayout';
import AppLayout from './layouts/AppLayout';
import Home from './marketing/pages/Home';
import About from './marketing/pages/About';
import Services from './marketing/pages/Services';
import Pricing from './marketing/pages/Pricing';
import Contact from './marketing/pages/Contact';
import SignIn from './pages/SignIn';
import ClientDetail from './pages/ClientDetail';
import Settings from './pages/Settings';
import CreateUser from './pages/CreateUser';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import NewCase from './pages/NewCase';
import NewClaim from './pages/NewClaim';
import SuperAdminTickets from './pages/SuperAdminTickets';
import SuperAdminUsers from './pages/SuperAdminUsers';
import SuperAdminEditUser from './pages/SuperAdminEditUser';
import SuperAdminOrganizations from './pages/SuperAdminOrganizations';
import SuperAdminNewOrganization from './pages/SuperAdminNewOrganization';
import SuperAdminEditOrganization from './pages/SuperAdminEditOrganization';
import SuperAdminSettings from './pages/SuperAdminSettings';
import EditClient from './pages/EditClient';
import EditCase from './pages/EditCase';
import EditClaim from './pages/EditClaim';
import './App.css';

function App() {
    const Dashboard = lazy(() => import('./pages/Dashboard'));
    const CalendarPage = lazy(() => import('./pages/Calendar'));
    const Clients = lazy(() => import('./pages/Clients'));
    const Cases = lazy(() => import('./pages/Cases'));
    const Claims = lazy(() => import('./pages/Claims'));
    const Documents = lazy(() => import('./pages/Documents'));
    const Guide = lazy(() => import('./pages/Guide'));
    return (
        <BrowserRouter>
            <AuthProvider>
            <SidebarProvider>
                <Routes>
                    <Route element={<MarketingLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/contact" element={<Contact />} />
                    </Route>
                    <Route path="/signin" element={<SignIn />} />

                    {/* All authenticated pages share one persistent Sidebar via AppLayout,
                        so it never unmounts/remounts (and re-animates) between pages. */}
                    <Route element={<AppLayout />}>
                        <Route path="/dashboard" element={
                            <Suspense fallback={<Spinner/>}>
                              <ProtectedRoute>
                                <OrganizationGuard>
                                    <Dashboard />
                                </OrganizationGuard>
                              </ProtectedRoute>
                            </Suspense>
                        } />
                        <Route path="/calendar" element={
                            <Suspense fallback={<Spinner />}>
                              <ProtectedRoute>
                                <OrganizationGuard>
                                    <CalendarPage />
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
                        <Route path="/guide" element={
                            <Suspense fallback={<Spinner />}>
                                <ProtectedRoute>
                                    <OrganizationGuard>
                                        <Guide />
                                    </OrganizationGuard>
                                </ProtectedRoute>
                            </Suspense>
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
                        <Route path="/super-admin/users" element={
                            <ProtectedRoute>
                                <SuperAdminGuard>
                                    <SuperAdminUsers />
                                </SuperAdminGuard>
                            </ProtectedRoute>
                        } />
                        <Route path="/super-admin/users/:id/edit" element={
                            <ProtectedRoute>
                                <SuperAdminGuard>
                                    <SuperAdminEditUser />
                                </SuperAdminGuard>
                            </ProtectedRoute>
                        } />
                        <Route path="/super-admin/organizations" element={
                            <ProtectedRoute>
                                <SuperAdminGuard>
                                    <SuperAdminOrganizations />
                                </SuperAdminGuard>
                            </ProtectedRoute>
                        } />
                        <Route path="/super-admin/organizations/new" element={
                            <ProtectedRoute>
                                <SuperAdminGuard>
                                    <SuperAdminNewOrganization />
                                </SuperAdminGuard>
                            </ProtectedRoute>
                        } />
                        <Route path="/super-admin/organizations/:id/edit" element={
                            <ProtectedRoute>
                                <SuperAdminGuard>
                                    <SuperAdminEditOrganization />
                                </SuperAdminGuard>
                            </ProtectedRoute>
                        } />
                        <Route path="/super-admin/settings" element={
                            <ProtectedRoute>
                                <SuperAdminGuard>
                                    <SuperAdminSettings />
                                </SuperAdminGuard>
                            </ProtectedRoute>
                        } />
                        <Route path="/clients/:id/edit" element={
                            <ProtectedRoute>
                                <OrganizationGuard>
                                    <EditClient />
                                </OrganizationGuard>
                            </ProtectedRoute>
                        } />
                        <Route path="/cases/:id/edit" element={
                            <ProtectedRoute>
                                <OrganizationGuard>
                                    <EditCase />
                                </OrganizationGuard>
                            </ProtectedRoute>
                        } />
                        <Route path="/claims/:id/edit" element={
                            <ProtectedRoute>
                                <OrganizationGuard>
                                    <EditClaim />
                                </OrganizationGuard>
                            </ProtectedRoute>
                        } />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </SidebarProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
