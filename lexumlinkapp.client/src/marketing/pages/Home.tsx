import { Link } from 'react-router-dom';
import { T, Reveal, SectionLabel, SectionTitle, Accent, PrimaryButton, GhostButton, GlowField } from '../ui';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRUST = ['Attorneys', 'RAF Consultants', 'Claims Admins', 'Medical-Legal', 'Insurers'];

const FEATURES = [
    { icon: '👤', title: 'Secure Client Management', desc: 'Every client profile — details, contacts, history, documents — in one secure, searchable place.' },
    { icon: '📂', title: 'Case Management', desc: 'Open, assign, monitor, and close cases with full visibility across every stage of the lifecycle.' },
    { icon: '📄', title: 'Document Management', desc: 'Upload and organise medical records, SAPS reports, and legal files against each client profile.' },
    { icon: '🔄', title: 'Workflow Tracking', desc: 'Guide each case through defined stages so no step — from registration to settlement — is missed.' },
    { icon: '⏰', title: 'Tasks & Reminders', desc: 'Automated reminders for follow-ups, deadlines, court dates, and medical assessments.' },
    { icon: '📊', title: 'Dashboards & Reporting', desc: 'Track clients, active cases, pending tasks, and performance from a single live dashboard.' },
];

const STEPS = [
    { num: '01', title: 'Register the client', desc: 'Capture client details and open the file in minutes.' },
    { num: '02', title: 'Build the case', desc: 'Attach documents, assign a handler, and set the workflow.' },
    { num: '03', title: 'Track to settlement', desc: 'Monitor progress, hit every deadline, and close with confidence.' },
];

const CASE_ROWS = [
    { name: 'Ndlovu — RAF Claim', stage: 'Case Submitted', tone: '#8B7CF6' },
    { name: 'Botha — Personal Injury', stage: 'Documents Collected', tone: '#4ADE80' },
    { name: 'Mokoena — Urgent', stage: 'Review in Progress', tone: '#FBBF24' },
    { name: 'Dlamini — Medical Claim', stage: 'Consultation Done', tone: '#60A5FA' },
];

// ─── Hero mockup (matches concept dashboard card) ─────────────────────────────

function DashboardMockup() {
    return (
        <div
            className="relative rounded-2xl p-5 overflow-hidden"
            style={{ background: `linear-gradient(150deg,${T.panel2},${T.panel})`, border: `1px solid ${T.border}`, boxShadow: '0 40px 120px rgba(0,0,0,0.55)' }}
        >
            <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: 'linear-gradient(90deg,transparent,#8B7CF6,transparent)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }}
            />
            {/* top stat tiles */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                    { label: 'Total Clients', value: '1,284' },
                    { label: 'Active Cases', value: '312' },
                    { label: 'Settled', value: 'R173M' },
                ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3" style={{ background: 'var(--overlay-weak)', border: `1px solid ${T.border}` }}>
                        <div className="text-[0.6rem] tracking-wide" style={{ color: T.faint }}>{s.label}</div>
                        <div className="font-['Grifter'] text-lg font-bold mt-1" style={{ color: T.text }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* brand block + chart */}
            <div className="grid grid-cols-[1.1fr_1fr] gap-3 mb-4">
                <div className="rounded-xl p-4 flex flex-col justify-between" style={{ background: T.brandGradient }}>
                    <div className="text-white/80 text-[0.62rem] tracking-wide uppercase">Workflow</div>
                    <div className="text-white font-['Grifter'] text-base font-bold leading-tight mt-2">Case velocity up 24% this quarter</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--overlay-weak)', border: `1px solid ${T.border}` }}>
                    <div className="text-[0.6rem] mb-2" style={{ color: T.faint }}>Cases by month</div>
                    <div className="flex items-end gap-1.5 h-16">
                        {[40, 62, 48, 72, 58, 85, 66].map((h, i) => (
                            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i % 2 ? T.violet : T.indigo, opacity: 0.85 }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* case list */}
            <div className="rounded-xl p-3" style={{ background: 'var(--overlay-weak)', border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[0.6rem] tracking-[0.15em] uppercase" style={{ color: T.violetLight }}>Active Cases</span>
                    <span className="text-[0.6rem]" style={{ color: T.faint }}>4 of 312</span>
                </div>
                {CASE_ROWS.map((row) => (
                    <div key={row.name} className="flex items-center gap-2.5 py-2" style={{ borderTop: `1px solid ${T.border}` }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.tone, boxShadow: `0 0 8px ${row.tone}99` }} />
                        <span className="flex-1 text-[0.72rem] truncate" style={{ color: T.text }}>{row.name}</span>
                        <span className="text-[0.62rem] flex-shrink-0" style={{ color: T.faint }}>{row.stage}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function Hero() {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden pt-28 pb-20">
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(ellipse 70% 60% at 75% 35%, rgba(139,124,246,0.16) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 10% 90%, rgba(109,94,245,0.10) 0%, transparent 55%), linear-gradient(160deg,${T.bg} 0%,${T.bg2} 55%,${T.bg} 100%)` }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(139,124,246,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(139,124,246,0.05) 1px,transparent 1px)',
                        backgroundSize: '72px 72px',
                        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%,black,transparent)',
                        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%,black,transparent)',
                    }}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
                <div>
                    <div
                        className="inline-flex items-center gap-3 rounded-full px-4 py-2 mb-7 animate-fade-in-up"
                        style={{ border: `1px solid ${T.border}`, background: 'rgba(139,124,246,0.06)' }}
                    >
                        <span className="w-2 h-2 rounded-full" style={{ background: T.violet, animation: 'pulseGlow 2s ease-in-out infinite' }} />
                        <span className="text-xs tracking-[0.18em] uppercase" style={{ color: T.violetLight }}>Cloud Client &amp; Case Management</span>
                    </div>

                    <h1 className="font-['Grifter'] text-5xl md:text-6xl xl:text-7xl font-black leading-[1.04] tracking-tight" style={{ color: T.text }}>
                        Manage clients<br />
                        and cases in <Accent>one place</Accent>
                    </h1>

                    <p className="mt-6 text-lg leading-[1.75] max-w-lg" style={{ color: T.muted }}>
                        Lexum Link is a cloud platform that simplifies how you manage client information, legal cases, documents, and communication. Reduce paperwork, improve service, and track every case from start to finish.
                    </p>

                    <div className="flex flex-wrap gap-4 mt-9">
                        <PrimaryButton to="/contact">Request a Demo</PrimaryButton>
                        <GhostButton to="/services">Explore the Platform</GhostButton>
                    </div>

                    <div className="flex flex-wrap gap-10 mt-12 pt-8" style={{ borderTop: `1px solid ${T.border}` }}>
                        {[
                            { num: '1 platform', label: 'For your whole team' },
                            { num: '7 stages', label: 'Guided case workflow' },
                            { num: '100%', label: 'Role-based security' },
                        ].map((s) => (
                            <div key={s.label}>
                                <div className="font-['Grifter'] text-2xl font-bold leading-none" style={{ color: T.violetLight }}>{s.num}</div>
                                <div className="text-xs mt-1 tracking-wide" style={{ color: T.faint }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative hidden lg:block" style={{ animation: 'floaty 7s ease-in-out infinite' }}>
                    <DashboardMockup />
                </div>
            </div>
        </section>
    );
}

function TrustBar() {
    return (
        <section className="py-10" style={{ background: T.bg2, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <p className="text-center text-xs tracking-[0.2em] uppercase mb-6" style={{ color: T.faint }}>Built for the teams that manage client cases</p>
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                    {TRUST.map((t) => (
                        <span key={t} className="font-['Grifter'] text-lg font-bold tracking-tight" style={{ color: 'var(--faint)' }}>{t}</span>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Features() {
    return (
        <section className="py-28 relative" style={{ background: T.bg }}>
            <GlowField />
            <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
                <Reveal className="text-center max-w-2xl mx-auto mb-16">
                    <SectionLabel>What Lexum Link Does</SectionLabel>
                    <SectionTitle center>
                        More than a database — a complete <Accent>client platform</Accent>
                    </SectionTitle>
                    <p className="mt-4 text-[0.97rem]" style={{ color: T.muted }}>
                        Streamline operations, enhance collaboration, and improve the client experience with everything your team needs in one system.
                    </p>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.map((f, i) => (
                        <Reveal key={f.title} delay={(i % 3) * 0.08}>
                            <div
                                className="group h-full rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
                                style={{ background: T.panel, border: `1px solid ${T.border}` }}
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-6 transition-all duration-300"
                                    style={{ background: 'rgba(139,124,246,0.12)', border: `1px solid ${T.borderStrong}` }}
                                >
                                    {f.icon}
                                </div>
                                <h3 className="font-semibold text-lg mb-3 transition-colors duration-300" style={{ color: T.text }}>{f.title}</h3>
                                <p className="text-sm leading-[1.7]" style={{ color: T.muted }}>{f.desc}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>

                <Reveal className="text-center mt-12">
                    <Link to="/services" className="text-sm font-semibold" style={{ color: T.violetLight }}>
                        See all capabilities →
                    </Link>
                </Reveal>
            </div>
        </section>
    );
}

function Workflow() {
    return (
        <section className="py-28" style={{ background: T.bg2 }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <Reveal className="text-center max-w-xl mx-auto mb-16">
                    <SectionLabel>How It Works</SectionLabel>
                    <SectionTitle center>From intake to <Accent>settlement</Accent></SectionTitle>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {STEPS.map((s, i) => (
                        <Reveal key={s.num} delay={i * 0.1}>
                            <div className="rounded-2xl p-8 h-full" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
                                <div className="font-['Grifter'] text-5xl font-bold mb-4" style={{ background: T.brandGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div>
                                <h3 className="font-semibold text-lg mb-2" style={{ color: T.text }}>{s.title}</h3>
                                <p className="text-sm leading-[1.7]" style={{ color: T.muted }}>{s.desc}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CTA() {
    return (
        <section className="py-28" style={{ background: T.bg }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-8">
                <Reveal>
                    <div
                        className="relative rounded-3xl p-12 md:p-16 text-center overflow-hidden"
                        style={{ background: `linear-gradient(150deg,${T.panel2},${T.panel})`, border: `1px solid ${T.borderStrong}` }}
                    >
                        <GlowField />
                        <div className="relative z-10">
                            <SectionTitle center>
                                Ready to manage clients with <Accent>confidence?</Accent>
                            </SectionTitle>
                            <p className="mt-4 max-w-xl mx-auto text-[0.97rem]" style={{ color: T.muted }}>
                                Bring your clients, cases, and documents into one intelligent platform. Book a walkthrough and see Lexum Link in action.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center mt-9">
                                <PrimaryButton to="/contact">Request a Demo</PrimaryButton>
                                <GhostButton to="/pricing">View Pricing</GhostButton>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

export default function Home() {
    return (
        <>
            <Hero />
            <TrustBar />
            <Features />
            <Workflow />
            <CTA />
        </>
    );
}
