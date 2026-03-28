import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '@/store/useAuthStore';

interface UserMenuProps {
}

const UserMenu: React.FC<UserMenuProps> = () => {
    const { user, signOut, isLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const { openAuth } = useAuthStore();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                menuRef.current && !menuRef.current.contains(e.target as Node)
            ) {
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
                    onClick={() => openAuth('login')}
                    className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors"
                >
                    Login
                </button>
                <button
                    onClick={() => openAuth('signup')}
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

    const menuContent = (
        <div
            ref={menuRef}
            className="fixed w-64 bg-black/90 rounded-xl overflow-hidden border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-overlay"
            style={{
                top: triggerRef.current ? triggerRef.current.getBoundingClientRect().bottom + 8 : 0,
                right: triggerRef.current ? window.innerWidth - triggerRef.current.getBoundingClientRect().right : 0
            }}
        >
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
    );

    return (
        <div className="relative">
            <button
                ref={triggerRef}
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

            {isOpen && createPortal(menuContent, document.body)}
        </div>
    );
};

export default UserMenu;
