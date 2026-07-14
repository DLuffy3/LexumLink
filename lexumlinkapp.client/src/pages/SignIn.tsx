import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { AxiosError } from 'axios';
import Spinner from '../components/Spinner';
import ThemeToggle from '../components/ThemeToggle';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { user } = await signIn(email, password);
            if (user.isSuperAdmin) {
                navigate('/super-admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof AxiosError
                ? err.response?.data?.error || 'Sign in failed'
                : 'Sign in failed';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg,var(--bg) 0%,var(--bg2) 55%,var(--bg) 100%)', color: 'var(--text)', fontFamily: "'DMSans', system-ui, sans-serif" }}
        >
            {/* glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-32 right-0 w-[520px] h-[520px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle,var(--glow-1),transparent 70%)' }} />
                <div className="absolute bottom-[-8rem] left-[-6rem] w-[440px] h-[440px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle,var(--glow-2),transparent 70%)' }} />
            </div>

            {/* top nav */}
            <nav className="absolute top-0 left-0 right-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 h-[72px] flex items-center justify-between">
                    <Link to="/" className="font-['Mooxy'] text-2xl font-black tracking-tight" aria-label="LexumLink home">
                        <span style={{ background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lexum</span>
                        <span style={{ color: 'var(--text)' }}>Link</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-[0.08em] uppercase transition-all duration-300 hover:-translate-y-0.5 hover:text-[var(--text)]"
                            style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: 'var(--overlay-weak)' }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            Back to home
                        </Link>
                    </div>
                </div>
            </nav>

            <div
                className="relative z-10 rounded-2xl p-8 w-full max-w-md animate-fade-in-up"
                style={{ background: 'var(--card-glass)', backdropFilter: 'blur(18px)', border: '1px solid var(--border)', boxShadow: '0 30px 80px rgba(0,0,0,0.45)' }}
            >
                <h2 className="text-3xl font-bold text-center mb-2 font-['Grifter']" style={{ color: 'var(--text)' }}>Sign In</h2>
                <p className="text-center mb-6" style={{ color: 'var(--muted)' }}>Welcome back</p>

                {loading ? (
                    <div className="flex items-center justify-center">
                        <Spinner size={24} />
                    </div>
                ) : error && (
                    <div className="bg-red-500/12 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4 animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] outline-none transition-all focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[var(--brand-ring)]"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--overlay-weak)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--faint)] outline-none transition-all focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[var(--brand-ring)]"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full text-white font-semibold py-2.5 rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'var(--grad-fill)', boxShadow: '0 8px 30px rgba(94,0,6,0.40)' }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Signing in...
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
                <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
                    Don't have an account?{' '}
                    <span style={{ color: 'var(--brand-accent)' }}>Contact your administrator</span>
                </p>
            </div>
        </div>
    );
}
