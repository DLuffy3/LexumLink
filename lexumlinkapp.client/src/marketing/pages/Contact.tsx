import { useState } from 'react';
import { T, Reveal, Accent, PageHero } from '../ui';

const INFO = [
    { icon: '📧', label: 'Email', value: 'hello@lexumlink.com' },
    { icon: '📞', label: 'Phone', value: '+27 (0) 11 123 4567' },
    { icon: '📍', label: 'Office', value: 'Sandton, Johannesburg, South Africa' },
    { icon: '🕐', label: 'Hours', value: 'Mon – Fri · 08:00 – 17:00 SAST' },
];

const REASONS = ['Request a demo', 'Pricing & plans', 'Technical question', 'Partnership', 'Something else'];

export default function Contact() {
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', org: '', reason: REASONS[0], message: '' });
    const [sent, setSent] = useState(false);

    const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Wire to your backend / email service here.
        console.log('Contact form submitted:', form);
        setSent(true);
    };

    const inputCls = 'w-full text-sm px-4 py-3 rounded-xl outline-none transition-all duration-300';
    const inputStyle: React.CSSProperties = { background: 'var(--overlay-weak)', border: `1px solid ${T.border}`, color: T.text };
    const labelCls = 'text-[0.68rem] tracking-[0.15em] uppercase mb-2 block';

    return (
        <>
            <PageHero
                label="Contact Us"
                title={<>Let’s talk about <Accent>your team</Accent></>}
                subtitle="Whether you want a demo, have questions about pricing, or just want to see if Lexum Link fits your workflow — we’d love to hear from you."
            />

            <section className="py-20" style={{ background: T.bg2 }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-[5fr_4fr] gap-12 items-start">
                    {/* Form */}
                    <Reveal>
                        <div className="rounded-2xl p-8" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
                            {sent ? (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl mb-6" style={{ background: 'rgba(139,124,246,0.14)', border: `1px solid ${T.borderStrong}` }}>✓</div>
                                    <h3 className="font-['Grifter'] text-2xl font-bold mb-2" style={{ color: T.text }}>Message sent</h3>
                                    <p className="text-sm" style={{ color: T.muted }}>Thanks, {form.firstName || 'there'}. Our team will be in touch shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={submit} className="flex flex-col gap-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className={labelCls} style={{ color: T.violetLight }}>First Name</label>
                                            <input name="firstName" value={form.firstName} onChange={handle} placeholder="Thabo" className={inputCls} style={inputStyle} required />
                                        </div>
                                        <div>
                                            <label className={labelCls} style={{ color: T.violetLight }}>Last Name</label>
                                            <input name="lastName" value={form.lastName} onChange={handle} placeholder="Nkosi" className={inputCls} style={inputStyle} required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className={labelCls} style={{ color: T.violetLight }}>Email</label>
                                            <input name="email" type="email" value={form.email} onChange={handle} placeholder="thabo@firm.co.za" className={inputCls} style={inputStyle} required />
                                        </div>
                                        <div>
                                            <label className={labelCls} style={{ color: T.violetLight }}>Phone</label>
                                            <input name="phone" value={form.phone} onChange={handle} placeholder="+27 11 000 0000" className={inputCls} style={inputStyle} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className={labelCls} style={{ color: T.violetLight }}>Organisation</label>
                                            <input name="org" value={form.org} onChange={handle} placeholder="Nkosi Attorneys Inc." className={inputCls} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label className={labelCls} style={{ color: T.violetLight }}>Reason</label>
                                            <select name="reason" value={form.reason} onChange={handle} className={inputCls} style={inputStyle}>
                                                {REASONS.map((r) => <option key={r} value={r} style={{ background: T.panel }}>{r}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls} style={{ color: T.violetLight }}>Message</label>
                                        <textarea name="message" rows={5} value={form.message} onChange={handle} placeholder="Tell us about your team and what you’re looking for..." className={inputCls} style={inputStyle} />
                                    </div>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-white font-semibold text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5"
                                        style={{ background: T.brandGradient, boxShadow: '0 8px 30px rgba(109,94,245,0.35)' }}
                                    >
                                        Send Message →
                                    </button>
                                </form>
                            )}
                        </div>
                    </Reveal>

                    {/* Info */}
                    <Reveal delay={0.12}>
                        <div className="flex flex-col gap-4">
                            {INFO.map((info) => (
                                <div key={info.label} className="flex items-start gap-4 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
                                    <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-lg" style={{ background: 'rgba(139,124,246,0.12)', border: `1px solid ${T.borderStrong}` }}>{info.icon}</div>
                                    <div>
                                        <div className="text-[0.68rem] tracking-[0.15em] uppercase mb-1" style={{ color: T.violetLight }}>{info.label}</div>
                                        <div className="text-sm" style={{ color: T.text }}>{info.value}</div>
                                    </div>
                                </div>
                            ))}

                            <div className="rounded-2xl p-6 mt-2" style={{ background: `linear-gradient(150deg,rgba(139,124,246,0.14),${T.panel})`, border: `1px solid ${T.borderStrong}` }}>
                                <p className="font-['Grifter'] italic text-base leading-[1.7]" style={{ color: T.text }}>
                                    “Efficient case management leads to faster, more reliable service — and better outcomes for the clients who need it most.”
                                </p>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}
