import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEffectStore } from '../store/useEffectStore';
import { AnimatePresence, motion } from 'framer-motion';

interface Option<T> {
    readonly label: string;
    readonly value: T;
}

interface MenuDropdownProps<T> {
    id: string;
    value: T;
    options: readonly Option<T>[];
    onChange: (value: T) => void;
    label?: string;
    icon?: string;
    className?: string;
}

export function MenuDropdown<T extends string>({
    id,
    value,
    options,
    onChange,
    label,
    icon,
    className = ""
}: MenuDropdownProps<T>) {
    const activeDropdownId = useEffectStore(s => s.activeDropdownId);
    const setActiveDropdownId = useEffectStore(s => s.setActiveDropdownId);
    const isOpen = activeDropdownId === id;

    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ opacity: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Escape clipping using Portals + Fixed positioning (mirrors FrequencyDropdown logic)
    useLayoutEffect(() => {
        if (isOpen && dropdownRef.current) {
            const updateStyles = () => {
                const rect = dropdownRef.current!.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom - 12;
                const spaceAbove = rect.top - 12;
                const flip = spaceBelow < 200 && spaceAbove > spaceBelow;

                setMenuStyle({
                    position: 'fixed',
                    left: `${Math.round(rect.left)}px`,
                    minWidth: `${Math.round(rect.width)}px`,
                    zIndex: 99999,
                    top: flip ? 'auto' : `${Math.round(rect.bottom + 4)}px`,
                    bottom: flip ? `${Math.round(window.innerHeight - rect.top + 4)}px` : 'auto',
                    opacity: 1
                });
            };

            updateStyles();
            window.addEventListener('resize', updateStyles);
            window.addEventListener('scroll', updateStyles, true);
            return () => {
                window.removeEventListener('resize', updateStyles);
                window.removeEventListener('scroll', updateStyles, true);
            };
        }
    }, [isOpen]);

    // Accessibility: Keyboard nav
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setActiveDropdownId(null);
            dropdownRef.current?.querySelector('button')?.focus();
            return;
        }
        if (!isOpen) return;

        const items = Array.from(menuRef.current?.querySelectorAll('button') || []) as HTMLButtonElement[];
        if (items.length === 0) return;

        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            items[(index + 1) % items.length].focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            items[(index - 1 + items.length) % items.length].focus();
        }
    };

    // Auto-focus active item when opening
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                const active = menuRef.current?.querySelector('[aria-selected="true"]') as HTMLButtonElement;
                (active || menuRef.current?.querySelector('button'))?.focus();
            }, 0);
        }
    }, [isOpen]);

    const Menu = (
        <motion.div
            key={`menu-dropdown-${id}`}
            ref={menuRef}
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
            style={menuStyle}
            data-dropdown-ignore="true"
            className="bg-[#0A0F1E] border border-white/10 rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.8)] overflow-hidden"
        >
            <div className="p-1.5 space-y-0.5">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        role="option"
                        aria-selected={value === opt.value}
                        onClick={() => { onChange(opt.value); setActiveDropdownId(null); }}
                        className={`w-full flex items-center px-3 py-1.5 rounded-lg text-[12px] font-medium tracking-wide transition-colors outline-none whitespace-nowrap
                            ${value === opt.value
                                ? 'bg-primary/20 text-primary'
                                : 'text-white hover:bg-white/5 focus:text-white focus:bg-white/5'}`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </motion.div>
    );

    const currentLabel = options.find(o => o.value === value)?.label || label || String(value);

    return (
        <div className={`relative flex items-center gap-2 ${className}`} ref={dropdownRef} onKeyDown={handleKeyDown}>
            {icon && (
                <span className={`material-symbols-outlined text-[18px] transition-colors ${isOpen ? 'text-primary' : 'text-white/40'}`}>
                    {icon}
                </span>
            )}
            <button
                data-dropdown-ignore="true"
                onClick={() => setActiveDropdownId(isOpen ? null : id)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className={`flex items-center gap-1.5 px-2 rounded-md text-[12px] font-medium transition-colors outline-none select-none
                    ${isOpen ? 'text-white' : 'text-white/80 hover:text-white'}`}
            >
                <span className="tabular-nums pb-0.5 tracking-wide">{currentLabel}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="material-symbols-outlined !text-[16px]"
                >
                    expand_more
                </motion.span>
            </button>
            {createPortal(
                <AnimatePresence>
                    {isOpen && Menu}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
