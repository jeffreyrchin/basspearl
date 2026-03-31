import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FrequencyBand } from '../types';
import { useEffectStore } from '../store/useEffectStore';
import { AnimatePresence, motion } from 'framer-motion';

interface FrequencyDropdownProps {
    value: FrequencyBand;
    onChange: (band: FrequencyBand) => void;
    ariaLabel?: string;
    id: string;
}

const BANDS: FrequencyBand[] = ['OFF', 'SUB', 'BASS', 'MID', 'TREBLE'];

export const FrequencyDropdown: React.FC<FrequencyDropdownProps> = ({ value, onChange, ariaLabel, id }) => {
    const activeDropdownId = useEffectStore(s => s.activeDropdownId);
    const setActiveDropdownId = useEffectStore(s => s.setActiveDropdownId);
    const isOpen = activeDropdownId === id;

    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ opacity: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Escape sidebar clipping by using Portals + Fixed positioning
    useLayoutEffect(() => {
        if (isOpen && dropdownRef.current) {
            const updateStyles = () => {
                const rect = dropdownRef.current!.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom - 12;
                const spaceAbove = rect.top - 12;
                const flip = spaceBelow < 180 && spaceAbove > spaceBelow;

                setMenuStyle({
                    position: 'fixed',
                    left: `${Math.round(rect.right - 110)}px`, // Anchor to right edge
                    width: '110px',
                    maxHeight: `${Math.round(Math.max(flip ? spaceAbove : spaceBelow, 120))}px`,
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
            key="frequency-dropdown"
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="listbox"
            style={menuStyle}
            data-dropdown-ignore="true"
            className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-y-auto custom-scrollbar"
        >
            <div className="p-1.5 space-y-0.5">
                {BANDS.map((band) => (
                    <button
                        key={band}
                        role="option"
                        aria-selected={value === band}
                        onClick={() => { onChange(band); setActiveDropdownId(null); }}
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors outline-none
                            ${value === band ? 'bg-primary/20 text-primary' : 'text-indigo-300 hover:text-white hover:bg-indigo-300/20 focus:text-white focus:bg-indigo-300/20'}`}
                    >
                        {band}
                    </button>
                ))}
            </div>
        </motion.div>
    );

    return (
        <div className="relative z-50 flex items-center gap-2" ref={dropdownRef} onKeyDown={handleKeyDown}>
            <span className={`material-symbols-outlined transition-colors ${value !== 'OFF' ? 'text-primary' : 'text-indigo-300'}`}>cadence</span>
            <button
                data-dropdown-ignore="true"
                onClick={() => setActiveDropdownId(isOpen ? null : id)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={ariaLabel}
                className={`flex items-center gap-0.5 pl-3 pr-1 rounded-lg border text-[10px] font-bold uppercase tracking-[0.1em] active:scale-95 hover:text-white transition-colors
                    ${value !== 'OFF' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-indigo-300/5 text-indigo-300 border-indigo-300/10'}`}
            >
                <span>{value}</span>
                <motion.span
                    key="frequency-dropdown-arrow"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="material-symbols-outlined text-[18px]"
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
};
