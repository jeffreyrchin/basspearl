import React from 'react';
import { useExportCredits } from '../hooks/useExportCredits';

interface ExportCreditsDisplayProps {
    variant?: 'badge' | 'inline';
    onLoginClick?: () => void;
}

const ExportCreditsDisplay: React.FC<ExportCreditsDisplayProps> = ({
    variant = 'badge',
    onLoginClick
}) => {
    const { exportsRemaining, hasUnlimited, maxFreeExports, exportsUsed } = useExportCredits();

    if (hasUnlimited) {
        if (variant === 'inline') {
            return (
                <div className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-[14px]">all_inclusive</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest">Unlimited</span>
                </div>
            );
        }
        return null;
    }

    const percentage = ((maxFreeExports - exportsUsed) / maxFreeExports) * 100;
    const isLow = exportsRemaining <= 2;
    const isEmpty = exportsRemaining === 0;

    if (variant === 'inline') {
        return (
            <div className={`flex items-center gap-1.5 ${isEmpty ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-white/50'}`}>
                <span className="material-symbols-outlined text-[14px]">download</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">
                    {exportsRemaining} / {maxFreeExports} Exports
                </span>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer hover:bg-white/5 ${isEmpty
                    ? 'border-red-500/30 bg-red-500/10'
                    : isLow
                        ? 'border-yellow-500/30 bg-yellow-500/10'
                        : 'border-white/10 bg-white/5'
                }`}
            onClick={onLoginClick}
            title="Sign in for unlimited exports"
        >
            {/* Progress Ring */}
            <div className="relative size-5">
                <svg className="size-5 -rotate-90">
                    <circle
                        cx="10"
                        cy="10"
                        r="8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-white/10"
                    />
                    <circle
                        cx="10"
                        cy="10"
                        r="8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${percentage * 0.5} 50`}
                        className={isEmpty ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-primary'}
                    />
                </svg>
            </div>

            <span className={`text-[10px] font-bold uppercase tracking-widest ${isEmpty ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-white/70'
                }`}>
                {exportsRemaining} Export{exportsRemaining !== 1 ? 's' : ''} Left
            </span>

            {!hasUnlimited && (
                <span className="material-symbols-outlined text-[14px] text-primary">
                    arrow_forward
                </span>
            )}
        </div>
    );
};

export default ExportCreditsDisplay;
