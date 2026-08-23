import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import HelpButton from '../components/HelpButton';
import Spinner from '../components/Spinner';

interface SettingsForm {
    siteName: string;
    supportEmail: string;
    smtpEnabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    smtpPasswordSet: boolean;
    smtpUseStartTls: boolean;
    smtpFromEmail: string;
    smtpFromName: string;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumber: boolean;
    passwordRequireSpecialChar: boolean;
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    caseIdleDays: number;
    caseArchiveDays: number;
}

const DEFAULTS: SettingsForm = {
    siteName: 'LexumLink',
    supportEmail: '',
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpPasswordSet: false,
    smtpUseStartTls: true,
    smtpFromEmail: '',
    smtpFromName: '',
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecialChar: false,
    sessionTimeoutMinutes: 10080,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    caseIdleDays: 14,
    caseArchiveDays: 90,
};

export default function SuperAdminSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState<SettingsForm>(DEFAULTS);
    const [testEmail, setTestEmail] = useState(user?.email || '');
    const [testingEmail, setTestingEmail] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            setFormData({ ...DEFAULTS, ...res.data, smtpPassword: '' });
        } catch (err) {
            console.error('Failed to load settings', err);
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else if (type === 'number') {
            setFormData({ ...formData, [name]: value === '' ? 0 : parseInt(value, 10) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');
        try {
            await api.put('/admin/settings', {
                siteName: formData.siteName,
                supportEmail: formData.supportEmail,
                smtpEnabled: formData.smtpEnabled,
                smtpHost: formData.smtpHost,
                smtpPort: formData.smtpPort,
                smtpUsername: formData.smtpUsername,
                smtpPassword: formData.smtpPassword || null,
                smtpUseStartTls: formData.smtpUseStartTls,
                smtpFromEmail: formData.smtpFromEmail,
                smtpFromName: formData.smtpFromName,
                passwordMinLength: formData.passwordMinLength,
                passwordRequireUppercase: formData.passwordRequireUppercase,
                passwordRequireNumber: formData.passwordRequireNumber,
                passwordRequireSpecialChar: formData.passwordRequireSpecialChar,
                sessionTimeoutMinutes: formData.sessionTimeoutMinutes,
                maxLoginAttempts: formData.maxLoginAttempts,
                lockoutDurationMinutes: formData.lockoutDurationMinutes,
                caseIdleDays: formData.caseIdleDays,
                caseArchiveDays: formData.caseArchiveDays,
            });
            setMessage('Settings saved.');
            setFormData({ ...formData, smtpPassword: '', smtpPasswordSet: formData.smtpPasswordSet || !!formData.smtpPassword });
        } catch (err: unknown) {
            console.error(err);
            let errorMessage = 'Failed to save settings';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { error?: string } } };
                errorMessage = axiosError.response?.data?.error || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        setTestingEmail(true);
        setTestResult(null);
        try {
            const res = await api.post('/admin/settings/test-email', { toEmail: testEmail });
            setTestResult({ ok: true, text: res.data?.message || 'Test email sent.' });
        } catch (err: unknown) {
            console.error(err);
            let errorMessage = 'Failed to send test email';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { error?: string } } };
                errorMessage = axiosError.response?.data?.error || errorMessage;
            }
            setTestResult({ ok: false, text: errorMessage });
        } finally {
            setTestingEmail(false);
        }
    };

    if (!user?.isSuperAdmin) {
        return <div className="p-6 text-red-300">Access denied. Super admin only.</div>;
    }

    if (loading) {
        return (
            <main className="p-6 pt-16">
                <Spinner />
            </main>
        );
    }

    const sectionClass = 'bg-[var(--surface)] rounded-lg shadow p-6';
    const labelClass = 'block text-sm font-medium text-[var(--muted)] mb-1';
    const inputClass = 'w-full bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] rounded p-2 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-ring)]';

    return (
        <>
            <HelpButton
                title="Platform Settings"
                description="Branding, outgoing email and security policy for the whole platform."
                steps={[
                    'Branding: the site name and support email shown to users.',
                    'Email: SMTP details used for outgoing notification emails. Leave the password blank to keep the current one. Save, then use "Send Test Email" to confirm delivery actually works.',
                    'Security: password complexity rules for new users, how long a sign-in session lasts, and how many failed sign-in attempts trigger a temporary lockout.',
                    'Workflow Automation: how many idle days before a case handler gets nudged, and how long after closing a case is auto-archived.',
                    'Changes take effect immediately for new sign-ins and new users — existing sessions keep their original expiry.',
                ]}
            />
            <main className="p-6 pt-16">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h1 className="text-2xl font-bold text-[var(--text)]">Platform Settings</h1>

                    {error && <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded">{error}</div>}
                    {message && <div className="pill-green p-3 rounded">{message}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className={sectionClass}>
                            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Branding</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Site Name</label>
                                    <input type="text" name="siteName" value={formData.siteName} onChange={handleChange} className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Support Email</label>
                                    <input type="email" name="supportEmail" value={formData.supportEmail} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        <div className={sectionClass}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-[var(--text)]">Email (SMTP)</h2>
                                <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                                    <input type="checkbox" name="smtpEnabled" checked={formData.smtpEnabled} onChange={handleChange} />
                                    Enabled
                                </label>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>SMTP Host</label>
                                    <input type="text" name="smtpHost" value={formData.smtpHost} onChange={handleChange} className={inputClass} placeholder="smtp.gmail.com" />
                                </div>
                                <div>
                                    <label className={labelClass}>SMTP Port</label>
                                    <input type="number" name="smtpPort" value={formData.smtpPort} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Username</label>
                                    <input type="text" name="smtpUsername" value={formData.smtpUsername} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Password{formData.smtpPasswordSet ? ' (currently set)' : ''}</label>
                                    <input
                                        type="password"
                                        name="smtpPassword"
                                        value={formData.smtpPassword}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder={formData.smtpPasswordSet ? 'Leave blank to keep current password' : ''}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>From Email</label>
                                    <input type="email" name="smtpFromEmail" value={formData.smtpFromEmail} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>From Name</label>
                                    <input type="text" name="smtpFromName" value={formData.smtpFromName} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <input type="checkbox" name="smtpUseStartTls" id="smtpUseStartTls" checked={formData.smtpUseStartTls} onChange={handleChange} />
                                <label htmlFor="smtpUseStartTls" className="text-sm text-[var(--text)]">Use STARTTLS</label>
                            </div>

                            <div className="mt-5 pt-4 border-t border-[var(--border)]">
                                <label className={labelClass}>Send Test Email</label>
                                <p className="text-xs text-[var(--muted)] mb-2">
                                    Save your SMTP settings first, then send a test to confirm they actually work — send failures are otherwise only logged server-side and never shown here.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className={`${inputClass} sm:flex-1`}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleTestEmail}
                                        disabled={testingEmail || !testEmail}
                                        className="bg-[var(--overlay-med)] text-[var(--text)] px-4 py-2 rounded hover:bg-[var(--overlay-strong)] disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {testingEmail ? 'Sending...' : 'Send Test Email'}
                                    </button>
                                </div>
                                {testResult && (
                                    <p className={`text-sm mt-2 px-3 py-2 rounded ${testResult.ok ? 'pill-green' : 'bg-red-500/12 border border-red-500/30 text-red-300'}`}>
                                        {testResult.text}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className={sectionClass}>
                            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Security &amp; Password Policy</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={labelClass}>Minimum Password Length</label>
                                    <input type="number" min={6} name="passwordMinLength" value={formData.passwordMinLength} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Session Timeout (minutes)</label>
                                    <input type="number" min={5} name="sessionTimeoutMinutes" value={formData.sessionTimeoutMinutes} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Max Failed Login Attempts</label>
                                    <input type="number" min={1} name="maxLoginAttempts" value={formData.maxLoginAttempts} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Lockout Duration (minutes)</label>
                                    <input type="number" min={1} name="lockoutDurationMinutes" value={formData.lockoutDurationMinutes} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" name="passwordRequireUppercase" id="passwordRequireUppercase" checked={formData.passwordRequireUppercase} onChange={handleChange} />
                                    <label htmlFor="passwordRequireUppercase" className="text-sm text-[var(--text)]">Require an uppercase letter</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" name="passwordRequireNumber" id="passwordRequireNumber" checked={formData.passwordRequireNumber} onChange={handleChange} />
                                    <label htmlFor="passwordRequireNumber" className="text-sm text-[var(--text)]">Require a number</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" name="passwordRequireSpecialChar" id="passwordRequireSpecialChar" checked={formData.passwordRequireSpecialChar} onChange={handleChange} />
                                    <label htmlFor="passwordRequireSpecialChar" className="text-sm text-[var(--text)]">Require a special character</label>
                                </div>
                            </div>
                        </div>

                        <div className={sectionClass}>
                            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Workflow Automation</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Idle Case Alert (days)</label>
                                    <input type="number" min={1} name="caseIdleDays" value={formData.caseIdleDays} onChange={handleChange} className={inputClass} />
                                    <p className="text-xs text-[var(--faint)] mt-1">Notify the case handler if a case sits with no activity this long.</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Archive Closed Cases After (days)</label>
                                    <input type="number" min={1} name="caseArchiveDays" value={formData.caseArchiveDays} onChange={handleChange} className={inputClass} />
                                    <p className="text-xs text-[var(--faint)] mt-1">Automatically archive a case this many days after it's closed.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-[var(--brand)] text-white px-6 py-2.5 rounded hover:bg-[var(--brand-hover)] disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </form>
                </div>
            </main>
        </>
    );
}
