import { useState } from 'react';
import { T, Reveal, SectionLabel, SectionTitle, Accent, PageHero, GlowField } from '../ui';
import { Link } from 'react-router-dom';

interface Plan {
    name: string;
    monthly: number | null;
    blurb: string;
    features: string[];
    featured?: boolean;
    cta: string;
}

const PLANS: Plan[] = [
    {
        name: 'Starter',
        monthly: 149,
        blurb: 'For small teams getting organised.',
        features: ['Up to 5 users', 'Unlimited clients', 'Case management', 'Document storage (2 GB)', 'Email support'],
        cta: 'Get Started',
    },
    {
        name: 'Professional',
        monthly: 599,
        blurb: 'For growing practices managing volume.',
        features: ['Up to 20 users', 'Unlimited clients & cases', 'Full workflow automation', 'Document storage (25 GB)', 'Task & reminder engine', 'Dashboards & reporting', 'Priority support'],
        featured: true,
        cta: 'Start Free Trial',
    },
    {
        name: 'Enterprise',
        monthly: null,
        blurb: 'For multi-branch firms and organisations.',
        features: ['Unlimited users', 'Custom workflows & roles', 'Custom storage', 'API & integrations', 'Dedicated onboarding', '24/7 priority support'],
        cta: 'Contact Sales',
    },
];

const COMPARE: { label: string; values: [string, string, string] }[] = [
    { label: 'Users', values: ['5', '20', 'Unlimited'] },
    { label: 'Clients & cases', values: ['Unlimited', 'Unlimited', 'Unlimited'] },
    { label: 'Document storage', values: ['2 GB', '25 GB', 'Custom'] },
    { label: 'Workflow tracking', values: ['Basic', 'Full', 'Custom'] },
    { label: 'Tasks & reminders', values: ['—', '✓', '✓'] },
    { label: 'Dashboards & reporting', values: ['—', '✓', '✓'] },
    { label: 'Role-based access', values: ['✓', '✓', '✓'] },
    { label: 'API & integrations', values: ['—', '—', '✓'] },
    { label: 'Support', values: ['Email', 'Priority', '24/7 dedicated'] },
];

const FAQ = [
    { q: 'Is there a free trial?', a: 'Yes. The Professional plan includes a 14-day free trial with no card required, so your team can test the full workflow before committing.' },
    { q: 'Can I change plans later?', a: 'Absolutely. Upgrade or downgrade at any time — changes apply from your next billing cycle and your data stays intact.' },
    { q: 'How is my data protected?', a: 'All data is stored securely in the cloud with role-based access controls, so confidential client information is only visible to authorised people.' },
    { q: 'Do you offer onboarding?', a: 'Every plan includes onboarding support. Enterprise customers get dedicated onboarding and, where needed, on-site training.' },
    { q: 'What does Enterprise pricing look like?', a: 'Enterprise is priced to your scale and requirements. Contact our team and we’ll put together a proposal that fits your organisation.' },
];

function PriceCard({ plan, annual }: { plan: Plan; annual: boolean }) {
    const price =
        plan.monthly === null
            ? 'Custom'
            : `R${annual ? Math.round(plan.monthly * 0.8) : plan.monthly}`;
    return (
        <div
            className="relative rounded-2xl p-8 h-full flex flex-col transition-all duration-300 hover:-translate-y-1"
            style={
                plan.featured
                    ? { background: `linear-gradient(160deg,rgba(139,124,246,0.14),${T.panel})`, border: `1px solid ${T.borderStrong}`, boxShadow: '0 30px 80px rgba(109,94,245,0.22)' }
                    : { background: T.panel, border: `1px solid ${T.border}` }
            }
        >
            {plan.featured && (
                <div className="absolute top-5 right-5 rounded-full text-[0.6rem] font-bold tracking-widest uppercase px-3 py-1 text-white" style={{ background: T.brandGradient }}>
                    Most Popular
                </div>
            )}
            <div className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: T.violetLight }}>{plan.name}</div>
            <div className="flex items-end gap-1 mb-1">
                <span className="font-['Grifter'] text-5xl font-bold leading-none" style={{ color: T.text }}>{price}</span>
                {plan.monthly !== null && <span className="text-xs mb-1" style={{ color: T.faint }}>/ user / mo</span>}
            </div>
            <div className="text-sm mb-6 pb-6" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{plan.blurb}</div>

            <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm" style={{ color: T.muted }}>
                        <span className="flex-shrink-0" style={{ color: T.violetLight }}>✓</span>
                        {f}
                    </li>
                ))}
            </ul>

            <Link
                to="/contact"
                className="block w-full text-center py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5"
                style={
                    plan.featured
                        ? { background: T.brandGradient, color: '#fff', boxShadow: '0 8px 30px rgba(109,94,245,0.35)' }
                        : { border: `1px solid ${T.borderStrong}`, color: T.text }
                }
            >
                {plan.cta}
            </Link>
        </div>
    );
}

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
            <button
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                onClick={() => setOpen((o) => !o)}
            >
                <span className="font-medium text-[0.97rem]" style={{ color: T.text }}>{q}</span>
                <span className="text-xl flex-shrink-0 transition-transform duration-300" style={{ color: T.violetLight, transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            {open && (
                <div className="px-6 pb-5 text-sm leading-[1.7] animate-fade-in-up" style={{ color: T.muted }}>{a}</div>
            )}
        </div>
    );
}

export default function Pricing() {
    const [annual, setAnnual] = useState(false);

    return (
        <>
            <PageHero
                label="Pricing"
                title={<>Simple, <Accent>transparent</Accent> pricing</>}
                subtitle="Choose the plan that fits your team. Every plan includes onboarding support, and you can change tiers whenever you need to."
            />

            {/* Toggle + plans */}
            <section className="pb-24 -mt-6 relative overflow-hidden" style={{ background: T.bg }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className="text-sm" style={{ color: annual ? T.faint : T.text }}>Monthly</span>
                        <button
                            onClick={() => setAnnual((a) => !a)}
                            className="relative w-14 h-7 rounded-full transition-colors duration-300"
                            style={{ background: annual ? T.violet : 'rgba(255,255,255,0.12)' }}
                            aria-label="Toggle annual billing"
                        >
                            <span className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300" style={{ left: annual ? '2rem' : '0.25rem' }} />
                        </button>
                        <span className="text-sm" style={{ color: annual ? T.text : T.faint }}>
                            Annual <span style={{ color: T.violetLight }}>(save 20%)</span>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        {PLANS.map((p, i) => (
                            <Reveal key={p.name} delay={i * 0.1} className="h-full">
                                <PriceCard plan={p} annual={annual} />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison */}
            <section className="py-24" style={{ background: T.bg2 }}>
                <div className="max-w-5xl mx-auto px-4 sm:px-8">
                    <Reveal className="text-center max-w-xl mx-auto mb-14">
                        <SectionLabel>Compare Plans</SectionLabel>
                        <SectionTitle center>Find the right <Accent>fit</Accent></SectionTitle>
                    </Reveal>

                    <Reveal>
                        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                            <div className="grid grid-cols-4 px-6 py-4" style={{ background: T.panel2 }}>
                                <span className="text-xs tracking-widest uppercase" style={{ color: T.faint }}>Feature</span>
                                {['Starter', 'Professional', 'Enterprise'].map((h) => (
                                    <span key={h} className="text-xs tracking-widest uppercase text-center" style={{ color: T.violetLight }}>{h}</span>
                                ))}
                            </div>
                            {COMPARE.map((row, i) => (
                                <div key={row.label} className="grid grid-cols-4 px-6 py-4 items-center" style={{ background: i % 2 ? 'transparent' : 'rgba(255,255,255,0.015)', borderTop: `1px solid ${T.border}` }}>
                                    <span className="text-sm" style={{ color: T.muted }}>{row.label}</span>
                                    {row.values.map((v, j) => (
                                        <span key={j} className="text-sm text-center" style={{ color: v === '✓' ? T.violetLight : v === '—' ? T.faint : T.text }}>{v}</span>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 relative overflow-hidden" style={{ background: T.bg }}>
                <GlowField />
                <div className="max-w-3xl mx-auto px-4 sm:px-8 relative z-10">
                    <Reveal className="text-center mb-14">
                        <SectionLabel>FAQ</SectionLabel>
                        <SectionTitle center>Questions, <Accent>answered</Accent></SectionTitle>
                    </Reveal>
                    <div className="flex flex-col gap-4">
                        {FAQ.map((f, i) => (
                            <Reveal key={f.q} delay={i * 0.05}>
                                <FaqItem q={f.q} a={f.a} />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
