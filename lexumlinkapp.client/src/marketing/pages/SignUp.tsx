import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import SignaturePad from '../../components/SignaturePad';
import SignatureUpload from '../../components/SignatureUpload';
import { T, Reveal, Accent, PageHero } from '../ui';

const PACKAGES = [
    { value: 'starter', label: 'Starter', fee: 249, blurb: '1 user, 1 organisation — R249 / user / mo' },
    { value: 'professional', label: 'Professional', fee: 649, blurb: 'Up to 5 users — R649 / user / mo' },
    { value: 'enterprise', label: 'Enterprise', fee: null, blurb: 'Custom pricing — our team will confirm your fee' },
    { value: 'other', label: 'Other', fee: null, blurb: 'Tell us what you need' },
] as const;

const PAYMENT_DUE_OPTIONS = ['1st', '7th', '15th', 'Other'];

interface FormState {
    companyName: string;
    tradingName: string;
    companyRegistrationNumber: string;
    vatNumber: string;
    natureOfBusiness: string;
    contactFullName: string;
    contactPosition: string;
    contactMobile: string;
    contactAlternateNumber: string;
    contactEmail: string;
    contactWhatsApp: string;
    physicalAddress: string;
    postalAddress: string;
    province: string;
    postalCode: string;
    servicePackage: string;
    servicePackageOther: string;
    additionalRequirements: string;
    paymentDuePreference: string;
    paymentDueOther: string;
    declarationAccepted: boolean;
    popiaConsent: boolean;
    clientInitials: string;
    signedFullName: string;
    signedPosition: string;
}

const initialState = (pkg: string): FormState => ({
    companyName: '',
    tradingName: '',
    companyRegistrationNumber: '',
    vatNumber: '',
    natureOfBusiness: '',
    contactFullName: '',
    contactPosition: '',
    contactMobile: '',
    contactAlternateNumber: '',
    contactEmail: '',
    contactWhatsApp: '',
    physicalAddress: '',
    postalAddress: '',
    province: '',
    postalCode: '',
    servicePackage: PACKAGES.some(p => p.value === pkg) ? pkg : 'starter',
    servicePackageOther: '',
    additionalRequirements: '',
    paymentDuePreference: '1st',
    paymentDueOther: '',
    declarationAccepted: false,
    popiaConsent: false,
    clientInitials: '',
    signedFullName: '',
    signedPosition: '',
});

function buildAgreementText(form: FormState, signedAtDate: string): string {
    const pkg = PACKAGES.find(p => p.value === form.servicePackage);
    const packageLabel = form.servicePackage === 'other' ? (form.servicePackageOther || 'Other') : pkg?.label ?? form.servicePackage;
    const feeLine = pkg?.fee != null ? `R${pkg.fee} / user / month` : 'To be confirmed by LexumLink';
    const paymentDue = form.paymentDuePreference === 'Other' ? (form.paymentDueOther || 'Other') : `the ${form.paymentDuePreference} of each month`;

    return [
        'LEXUMLINK — CLIENT REGISTRATION & SERVICE AGREEMENT',
        'Connecting Clients with Professional Case Management Services',
        'Website: www.lexumlink.co.za · Email: sales@lexumlink.co.za · Tel: 073 476 0591 · WhatsApp: 074 731 4663',
        '',
        '1. CLIENT / COMPANY DETAILS',
        `Company / Client Name: ${form.companyName}`,
        `Trading Name: ${form.tradingName || '—'}`,
        `Company Registration Number: ${form.companyRegistrationNumber || '—'}`,
        `VAT Number: ${form.vatNumber || '—'}`,
        `Nature of Business: ${form.natureOfBusiness || '—'}`,
        '',
        '2. CONTACT PERSON',
        `Full Name & Surname: ${form.contactFullName}`,
        `Position / Designation: ${form.contactPosition || '—'}`,
        `Mobile Number: ${form.contactMobile}`,
        `Alternative Number: ${form.contactAlternateNumber || '—'}`,
        `Email Address: ${form.contactEmail}`,
        `WhatsApp Number: ${form.contactWhatsApp || '—'}`,
        '',
        '3. COMPANY ADDRESS',
        `Physical Address: ${form.physicalAddress}`,
        `Postal Address: ${form.postalAddress || '—'}`,
        `Province: ${form.province || '—'}   Postal Code: ${form.postalCode || '—'}`,
        '',
        '4. SERVICE REQUIRED',
        `Service / Package Selected: ${packageLabel}`,
        `Additional Details / Client Requirements: ${form.additionalRequirements || '—'}`,
        '',
        '5. CLIENT ACCOUNT',
        `Monthly Service Fee: ${feeLine}`,
        `Payment Due: ${paymentDue}`,
        '(Your Client Reference Number will be issued once this registration is submitted, and your final monthly total confirmed by LexumLink before your account is activated.)',
        '',
        '6. LEXUMLINK BANKING DETAILS (for your monthly payment once activated)',
        'Account Name: LEXUMLINK PTY (Ltd) · Bank: Standard Bank · Account Number: 10285076327',
        'Branch: Universal · Branch Code: 051001 · Account Type: Cheque',
        'Payment Reference: Your LexumLink Client Reference Number / Company Name',
        'Please send proof of payment to admin@lexumlink.co.za. Verify these details before paying, particularly if they were communicated electronically.',
        '',
        '9. CLIENT DECLARATION & ACCEPTANCE',
        'I / We confirm that the information supplied in this Client Registration Form is true, accurate and complete. I / We confirm that we have selected the service/package indicated and agree to pay the stated monthly amount in accordance with the agreed payment terms. I / We understand that services provided by LexumLink may, where applicable, involve the facilitation or referral of independent attorneys, advocates, law firms or other professional service providers, who may have separate terms of engagement, professional obligations and fees. I / We agree to notify LexumLink promptly of any changes to our company, contact, billing or banking information. I / We authorise LexumLink to use the information supplied for client registration, account administration, communication, billing, payment processing and the provision or facilitation of the services requested.',
        '',
        '10. POPIA / PRIVACY CONSENT',
        'I / We consent to LexumLink collecting, processing and storing the personal and/or business information provided in this form for purposes reasonably connected with client registration, administration, communication, billing, service delivery and compliance with applicable legal requirements.',
        `Consent given: ${form.popiaConsent ? 'Yes' : 'No'}   Client Initials: ${form.clientInitials}`,
        '',
        '11. CLIENT SIGNATURE',
        `Full Name: ${form.signedFullName}`,
        `Position: ${form.signedPosition || '—'}`,
        `Company Name: ${form.companyName}`,
        `Signed electronically on: ${signedAtDate}`,
        '(Drawn signature captured separately and attached to this record.)',
    ].join('\n');
}

const inputCls = 'w-full text-sm px-4 py-3 rounded-xl outline-none transition-all duration-300';
const inputStyle: React.CSSProperties = { background: 'var(--overlay-weak)', border: `1px solid ${T.border}`, color: T.text };
const labelCls = 'text-[0.68rem] tracking-[0.15em] uppercase mb-2 block';

export default function SignUp() {
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState<FormState>(() => initialState(searchParams.get('package') || 'starter'));
    const [step, setStep] = useState(1);
    const [signatureMethod, setSignatureMethod] = useState<'draw' | 'upload'>('draw');
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [signatureFileError, setSignatureFileError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

    const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
        setForm(p => ({ ...p, [target.name]: value }));
    };

    const selectedPackage = PACKAGES.find(p => p.value === form.servicePackage);

    const label = (text: string) => <label className={labelCls} style={{ color: T.violetLight }}>{text}</label>;

    const validateStep = (s: number): string | null => {
        if (s === 1) {
            if (!form.companyName.trim()) return 'Company / client name is required.';
            if (!form.contactFullName.trim() || !form.contactMobile.trim() || !form.contactEmail.trim()) return 'Contact name, mobile number and email are required.';
            if (!form.physicalAddress.trim()) return 'Physical address is required.';
        }
        if (s === 2) {
            if (form.servicePackage === 'other' && !form.servicePackageOther.trim()) return 'Please describe the service you need.';
        }
        if (s === 3) {
            if (!form.declarationAccepted) return 'Please accept the client declaration to continue.';
            if (!form.popiaConsent) return 'Please provide POPIA consent to continue.';
            if (!form.clientInitials.trim()) return 'Please enter your initials.';
        }
        return null;
    };

    const goNext = () => {
        const err = validateStep(step);
        if (err) { setError(err); return; }
        setError('');
        setStep(s => Math.min(s + 1, 4));
    };
    const goBack = () => { setError(''); setStep(s => Math.max(s - 1, 1)); };

    const handleSubmit = async () => {
        if (!form.signedFullName.trim()) { setError('Please type your full name in the signature block.'); return; }
        if (!signatureDataUrl) { setError(signatureMethod === 'draw' ? 'Please draw your signature before submitting.' : 'Please upload an image of your signature before submitting.'); return; }

        setSubmitting(true);
        setError('');
        const signedAtDate = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
        try {
            const res = await api.post('/client-registrations', {
                ...form,
                monthlyServiceFee: selectedPackage?.fee ?? null,
                signatureDataUrl,
                agreementText: buildAgreementText(form, signedAtDate),
            });
            setReferenceNumber(res.data.clientReferenceNumber);
        } catch (err: unknown) {
            console.error('Sign-up submission failed', err);
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setError(axiosErr.response?.data?.error || 'Something went wrong submitting your registration. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (referenceNumber) {
        return (
            <>
                <PageHero
                    label="Sign Up"
                    title={<>Welcome to <Accent>LexumLink</Accent></>}
                    subtitle="Your registration has been received."
                />
                <section className="pb-24" style={{ background: T.bg2 }}>
                    <div className="max-w-xl mx-auto px-4 sm:px-8">
                        <Reveal>
                            <div className="rounded-2xl p-10 text-center" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
                                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl mb-6" style={{ background: 'var(--brand-soft)', border: `1px solid ${T.borderStrong}` }}>
                                    <i className="fa-solid fa-check" style={{ color: T.violetLight }} />
                                </div>
                                <h3 className="font-['Grifter'] text-2xl font-bold mb-2" style={{ color: T.text }}>Thanks, {form.contactFullName.split(' ')[0] || 'there'}!</h3>
                                <p className="text-sm mb-4" style={{ color: T.muted }}>
                                    Your signed Client Registration &amp; Service Agreement has been received. Our team will review your details and be in touch shortly to activate your account.
                                </p>
                                <div className="inline-block rounded-xl px-5 py-3" style={{ background: 'var(--overlay-weak)', border: `1px solid ${T.border}` }}>
                                    <div className="text-[0.68rem] tracking-[0.15em] uppercase mb-1" style={{ color: T.violetLight }}>Client Reference Number</div>
                                    <div className="text-lg font-semibold" style={{ color: T.text }}>{referenceNumber}</div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>
            </>
        );
    }

    return (
        <>
            <PageHero
                label="Sign Up"
                title={<>Join <Accent>LexumLink</Accent></>}
                subtitle="Register your firm, choose a plan, and digitally sign the Client Registration & Service Agreement — no paperwork, no printing."
            />

            <section className="pb-24" style={{ background: T.bg2 }}>
                <div className="max-w-3xl mx-auto px-4 sm:px-8">
                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-2 mb-10">
                        {['Your Details', 'Service', 'Agreement', 'Signature'].map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                                    style={
                                        step === i + 1
                                            ? { background: T.brandGradient, color: '#fff' }
                                            : step > i + 1
                                                ? { background: 'var(--brand-soft)', color: T.violetLight, border: `1px solid ${T.borderStrong}` }
                                                : { background: 'var(--overlay-weak)', color: T.faint, border: `1px solid ${T.border}` }
                                    }
                                >
                                    {step > i + 1 ? <i className="fa-solid fa-check" /> : i + 1}
                                </div>
                                {i < 3 && <span className="w-6 h-px" style={{ background: T.border }} />}
                            </div>
                        ))}
                    </div>

                    <Reveal>
                        <div className="rounded-2xl p-8" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
                            {error && (
                                <div className="mb-6 text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171' }}>
                                    {error}
                                </div>
                            )}

                            {step === 1 && (
                                <div className="flex flex-col gap-5">
                                    <h3 className="font-['Grifter'] text-xl font-bold" style={{ color: T.text }}>Company &amp; Contact Details</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>{label('Company / Client Name *')}<input name="companyName" value={form.companyName} onChange={handle} className={inputCls} style={inputStyle} required /></div>
                                        <div>{label('Trading Name')}<input name="tradingName" value={form.tradingName} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>{label('Company Registration Number')}<input name="companyRegistrationNumber" value={form.companyRegistrationNumber} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                        <div>{label('VAT Number')}<input name="vatNumber" value={form.vatNumber} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                    </div>
                                    <div>{label('Nature of Business')}<textarea name="natureOfBusiness" rows={2} value={form.natureOfBusiness} onChange={handle} className={inputCls} style={inputStyle} /></div>

                                    <div className="h-px my-1" style={{ background: T.border }} />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>{label('Contact Full Name *')}<input name="contactFullName" value={form.contactFullName} onChange={handle} className={inputCls} style={inputStyle} required /></div>
                                        <div>{label('Position / Designation')}<input name="contactPosition" value={form.contactPosition} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>{label('Mobile Number *')}<input name="contactMobile" value={form.contactMobile} onChange={handle} className={inputCls} style={inputStyle} required /></div>
                                        <div>{label('Alternative Number')}<input name="contactAlternateNumber" value={form.contactAlternateNumber} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>{label('Email Address *')}<input name="contactEmail" type="email" value={form.contactEmail} onChange={handle} className={inputCls} style={inputStyle} required /></div>
                                        <div>{label('WhatsApp Number')}<input name="contactWhatsApp" value={form.contactWhatsApp} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                    </div>

                                    <div className="h-px my-1" style={{ background: T.border }} />

                                    <div>{label('Physical Address *')}<textarea name="physicalAddress" rows={2} value={form.physicalAddress} onChange={handle} className={inputCls} style={inputStyle} required /></div>
                                    <div>{label('Postal Address')}<textarea name="postalAddress" rows={2} value={form.postalAddress} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>{label('Province')}<input name="province" value={form.province} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                        <div>{label('Postal Code')}<input name="postalCode" value={form.postalCode} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="flex flex-col gap-5">
                                    <h3 className="font-['Grifter'] text-xl font-bold" style={{ color: T.text }}>Service &amp; Package</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {PACKAGES.map(p => (
                                            <label
                                                key={p.value}
                                                className="rounded-xl p-4 cursor-pointer transition-all duration-200"
                                                style={form.servicePackage === p.value
                                                    ? { background: 'var(--brand-soft)', border: `1px solid ${T.borderStrong}` }
                                                    : { background: 'var(--overlay-weak)', border: `1px solid ${T.border}` }}
                                            >
                                                <input type="radio" name="servicePackage" value={p.value} checked={form.servicePackage === p.value} onChange={handle} className="sr-only" />
                                                <div className="font-semibold text-sm mb-1" style={{ color: T.text }}>{p.label}</div>
                                                <div className="text-xs" style={{ color: T.muted }}>{p.blurb}</div>
                                            </label>
                                        ))}
                                    </div>
                                    {form.servicePackage === 'other' && (
                                        <div>{label('Describe the service you need *')}<textarea name="servicePackageOther" rows={2} value={form.servicePackageOther} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                    )}
                                    <div>{label('Additional Details / Requirements')}<textarea name="additionalRequirements" rows={3} value={form.additionalRequirements} onChange={handle} className={inputCls} style={inputStyle} /></div>

                                    <div className="h-px my-1" style={{ background: T.border }} />

                                    <div>
                                        {label('Preferred Payment Due Date')}
                                        <select name="paymentDuePreference" value={form.paymentDuePreference} onChange={handle} className={inputCls} style={inputStyle}>
                                            {PAYMENT_DUE_OPTIONS.map(o => <option key={o} value={o} style={{ background: T.panel }}>{o}</option>)}
                                        </select>
                                    </div>
                                    {form.paymentDuePreference === 'Other' && (
                                        <div>{label('Specify payment due date')}<input name="paymentDueOther" value={form.paymentDueOther} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                    )}
                                    <p className="text-xs" style={{ color: T.faint }}>No payment is required today — this just tells our billing team your preference once your account is activated.</p>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="flex flex-col gap-5">
                                    <h3 className="font-['Grifter'] text-xl font-bold" style={{ color: T.text }}>Review &amp; Accept the Agreement</h3>
                                    <div
                                        className="rounded-xl p-5 text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto font-mono"
                                        style={{ background: 'var(--overlay-weak)', border: `1px solid ${T.border}`, color: T.muted }}
                                    >
                                        {buildAgreementText(form, new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }))}
                                    </div>

                                    <label className="flex items-start gap-3 text-sm" style={{ color: T.text }}>
                                        <input type="checkbox" name="declarationAccepted" checked={form.declarationAccepted} onChange={handle} className="mt-1 h-4 w-4" />
                                        I / We confirm the information supplied is true, accurate and complete, and agree to the terms of this Client Registration &amp; Service Agreement.
                                    </label>
                                    <label className="flex items-start gap-3 text-sm" style={{ color: T.text }}>
                                        <input type="checkbox" name="popiaConsent" checked={form.popiaConsent} onChange={handle} className="mt-1 h-4 w-4" />
                                        I / We consent to LexumLink collecting, processing and storing this information for client registration, administration, billing and service delivery (POPIA).
                                    </label>
                                    <div className="max-w-xs">{label('Client Initials *')}<input name="clientInitials" value={form.clientInitials} onChange={handle} className={inputCls} style={inputStyle} /></div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="flex flex-col gap-5">
                                    <h3 className="font-['Grifter'] text-xl font-bold" style={{ color: T.text }}>Sign the Agreement</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>{label('Full Name *')}<input name="signedFullName" value={form.signedFullName} onChange={handle} className={inputCls} style={inputStyle} placeholder={form.contactFullName} /></div>
                                        <div>{label('Position')}<input name="signedPosition" value={form.signedPosition} onChange={handle} className={inputCls} style={inputStyle} placeholder={form.contactPosition} /></div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            {label('Signature *')}
                                            <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                                                {(['draw', 'upload'] as const).map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => { setSignatureMethod(m); setSignatureDataUrl(null); setSignatureFileError(''); }}
                                                        className="px-4 py-1.5 text-xs font-semibold capitalize transition-colors"
                                                        style={signatureMethod === m ? { background: T.brandGradient, color: '#fff' } : { background: 'var(--overlay-weak)', color: T.muted }}
                                                    >
                                                        {m === 'draw' ? 'Draw' : 'Upload'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {signatureMethod === 'draw' ? (
                                            <SignaturePad key="draw" onChange={setSignatureDataUrl} />
                                        ) : (
                                            <SignatureUpload
                                                key="upload"
                                                dataUrl={signatureDataUrl}
                                                onChange={setSignatureDataUrl}
                                                error={signatureFileError}
                                                setError={setSignatureFileError}
                                            />
                                        )}
                                    </div>
                                    <p className="text-xs" style={{ color: T.faint }}>
                                        By signing, you agree this electronic signature has the same legal effect as a handwritten one, per South Africa's Electronic Communications and Transactions Act.
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-8">
                                {step > 1 ? (
                                    <button type="button" onClick={goBack} className="text-sm font-medium" style={{ color: T.muted }}>← Back</button>
                                ) : <span />}
                                {step < 4 ? (
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5"
                                        style={{ background: T.brandGradient, boxShadow: '0 8px 30px rgba(94,0,6,0.40)' }}
                                    >
                                        Continue →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
                                        style={{ background: T.brandGradient, boxShadow: '0 8px 30px rgba(94,0,6,0.40)' }}
                                    >
                                        {submitting ? 'Submitting...' : 'Sign & Submit'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}
