import { T, Reveal, SectionLabel, SectionTitle, Accent, PageHero, PrimaryButton, GhostButton, GlowField } from '../ui';

const PILLARS = [
    { icon: '🔗', title: 'Connected', desc: 'People, processes, and information in one place — no more scattered spreadsheets and folders.' },
    { icon: '⚡', title: 'Efficient', desc: 'Less paperwork and fewer manual steps, so your team spends time on clients, not admin.' },
    { icon: '🔍', title: 'Transparent', desc: 'Clear visibility into every case, at every stage, for everyone who needs it.' },
];

const USERS = [
    'Legal firms',
    'Road Accident Fund (RAF) consultants',
    'Claims administrators',
    'Attorneys',
    'Medical-legal practices',
    'Insurance & claims companies',
    'Professional service businesses',
];

const STATS = [
    { num: '1', label: 'Unified platform for your whole team' },
    { num: '7', label: 'Guided workflow stages per case' },
    { num: '5+', label: 'Role types with tailored access' },
    { num: '24/7', label: 'Secure cloud availability' },
];

const VALUES = [
    { title: 'Client-first', desc: 'Every feature exists to help you deliver faster, more reliable, more professional service.' },
    { title: 'Secure by design', desc: 'Role-based permissions keep confidential information visible only to the right people.' },
    { title: 'Built for the work', desc: 'Designed around real case handling — RAF claims, legal matters, and general client administration.' },
];

export default function About() {
    return (
        <>
            <PageHero
                label="About Lexum Link"
                title={<>Connecting people, processes, and <Accent>information</Accent></>}
                subtitle="Lexum Link is a cloud-based client and case management system that helps organisations manage clients with confidence, efficiency, and transparency."
            />

            {/* Story */}
            <section className="py-24" style={{ background: T.bg2 }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <Reveal>
                        <SectionLabel>Our Story</SectionLabel>
                        <SectionTitle>Built to simplify complex <Accent>client management</Accent></SectionTitle>
                        <p className="mt-6 leading-[1.85] text-[0.97rem]" style={{ color: T.muted }}>
                            Managing client information, legal cases, documents, and communication across disconnected tools is slow and error-prone. Important steps get missed, documents go astray, and clients wait longer than they should.
                        </p>
                        <p className="mt-4 leading-[1.85] text-[0.97rem]" style={{ color: T.muted }}>
                            Lexum Link brings it all together in one secure platform. Whether you handle Road Accident Fund claims, legal matters, or general client administration, every case is tracked from start to finish — with the whole team working from the same source of truth.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <PrimaryButton to="/services">Explore the Platform</PrimaryButton>
                            <GhostButton to="/contact">Talk to Us</GhostButton>
                        </div>
                    </Reveal>

                    <Reveal delay={0.12}>
                        <div className="grid grid-cols-2 gap-4">
                            {STATS.map((s) => (
                                <div key={s.label} className="rounded-2xl p-6" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
                                    <div className="font-['Grifter'] text-4xl font-bold" style={{ background: T.brandGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div>
                                    <div className="text-sm mt-2 leading-snug" style={{ color: T.muted }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Vision */}
            <section className="py-24 relative overflow-hidden" style={{ background: T.bg }}>
                <GlowField />
                <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10 text-center">
                    <Reveal>
                        <SectionLabel>Our Vision</SectionLabel>
                        <p className="font-['Grifter'] text-2xl md:text-3xl leading-[1.5] font-bold" style={{ color: T.text }}>
                            “Lexum Link connects people, processes, and information in one intelligent platform — helping organisations manage clients with <Accent>confidence, efficiency, and transparency.</Accent>”
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* Pillars */}
            <section className="py-24" style={{ background: T.bg2 }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <Reveal className="text-center max-w-xl mx-auto mb-16">
                        <SectionLabel>What We Stand For</SectionLabel>
                        <SectionTitle center>Three principles at our <Accent>core</Accent></SectionTitle>
                    </Reveal>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {PILLARS.map((p, i) => (
                            <Reveal key={p.title} delay={i * 0.1}>
                                <div className="rounded-2xl p-8 h-full" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-6" style={{ background: 'rgba(139,124,246,0.12)', border: `1px solid ${T.borderStrong}` }}>{p.icon}</div>
                                    <h3 className="font-semibold text-lg mb-3" style={{ color: T.text }}>{p.title}</h3>
                                    <p className="text-sm leading-[1.7]" style={{ color: T.muted }}>{p.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values + ideal users */}
            <section className="py-24" style={{ background: T.bg }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <Reveal>
                        <SectionLabel>Why Teams Choose Us</SectionLabel>
                        <SectionTitle>Simple where it <Accent>matters</Accent></SectionTitle>
                        <div className="mt-8 flex flex-col gap-4">
                            {VALUES.map((v) => (
                                <div key={v.title} className="pl-5 py-2" style={{ borderLeft: `2px solid ${T.violet}` }}>
                                    <div className="font-semibold text-base mb-1" style={{ color: T.text }}>{v.title}</div>
                                    <div className="text-sm leading-[1.7]" style={{ color: T.muted }}>{v.desc}</div>
                                </div>
                            ))}
                        </div>
                    </Reveal>

                    <Reveal delay={0.12}>
                        <SectionLabel>Ideal Users</SectionLabel>
                        <SectionTitle>Who Lexum Link is <Accent>for</Accent></SectionTitle>
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {USERS.map((u) => (
                                <div key={u} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: T.violet }} />
                                    <span className="text-sm" style={{ color: T.muted }}>{u}</span>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}
