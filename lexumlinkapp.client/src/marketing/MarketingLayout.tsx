import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { T, Logo } from './ui';
import ThemeToggle from '../components/ThemeToggle';

const NAV = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Services', to: '/services' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Contact', to: '/contact' },
];

function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
            style={
                scrolled
                    ? { background: 'var(--nav-bg)', backdropFilter: 'blur(18px)', borderBottom: `1px solid ${T.border}` }
                    : { background: 'transparent' }
            }
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-[72px]">
                <Link to="/" aria-label="LexumLink home">
                    <Logo />
                </Link>

                <div className="hidden md:flex items-center gap-9">
                    {NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className="text-xs tracking-[0.14em] uppercase font-medium transition-colors duration-200 relative group"
                            style={({ isActive }) => ({ color: isActive ? T.text : T.muted })}
                        >
                            {({ isActive }) => (
                                <>
                                    {item.label}
                                    <span
                                        className="absolute -bottom-1.5 left-0 h-px transition-all duration-300"
                                        style={{ width: isActive ? '100%' : '0%', background: T.violet }}
                                    />
                                    <span className="absolute -bottom-1.5 left-0 w-0 group-hover:w-full h-px transition-all duration-300" style={{ background: T.violet }} />
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Link
                        to="/signin"
                        className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold tracking-[0.1em] uppercase transition-colors duration-300"
                        style={{ color: T.muted }}
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/contact"
                        className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-full text-white text-xs font-semibold tracking-[0.08em] uppercase transition-all duration-300 hover:-translate-y-0.5"
                        style={{ background: T.brandGradient, boxShadow: '0 6px 22px rgba(94,0,6,0.40)' }}
                    >
                        Get Started
                    </Link>
                    <button
                        className="md:hidden text-xl leading-none"
                        style={{ color: T.text }}
                        onClick={() => setOpen((o) => !o)}
                        aria-label="Toggle menu"
                    >
                        <i className={open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'} />
                    </button>
                </div>
            </div>

            {open && (
                <div
                    className="md:hidden px-6 py-6 flex flex-col gap-4 animate-fade-in-up"
                    style={{ background: 'var(--nav-menu-bg)', backdropFilter: 'blur(18px)', borderBottom: `1px solid ${T.border}` }}
                >
                    {NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className="text-sm tracking-widest uppercase"
                            style={({ isActive }) => ({ color: isActive ? T.violetLight : T.muted })}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                    <div className="flex items-center gap-3 pt-2">
                        <Link to="/signin" className="text-sm tracking-widest uppercase" style={{ color: T.text }}>
                            Sign In →
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
            )}
        </nav>
    );
}

function Footer() {
    const year = new Date().getFullYear();
    const cols = [
        {
            title: 'Product',
            links: [
                { label: 'Services', to: '/services' },
                { label: 'Pricing', to: '/pricing' },
                { label: 'About', to: '/about' },
                { label: 'Contact', to: '/contact' },
            ],
        },
        {
            title: 'Platform',
            links: [
                { label: 'Client Management', to: '/services' },
                { label: 'Case Management', to: '/services' },
                { label: 'Document Vault', to: '/services' },
                { label: 'Dashboards', to: '/services' },
            ],
        },
        {
            title: 'Company',
            links: [
                { label: 'Our Story', to: '/about' },
                { label: 'Security', to: '/services' },
                { label: 'Privacy Policy', to: '/contact' },
                { label: 'Terms of Service', to: '/contact' },
            ],
        },
    ];

    return (
        <footer style={{ background: T.bg, borderTop: `1px solid ${T.border}` }} className="pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-16">
                    <div>
                        <Logo className="text-3xl" />
                        <p className="mt-4 text-sm leading-[1.7] max-w-[280px]" style={{ color: T.faint }}>
                            One intelligent platform that connects people, processes, and information — so every client and case is tracked from start to finish.
                        </p>
                        <div className="flex gap-3 mt-6">
                            {[
                                { icon: 'fa-brands fa-linkedin-in', label: 'LinkedIn' },
                                { icon: 'fa-brands fa-x-twitter', label: 'X' },
                                { icon: 'fa-brands fa-facebook-f', label: 'Facebook' },
                            ].map((s) => (
                                <a
                                    key={s.label}
                                    href="#"
                                    aria-label={s.label}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-300 hover:-translate-y-0.5 hover:text-[var(--text)]"
                                    style={{ border: `1px solid ${T.border}`, color: T.muted }}
                                >
                                    <i className={s.icon} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {cols.map((col) => (
                        <div key={col.title}>
                            <h4 className="text-xs tracking-[0.2em] uppercase mb-5" style={{ color: T.violetLight }}>
                                {col.title}
                            </h4>
                            <ul className="space-y-3">
                                {col.links.map((l) => (
                                    <li key={l.label}>
                                        <Link
                                            to={l.to}
                                            className="text-sm transition-colors duration-200 hover:text-[var(--text)]"
                                            style={{ color: T.faint }}
                                        >
                                            {l.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div
                    className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
                    style={{ borderTop: `1px solid ${T.border}`, color: T.faint }}
                >
                    <span>&copy; {year} Lexum Link (Pty) Ltd. All rights reserved.</span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#4ADE80', boxShadow: '0 0 8px rgba(74,222,128,0.6)' }} />
                        All systems operational
                    </span>
                </div>
            </div>
        </footer>
    );
}

export default function MarketingLayout() {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <div className="min-h-screen overflow-x-hidden" style={{ background: T.bg, color: T.text, fontFamily: "'DMSans', system-ui, sans-serif" }}>
            <style>{`
                html { scroll-behavior: smooth; }
                * { box-sizing: border-box; }
                .reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1); }
                .reveal-in { opacity: 1; transform: none; }
                @keyframes floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
                @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
                @keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
                @keyframes pulseGlow { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
            `}</style>
            <Navbar />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
