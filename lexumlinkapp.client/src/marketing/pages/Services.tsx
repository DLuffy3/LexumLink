import { T, Reveal, SectionLabel, SectionTitle, Accent, PageHero, PrimaryButton, GlowField } from '../ui';

interface Service {
    icon: string;
    title: string;
    desc: string;
    points: string[];
}

const SERVICES: Service[] = [
    {
        icon: 'fa-solid fa-user-shield',
        title: 'Secure Client Management',
        desc: 'Store all client information in one secure location — personal details, contacts, case history, and documents, available whenever they are needed.',
        points: ['Centralised client profiles', 'Quick client search', 'Complete client history', 'Secure data storage'],
    },
    {
        icon: 'fa-solid fa-folder-open',
        title: 'Case Management',
        desc: 'Give every client one or multiple cases and track each through its full lifecycle for complete visibility.',
        points: ['Open new cases', 'Assign case handlers', 'Monitor progress', 'Update status & close cases'],
    },
    {
        icon: 'fa-solid fa-file-lines',
        title: 'Document Management',
        desc: 'Upload and organise every supporting document against the client profile for easy retrieval.',
        points: ['Medical records', 'SAPS reports', 'Legal documents', 'Identification documents'],
    },
    {
        icon: 'fa-solid fa-arrows-rotate',
        title: 'Workflow Tracking',
        desc: 'Guide each case through predefined stages so no important step is ever missed.',
        points: ['Client registered → consultation', 'Documents collected → submitted', 'Review → settlement', 'Case closed'],
    },
    {
        icon: 'fa-solid fa-clock',
        title: 'Task & Reminder Management',
        desc: 'Keep staff organised with automatic reminders that reduce delays and improve client service.',
        points: ['Client follow-ups', 'Missing documentation', 'Court dates & deadlines', 'Medical assessments'],
    },
    {
        icon: 'fa-solid fa-chart-pie',
        title: 'Dashboard & Reporting',
        desc: 'Monitor performance from a centralised dashboard with reports that surface operational insight.',
        points: ['Total & active cases', 'Completed cases', 'Pending tasks', 'Workflow statistics'],
    },
    {
        icon: 'fa-solid fa-lock',
        title: 'Secure Role-Based Access',
        desc: 'Protect sensitive information with permissions tailored to each person’s role.',
        points: ['Administrator', 'Case Manager & Manager', 'Consultant', 'Receptionist'],
    },
    {
        icon: 'fa-solid fa-comments',
        title: 'Better Client Service',
        desc: 'With instant access to client information and case updates, your team responds faster and more accurately.',
        points: ['Answer enquiries quickly', 'Accurate progress updates', 'Reduce waiting times', 'More professional service'],
    },
];

const WORKFLOW = [
    'Client Registered',
    'Consultation Completed',
    'Documents Collected',
    'Case Submitted',
    'Review in Progress',
    'Settlement',
    'Case Closed',
];

export default function Services() {
    return (
        <>
            <PageHero
                label="Platform & Services"
                title={<>Everything you need to run <Accent>client cases</Accent></>}
                subtitle="One centralised platform that organises your operations, reduces paperwork, and improves service delivery — from first contact to final settlement."
            />

            {/* Service grid */}
            <section className="py-24 relative overflow-hidden" style={{ background: T.bg2 }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {SERVICES.map((s, i) => (
                            <Reveal key={s.title} delay={(i % 2) * 0.08}>
                                <div className="group h-full rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'var(--brand-soft)', border: `1px solid ${T.borderStrong}` }}><i className={s.icon} style={{ color: T.violetLight }} /></div>
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2" style={{ color: T.text }}>{s.title}</h3>
                                            <p className="text-sm leading-[1.7]" style={{ color: T.muted }}>{s.desc}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2.5">
                                        {s.points.map((p) => (
                                            <div key={p} className="flex items-center gap-2 text-xs" style={{ color: T.muted }}>
                                                <i className="fa-solid fa-check flex-shrink-0" style={{ color: T.violetLight }} />
                                                {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Workflow ribbon */}
            <section className="py-24 relative overflow-hidden" style={{ background: T.bg }}>
                <GlowField />
                <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
                    <Reveal className="text-center max-w-xl mx-auto mb-14">
                        <SectionLabel>Guided Workflow</SectionLabel>
                        <SectionTitle center>Every case follows a <Accent>clear path</Accent></SectionTitle>
                        <p className="mt-4 text-[0.97rem]" style={{ color: T.muted }}>Predefined stages keep work moving and make sure nothing slips through.</p>
                    </Reveal>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {WORKFLOW.map((stage, i) => (
                            <Reveal key={stage} delay={i * 0.05}>
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: T.panel, border: `1px solid ${T.borderStrong}`, color: T.text }}>
                                        <span className="font-['Grifter'] mr-2" style={{ color: T.violetLight }}>{i + 1}</span>
                                        {stage}
                                    </div>
                                    {i < WORKFLOW.length - 1 && <span className="hidden sm:inline" style={{ color: T.faint }}>→</span>}
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24" style={{ background: T.bg2 }}>
                <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">
                    <Reveal>
                        <SectionTitle center>See these tools working on <Accent>your cases</Accent></SectionTitle>
                        <p className="mt-4 max-w-xl mx-auto text-[0.97rem]" style={{ color: T.muted }}>Book a demo and we’ll walk you through the platform with examples from your line of work.</p>
                        <div className="flex justify-center mt-8">
                            <PrimaryButton to="/contact">Request a Demo</PrimaryButton>
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}
