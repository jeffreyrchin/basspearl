import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLegalStore } from '../store/useLegalStore';
import { useAuthStore } from '../store/useAuthStore';
import { analytics } from '../services/analytics';

const AuthModal = () => {
    const { openLegal } = useLegalStore();
    const { isAuthOpen, authMode, closeAuth, setAuthMode } = useAuthStore();
    const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        if (isAuthOpen) {
            setError(null);
            setAgreedToTerms(false);
            analytics.auth.view(authMode);
        }
    }, [isAuthOpen, authMode]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isAuthOpen) {
                closeAuth();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isAuthOpen, closeAuth]);

    if (!isAuthOpen) return null;

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            analytics.auth.google.succeeded(authMode);
            closeAuth();
        } catch (err: any) {
            analytics.auth.google.failed(err);
            setError(getErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (authMode === 'signup' && !agreedToTerms) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (authMode === 'login') {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password, displayName);
            }
            analytics.auth.email.succeeded(authMode);
            closeAuth();
        } catch (err: any) {
            analytics.auth.email.failed(err);
            setError(getErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };

    const getErrorMessage = (code: string): string => {
        switch (code) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Try logging in instead.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/weak-password':
                return 'Password must be at least 6 characters.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Invalid email or password.';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later.';
            case 'auth/popup-closed-by-user':
                return 'Sign-in was cancelled.';
            default:
                return 'An error occurred. Please try again.';
        }
    };

    const toggleMode = () => {
        setAuthMode(authMode === 'login' ? 'signup' : 'login');
        setError(null);
        setAgreedToTerms(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={closeAuth}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 glass-panel rounded-3xl border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-300">
                {/* Header Gradient */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={closeAuth}
                    className="absolute top-4 right-4 size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
                >
                    <span className="material-symbols-outlined text-white/60">close</span>
                </button>

                <div className="relative p-8 pt-12">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="size-10 text-primary active-glow">
                            <span className="material-symbols-outlined text-[40px]">vibration</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-center tracking-tight uppercase mb-1">
                        {authMode === 'login' ? 'Welcome Back' : 'Join GlitchBrain'}
                    </h2>
                    <p className="text-white/40 text-center text-sm mb-8">
                        {authMode === 'login'
                            ? 'Sign in for unlimited uploads'
                            : 'Create an account for unlimited uploads'}
                    </p>

                    {/* Google Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white text-gray-800 font-bold text-sm uppercase tracking-wider hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6 shadow-lg shadow-white/10"
                    >
                        <svg className="size-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        {authMode === 'signup' && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Consent Checkbox */}
                        {authMode === 'signup' && (
                            <div className="flex items-start gap-3 mt-4">
                                <div className="relative flex items-center justify-center size-5 shrink-0">
                                    <input
                                        type="checkbox"
                                        id="terms-checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="peer size-5 appearance-none rounded-md border border-white/20 bg-white/5 checked:!bg-primary checked:!border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 accent-primary transition-all cursor-pointer"
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                                        <span className="material-symbols-outlined text-[16px] font-bold leading-none">check</span>
                                    </span>
                                </div>
                                <label htmlFor="terms-checkbox" className="text-xs text-white/60 cursor-pointer select-none leading-relaxed pt-0.5">
                                    I agree to the GlitchBrain.io<span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => { e.preventDefault(); openLegal(); }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                openLegal();
                                            }
                                        }}
                                        className="text-white hover:underline hover:text-primary transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded px-0.5"
                                    >Terms of Service and Privacy Policy</span>.
                                </label>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || (authMode === 'signup' && !agreedToTerms)}
                            className={`w-full py-3.5 rounded-xl bg-black border border-primary hover:bg-primary/30 text-white font-bold text-sm uppercase tracking-widest cyber-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${authMode === 'signup' && !agreedToTerms ? 'opacity-50 grayscale' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                authMode === 'login' ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <p className="text-center text-white/40 text-sm mt-6">
                        {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                        <button
                            onClick={toggleMode}
                            className="ml-2 text-primary hover:text-primary/80 font-bold uppercase tracking-wider transition-colors"
                        >
                            {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
