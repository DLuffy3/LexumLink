import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import { motion } from 'framer-motion';
import api, { SERVER_ORIGIN } from '../services/api';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../theme/useTheme';
import logoDark from '../assets/logo-dark.svg';
import logoLight from '../assets/logo-light.svg';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Calendar', href: '/calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Clients', href: '/clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Cases', href: '/cases', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Claims', href: '/claims', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { name: 'Documents', href: '/documents', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
    { name: 'Settings', href: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { name: 'Guide', href: '/guide', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
];

export default function Sidebar() {
    const { user, activeOrganization, signOut } = useAuth();
    const { sidebarOpen, toggleSidebar } = useSidebar();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [avatarError, setAvatarError] = useState('');

    useEffect(() => {
        let cancelled = false;
        api.get('/profile/me')
            .then((r) => { if (!cancelled) setAvatarUrl(r.data.avatarUrl ?? null); })
            .catch(() => { });
        return () => { cancelled = true; };
    }, []);

    const handleSignOut = () => {
        signOut();
        navigate('/signin');
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setAvatarError('');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            // Cache-bust so the browser reloads the new image instead of the cached one.
            setAvatarUrl(res.data.avatarUrl ? `${res.data.avatarUrl}?t=${Date.now()}` : null);
        } catch (err) {
            const e2 = err as { response?: { data?: { error?: string } } };
            setAvatarError(e2.response?.data?.error || 'Upload failed. Use a JPG or PNG under 10MB.');
            console.error('Avatar upload failed', err);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const initials = `${(user?.firstName?.[0] || '').toUpperCase()}${(user?.lastName?.[0] || '').toUpperCase()}` || '?';
    const navItemClass = (active: boolean) =>
        `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${active ? 'bg-[var(--brand-soft)] text-[var(--brand-accent)]' : 'text-[var(--muted)] hover:bg-[var(--overlay-weak)] hover:text-[var(--text)]'}`;
    // While inside the Super Admin area, keep the sidebar focused on just those pages
    // instead of mixing in the regular practice-management nav.
    const inSuperAdminArea = location.pathname.startsWith('/super-admin') || location.pathname.startsWith('/admin');

    return (
        <motion.aside
            initial={{ x: -280 }}
            animate={{ x: sidebarOpen ? 0 : -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 left-0 z-40 w-64 h-screen bg-[var(--bg2)] border-r border-[var(--border)]"
        >
            <div className="flex flex-col h-full">
                {/* Top: profile */}
                <div className="p-4 border-b border-[var(--border)]">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => fileRef.current?.click()}
                                title="Change profile picture"
                                className="relative w-11 h-11 flex-shrink-0"
                            >
                                <span
                                    className="block w-11 h-11 rounded-full overflow-hidden flex items-center justify-center"
                                    style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-border)' }}
                                >
                                    {avatarUrl ? (
                                        <img key={avatarUrl} src={`${SERVER_ORIGIN}${avatarUrl}`} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold" style={{ color: 'var(--brand-accent)' }}>{initials}</span>
                                    )}
                                </span>
                                <span
                                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white z-10"
                                    style={{ background: 'var(--brand)', border: '2px solid var(--bg2)' }}
                                >
                                    <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'}`} style={{ fontSize: 8 }} />
                                </span>
                            </button>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--text)] truncate">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-[var(--faint)] truncate">{activeOrganization?.name || 'No organisation'}</p>
                            </div>
                        </div>
                        <button onClick={toggleSidebar} className="text-[var(--muted)] hover:text-[var(--text)] flex-shrink-0" aria-label="Collapse sidebar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.bmp" className="hidden" onChange={handleAvatarChange} />
                    {avatarError && <p className="mt-2 text-xs pill-red px-2 py-1 rounded">{avatarError}</p>}
                </div>

                {/* Nav */}
                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="px-2 space-y-1">
                        {!inSuperAdminArea && navigation.map((item) => (
                            <Link key={item.name} to={item.href} className={navItemClass(location.pathname === item.href)}>
                                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                </svg>
                                {item.name}
                            </Link>
                        ))}
                        {user?.isSuperAdmin && (
                            <>
                                <p className={`px-2 pb-1 text-xs font-semibold tracking-wide uppercase text-[var(--faint)] ${inSuperAdminArea ? '' : 'pt-4'}`}>Super Admin</p>
                                <Link to="/super-admin" className={navItemClass(location.pathname === '/super-admin')}>
                                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Overview
                                </Link>
                                <Link to="/super-admin/users" className={navItemClass(location.pathname.startsWith('/super-admin/users'))}>
                                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Users
                                </Link>
                                <Link to="/super-admin/organizations" className={navItemClass(location.pathname.startsWith('/super-admin/organizations'))}>
                                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9h.01M9 12h.01M9 15h.01" />
                                    </svg>
                                    Organizations
                                </Link>
                                <Link to="/admin/tickets" className={navItemClass(location.pathname === '/admin/tickets')}>
                                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                                    </svg>
                                    Tickets
                                </Link>
                                <Link to="/super-admin/settings" className={navItemClass(location.pathname === '/super-admin/settings')}>
                                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    </svg>
                                    Settings
                                </Link>
                            </>
                        )}
                    </nav>
                </div>

                {/* Bottom: logo + theme + logout */}
                <div className="p-4 border-t border-[var(--border)] flex flex-col items-start gap-3">
                    <Link to="/" aria-label="LexumLink home">
                        <img src={theme === 'dark' ? logoDark : logoLight} alt="LexumLink — Connecting Law. Simplifying Practice." className="h-16 w-auto object-contain object-left" />
                    </Link>
                    <div className="flex items-center gap-2 self-end">
                        <ThemeToggle />
                        <button onClick={handleSignOut} title="Sign out" className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--brand-accent)] hover:text-[var(--text)] hover:bg-[var(--overlay-weak)]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </motion.aside>
    );
}
