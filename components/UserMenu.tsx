import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useProStore } from '@/store/useProStore';
import { motion } from 'framer-motion';

interface UserMenuProps {
}

const UserMenu: React.FC<UserMenuProps> = () => {
    const { user, signOut, isLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const { openAuth } = useAuthStore();
    const isPro = useProStore(s => s.isPro);
    const openProModal = useProStore(s => s.openProModal);
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
                    className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors duration-200"
                >
                    Sign in
                </button>
                <button
                    onClick={() => openAuth('signup')}
                    className="hidden sm:block bg-black border border-primary hover:bg-primary/30 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors duration-200"
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
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed w-64 bg-black/90 rounded-xl overflow-hidden border border-white/10 shadow-2xl z-overlay"
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
                            {user.displayName || 'basspearl user'}
                        </p>
                        <p className="text-xs text-white/60 truncate">
                            {user.email}
                        </p>
                    </div>
                </div>
            </div>

            {/* Pro Badge / Buy Pro */}
            <div className="p-4 border-b border-white/5">
                {isPro ? (
                    <div className="flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                        <span className="text-xs font-bold uppercase tracking-widest">Lifetime Pro User</span>
                    </div>
                ) : (
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            openProModal();
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-purple-600 hover:from-secondary/80 hover:to-purple-600/80 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors duration-200"
                    >
                        <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                        Buy Lifetime Pro
                    </button>
                )}
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
        </motion.div>
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
                        className="size-9 rounded-full ring-white transition-all duration-200 object-cover group-hover:ring-2"
                    />
                ) : (
                    <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-white ring-white transition-all duration-200 group-hover:ring-2">
                        {initials}
                    </div>
                )}

                <motion.span
                    initial={{ rotate: 0 }}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="material-symbols-outlined text-white/60 group-hover:text-white transition-colors duration-200">
                    expand_more
                </motion.span>
            </button>

            {isOpen && createPortal(menuContent, document.body)}
        </div>
    );
};

export default UserMenu;
