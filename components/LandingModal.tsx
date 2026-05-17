import React from 'react';
import { motion } from 'framer-motion';
import { useLegalStore } from '../store/useLegalStore';
import { useEffectStore } from '../store/useEffectStore';
import ModalBackground from './ModalBackground';

const LandingModal: React.FC = () => {
    const openLegal = useLegalStore(e => e.openLegal);
    const isMobile = useEffectStore(e => e.isMobile);
    const setIsSidebarOpen = useEffectStore(e => e.setIsSidebarOpen);
    const setIsLandingOpen = useEffectStore(e => e.setIsLandingOpen);

    const setEndlessMode = useEffectStore(e => e.setEndlessMode);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsLandingOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsLandingOpen]);

    const handleEndlessMode = () => {
        setEndlessMode(true);
        setIsLandingOpen(false);
    };

    const handleSandboxMode = () => {
        setEndlessMode(false);
        !isMobile && setIsSidebarOpen(true);
        setIsLandingOpen(false);
    };

    const LandingCard: React.FC<{
        onClick: () => void;
        icon: string;
        label: string;
        description: string;
        color: 'amber' | 'primary';
    }> = ({ onClick, icon, label, description, color }) => {
        const theme = {
            amber: {
                text: 'text-amber-400',
                border: 'border-amber-400',
                glow: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]',
            },
            primary: {
                text: 'text-primary',
                border: 'border-primary',
                glow: 'shadow-[0_0_20px_rgba(79,70,229,0.4)]',
            }
        }[color];

        return (
            <button
                onClick={onClick}
                className={`flex-1 rounded-3xl border-2 ${theme.border} ${theme.glow} bg-black/40 hover:bg-black/60 transition-all duration-300 will-change-transform group flex flex-col items-center justify-center gap-2 sm:gap-4 p-3 sm:p-8 hover:scale-[1.05] hover:-translate-y-1 active:scale-95 relative overflow-hidden`}
            >
                <div className={`absolute -inset-2 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <span className={`material-symbols-outlined !text-3xl sm:!text-4xl md:!text-5xl ${theme.text} transition-all duration-300 group-hover:scale-110`}>
                    {icon}
                </span>
                <div className="flex flex-col items-center gap-1.5 z-10 text-center px-1">
                    <span className="text-[9px] sm:text-[14px] font-bold uppercase tracking-[0.15em] text-white/90 group-hover:text-white transition-colors">
                        {label}
                    </span>
                    <span className="text-[7px] sm:text-[10px] font-medium uppercase tracking-[0.15em] text-white/60 group-hover:text-white transition-colors">
                        {description}
                    </span>
                </div>
            </button>
        );
    };

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsLandingOpen(false)}
                className="absolute inset-0 bg-black"
            />

            <motion.div
                key="landing-modal-content"
                initial={{ opacity: 1, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                data-section="modal"
                className="relative w-[80vw] max-w-4xl bg-[#0a0a1a] rounded-2xl border border-white/5 max-h-[90vh] overflow-hidden custom-scrollbar flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
                {/* Liquid Background */}
                <ModalBackground macroType='LIQUID' />

                <div className="relative w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center custom-scrollbar">
                    {/* Close Button */}
                    <button
                        onClick={() => setIsLandingOpen(false)}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all z-10"
                        title="Close"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>

                    {/* Header Section */}
                    <div className="w-full text-center pt-8 pb-4">
                        <motion.h1
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="text-2xl font-bold tracking-normal bg-gradient-to-r from-primary via-indigo-300 to-white bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-move will-change-transform">
                            basspearl
                        </motion.h1>
                        <motion.p
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="text-xs font-medium tracking-widest text-white/60 will-change-transform">animate your sound</motion.p>
                    </div>

                    {/* Body Section */}
                    <div className="w-full p-8 pt-4">
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <LandingCard
                                onClick={handleEndlessMode}
                                icon="all_inclusive"
                                label="Endless AI"
                                description="Infinite scene generator"
                                color="amber"
                            />

                            <LandingCard
                                onClick={handleSandboxMode}
                                icon="edit"
                                label="Sandbox"
                                description="Build your own visuals"
                                color="primary"
                            />
                        </div>

                        {/* Disclaimer */}
                        <div className="mt-8 flex flex-col items-center">
                            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest leading-relaxed text-center max-w-xl">
                                <span className="text-amber-300">This application can produce rapid flashing, strobing, and high-contrast effects that may trigger seizures. </span>
                                <span className="text-white/90">By continuing, you acknowledge that you have the rights to your media and agree to our <button onClick={openLegal} className="text-primary hover:text-white font-bold uppercase cursor-pointer underline decoration-1 underline-offset-2 transition-colors">Privacy & Terms.</button></span>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingModal;
