import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import { useAuth } from '../context/AuthContext';
import ModalBackground from './ModalBackground';

const FeedbackModal: React.FC = () => {
    const setIsFeedbackOpen = useEffectStore((s) => s.setIsFeedbackOpen);
    const { user } = useAuth();

    const [type, setType] = useState<'bug' | 'suggestion' | 'other'>('suggestion');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Pre-fill email if user is logged in
    useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
        }
    }, [user]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFeedbackOpen(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [setIsFeedbackOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        const payload = {
            type,
            email: email.trim(),
            message: message.trim(),
            userId: user?.uid || 'guest',
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString(),
        };

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to send feedback' }));
                throw new Error((errorData as any).error || 'Failed to submit feedback.');
            }

            setSubmitStatus('success');
            setMessage('');
        } catch (err: any) {
            console.error('Feedback submission error:', err);
            setSubmitStatus('error');
            setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-pro-modal flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFeedbackOpen(false)}
                className="absolute inset-0 bg-black"
            />

            {/* Modal Body */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative flex flex-col w-full max-w-md max-h-[95vh] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl rounded-xl"
            >
                {/* Background */}
                <ModalBackground macroType="LIQUID" opacity={0.1} />

                <div className="relative p-8 flex flex-col overflow-y-auto custom-scrollbar flex-1 z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-left">
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Send Feedback</h2>
                            <p className="text-xs text-white/60 font-medium">Help us shape the future of basspearl.</p>
                        </div>
                        <button
                            onClick={() => setIsFeedbackOpen(false)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined !text-[20px]">close</span>
                        </button>
                    </div>

                    {submitStatus === 'success' ? (
                        /* Success View */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center text-center py-8 gap-4"
                        >
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                                <span className="material-symbols-outlined text-emerald-400 !text-[36px]">check_circle</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-wide">Thank You!</h3>
                                <p className="text-xs text-white/70 mt-2 max-w-[80%] mx-auto leading-relaxed">
                                    Your feedback has been recorded successfully. We appreciate you taking the time to share your thoughts!
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsFeedbackOpen(false);
                                }}
                                className="mt-4 px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </motion.div>
                    ) : (
                        /* Form View */
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* Feedback Type Selector */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-white/80 uppercase tracking-widest text-left">Feedback Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['suggestion', 'bug', 'other'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setType(t)}
                                            className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer ${type === t
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 ring-0 ring-inset ring-transparent text-white'
                                                : 'bg-black/40 ring-1 ring-inset ring-white/10 hover:ring-white/20 text-white/70 hover:text-white'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Email Address */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="feedback-email" className="text-[10px] font-bold text-white/80 uppercase tracking-widest text-left">
                                    Email Address (Optional)
                                </label>
                                <input
                                    id="feedback-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white text-xs placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all font-medium"
                                />
                            </div>

                            {/* Message / Description */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="feedback-message" className="text-[10px] font-bold text-white/80 uppercase tracking-widest text-left">
                                    Message
                                </label>
                                <div className="w-full rounded-lg bg-black/40 border border-white/10 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all p-[3px] pl-0">
                                    <textarea
                                        id="feedback-message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Describe your issue, feature suggestion, or thoughts here..."
                                        required
                                        rows={5}
                                        disabled={isSubmitting}
                                        className="w-full pl-4 pr-1 py-2 bg-transparent border-none text-white text-xs placeholder-white/40 focus:outline-none focus:ring-0 resize-none custom-scrollbar font-medium"
                                    />
                                </div>
                            </div>

                            {/* Error Alert */}
                            {submitStatus === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-500/10 border border-rose-400/50 text-rose-300 text-xs text-left font-medium"
                                >
                                    <span className="material-symbols-outlined text-rose-400 !text-[18px]">error</span>
                                    <span>An error occurred: {errorMessage}</span>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !message.trim()}
                                    className={`w-full flex items-center justify-center border border-none gap-2 py-3.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 ${isSubmitting || !message.trim()
                                        ? 'bg-slate-800 text-white/30 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-900/30 cursor-pointer'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined !text-[16px]">send</span>
                                            Submit Feedback
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default FeedbackModal;
