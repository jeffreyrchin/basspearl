import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface UserMenuProps {
    onLoginClick: () => void;
    onSignupClick: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onLoginClick, onSignupClick }) => {
    const { user, signOut, isLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="size-9 rounded-full bg-white/5 animate-pulse" />
        );
    }

    if (!user) {
        return (
            <div className="flex items-center gap-4">
                <button
                    onClick={onLoginClick}
                    className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors"
                >
                    Login
                </button>
                <button
                    onClick={onSignupClick}
                    className="hidden sm:block bg-black border border-primary hover:bg-primary/30 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                >
                    Sign Up
                </button>
            </div>
        );
    }

    const initials = user.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email?.slice(0, 2).toUpperCase() || 'U';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 group"
            >
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="size-9 rounded-full border-2 border-primary/40 hover:border-primary transition-colors object-cover"
                    />
                ) : (
                    <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-white border-2 border-primary/40 hover:border-primary transition-colors">
                        {initials}
                    </div>
                )}
                <span className="material-symbols-outlined text-white/40 group-hover:text-white/60 transition-colors text-[18px]">
                    {isOpen ? 'expand_less' : 'expand_more'}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    {/* User Info */}
                    <div className="p-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || 'User'}
                                    className="size-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-white">
                                    {initials}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">
                                    {user.displayName || 'GlitchBrain User'}
                                </p>
                                <p className="text-xs text-white/40 truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pro Badge */}
                    <div className="p-4 border-b border-white/5">
                        <div className="flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined text-[18px]">all_inclusive</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Unlimited Uploads</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                        <button
                            onClick={async () => {
                                await signOut();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
