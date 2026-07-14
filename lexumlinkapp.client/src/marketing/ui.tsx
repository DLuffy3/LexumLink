import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// ─── Design tokens (burgundy / cream brand) ───────────────────────────────────

export const T = {
    bg: 'var(--bg)',
    bg2: 'var(--bg2)',
    panel: 'var(--surface)',
    panel2: 'var(--surface2)',
    border: 'var(--border)',
    borderStrong: 'var(--brand-border)',
    violet: 'var(--brand-accent)',
    violetLight: 'var(--brand-accent)',
    indigo: 'var(--brand)',
    text: 'var(--text)',
    muted: 'var(--muted)',
    faint: 'var(--faint)',
    // Fill gradient for buttons/badges (white text on top); flips-per-mode text gradient for clipped headings/logo.
    brandGradient: 'var(--grad-fill)',
    textGradient: 'var(--grad-text)',
} as const;

// ─── Scroll-reveal (no external deps) ─────────────────────────────────────────

export function Reveal({
    children,
    delay = 0,
    className = '',
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setShown(true);
                    io.disconnect();
                }
            },
            { threshold: 0.12 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`reveal ${shown ? 'reveal-in' : ''} ${className}`}
            style={{ transitionDelay: `${delay}s` }}
        >
            {children}
        </div>
    );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <span className="block w-8 h-px" style={{ background: T.violet }} />
            <span
                className="text-xs tracking-[0.25em] uppercase font-medium"
                style={{ color: T.violetLight }}
            >
                {children}
            </span>
        </div>
    );
}

export function SectionTitle({
    children,
    center = false,
}: {
    children: React.ReactNode;
    center?: boolean;
}) {
    return (
        <h2
            className={`font-['Grifter'] text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight ${
                center ? 'text-center' : ''
            }`}
            style={{ color: T.text }}
        >
            {children}
        </h2>
    );
}

export function Accent({ children }: { children: React.ReactNode }) {
    return (
        <span
            style={{
                background: T.textGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}
        >
            {children}
        </span>
    );
}

export function PrimaryButton({
    children,
    to,
    href,
    className = '',
}: {
    children: React.ReactNode;
    to?: string;
    href?: string;
    className?: string;
}) {
    const cls =
        `group inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5 ${className}`;
    const style: React.CSSProperties = {
        background: T.brandGradient,
        boxShadow: '0 8px 30px rgba(94,0,6,0.40)',
    };
    const inner = (
        <>
            {children}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform duration-300 group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
        </>
    );
    if (to) return <Link to={to} className={cls} style={style}>{inner}</Link>;
    return <a href={href} className={cls} style={style}>{inner}</a>;
}

export function GhostButton({
    children,
    to,
    href,
    className = '',
}: {
    children: React.ReactNode;
    to?: string;
    href?: string;
    className?: string;
}) {
    const cls =
        `inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-medium text-sm tracking-wide transition-all duration-300 ${className}`;
    const style: React.CSSProperties = {
        border: `1px solid ${T.border}`,
        color: T.text,
        background: 'var(--overlay-weak)',
    };
    if (to) return <Link to={to} className={cls} style={style}>{children}</Link>;
    return <a href={href} className={cls} style={style}>{children}</a>;
}

export function Logo({ className = 'text-2xl' }: { className?: string }) {
    return (
        <span className={`font-['Mooxy'] font-black tracking-tight ${className}`}>
            <span
                style={{
                    background: T.textGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}
            >
                Lexum
            </span>
            <span style={{ color: T.text }}>Link</span>
        </span>
    );
}

export function PageHero({
    label,
    title,
    subtitle,
}: {
    label: string;
    title: React.ReactNode;
    subtitle: string;
}) {
    return (
        <section className="relative pt-40 pb-20 overflow-hidden" style={{ background: T.bg }}>
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, var(--glow-1) 0%, transparent 60%)` }}
            />
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px)',
                    backgroundSize: '72px 72px',
                    maskImage: 'radial-gradient(ellipse 60% 70% at 50% 20%,black,transparent)',
                    WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 50% 20%,black,transparent)',
                }}
            />
            <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10 text-center">
                <div className="flex justify-center mb-4">
                    <SectionLabel>{label}</SectionLabel>
                </div>
                <h1 className="font-['Grifter'] text-5xl md:text-6xl font-black leading-[1.05] tracking-tight" style={{ color: T.text }}>
                    {title}
                </h1>
                <p className="mt-6 text-lg leading-[1.7] max-w-2xl mx-auto" style={{ color: T.muted }}>
                    {subtitle}
                </p>
            </div>
        </section>
    );
}

// Soft glowing orb background used across sections
export function GlowField() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
                className="absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full blur-[120px]"
                style={{ background: 'radial-gradient(circle,var(--glow-1),transparent 70%)' }}
            />
            <div
                className="absolute bottom-[-10rem] left-[-8rem] w-[460px] h-[460px] rounded-full blur-[120px]"
                style={{ background: 'radial-gradient(circle,var(--glow-2),transparent 70%)' }}
            />
        </div>
    );
}
