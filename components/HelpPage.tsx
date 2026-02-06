import React, { useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import Navbar from './Navbar';
import HelpContent from './content/HelpContent';
import AuthModal from './AuthModal';
import LegalConsentModal from './LegalConsentModal';
import { FEEDBACK_FORM_URL } from '../constants';

const HelpPage: React.FC = () => {
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [legalModalOpen, setLegalModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

    const openAuthModal = (mode: 'login' | 'signup') => {
        setAuthMode(mode);
        setAuthModalOpen(true);
    };

    const handleOpenLegal = (force: boolean) => {
        setLegalModalOpen(true);
    };

    return (
        <AuthProvider>
            <div className="min-h-screen flex flex-col bg-background-dark text-white">
                <Navbar
                    onLoginClick={() => openAuthModal('login')}
                    onSignupClick={() => openAuthModal('signup')}
                />

                <main className="flex-1 relative grid-bg">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                    <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
                        <div className="text-center mb-12 md:mb-16">
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6 active-glow">
                                Help & <span className="text-primary">Documentation</span>
                            </h1>
                        </div>

                        <HelpContent />
                    </div>
                </main>

                <footer className="py-4 md:h-8 bg-[#050510] border-t border-white/5 px-4 md:px-6 flex flex-row items-center justify-between gap-4 z-50">
                    <span className="text-[11px] font-bold tracking-widest text-white/70 uppercase">© 2026 GlitchBrain<span className="lowercase">.io</span></span>
                    <div className="flex items-center gap-6 text-[11px] font-bold tracking-widest text-white/70 uppercase">
                        <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors uppercase">Feedback</a>
                        <button onClick={() => handleOpenLegal(false)} className="hover:text-white transition-colors uppercase">Privacy & Terms</button>
                    </div>
                </footer>

                <AuthModal
                    isOpen={authModalOpen}
                    onClose={() => setAuthModalOpen(false)}
                    initialMode={authMode}
                />

                <LegalConsentModal
                    isOpen={legalModalOpen}
                    onClose={() => setLegalModalOpen(false)}
                    onConfirm={() => setLegalModalOpen(false)}
                    isForced={false}
                />
            </div>
        </AuthProvider>
    );
};

export default HelpPage;
