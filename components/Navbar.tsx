import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';
import { useAuthStore } from '@/store/useAuthStore';

interface NavbarProps {
    editorView?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ editorView }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const { openAuth } = useAuthStore();

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && menuOpen) {
                setMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [menuOpen]);

    const isActive = (path: string) => location.pathname === path;

    const navLinks = [
        { to: '/gallery', label: 'Gallery' },
        { to: '/about', label: 'About' },
        { to: '/help', label: 'Help' }
    ];

    return (
        <>
            <header className="flex items-center justify-between px-4 md:px-8 py-4 z-50 border-b border-white/10 bg-background-dark/60 backdrop-blur-xl sticky top-0">
                {/* Left: Hamburger (mobile) + Logo + Nav Links (desktop) */}
                <div className="flex items-center gap-4 md:gap-8">
                    {/* Hamburger Menu Icon (mobile only) */}
                    {!editorView && (
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden size-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                            aria-label="Toggle menu"
                        >
                            <span className="material-symbols-outlined text-[28px]">
                                {menuOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    )}

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <h1 className="text-xl font-bold tracking-normal uppercase">
                            Glitch<span className="text-primary">Brain</span>
                            <span className="lowercase">.io</span>
                        </h1>
                    </Link>

                    {/* Desktop Navigation Links */}
                    {!editorView && (
                        <nav className="hidden md:flex items-center gap-6">
                            {navLinks.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`text-sm font-bold uppercase tracking-widest transition-colors ${isActive(link.to)
                                        ? 'text-primary active-glow'
                                        : 'text-white/60 hover:text-white'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>

                {/* Right: UserMenu */}
                <div className="flex items-center gap-3 md:gap-6">
                    <UserMenu />
                </div>
            </header>

            {/* Mobile Hamburger Menu */}
            {menuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setMenuOpen(false)}
                    />

                    {/* Menu Panel - slides from left */}
                    <div className="absolute left-0 top-0 bottom-0 w-[280px] glass-panel border-r border-white/10 animate-in slide-in-from-left duration-300 flex flex-col">
                        {/* Close Button */}
                        <div className="flex justify-end p-4 border-b border-white/10">
                            <button
                                onClick={() => setMenuOpen(false)}
                                className="size-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-white/80">close</span>
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <nav className="flex flex-col p-6 gap-4">
                            {navLinks.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`text-base font-bold uppercase tracking-widest transition-colors py-2 ${isActive(link.to)
                                        ? 'text-primary active-glow'
                                        : 'text-white/80 hover:text-white'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Auth (logged-out only) */}
                        {!user && (
                            <div className="mt-auto p-6 border-t border-white/10 space-y-4">
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            openAuth('login');
                                        }}
                                        className="w-full py-2.5 rounded-lg border border-primary text-primary font-bold text-sm uppercase tracking-widest hover:bg-primary/10 transition-all"
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => {
                                            openAuth('signup');
                                        }}
                                        className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/80 text-white font-bold text-sm uppercase tracking-widest cyber-glow transition-all"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
