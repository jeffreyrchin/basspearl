import React from 'react';
import { useUploadQuota } from '../hooks/useUploadQuota';

interface ExportCreditsDisplayProps {
    variant?: 'badge' | 'inline';
    onLoginClick?: () => void;
}

const ExportCreditsDisplay: React.FC<ExportCreditsDisplayProps> = ({
    variant = 'badge',
    onLoginClick
}) => {
    const { uploadsRemaining, hasUnlimited, maxFreeUploads, uploadsUsed } = useUploadQuota();

    if (hasUnlimited) {
        if (variant === 'inline') {
            return (
                <div className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-[14px]">all_inclusive</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest">Unlimited Uploads</span>
                </div>
            );
        }
        return null;
    }

    const percentage = ((maxFreeUploads - uploadsUsed) / maxFreeUploads) * 100;
    const isLow = uploadsRemaining <= 2;
    const isEmpty = uploadsRemaining === 0;

    if (variant === 'inline') {
        return (
            <div className={`flex items-center gap-1.5 ${isEmpty ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-white/50'}`}>
                <span className="material-symbols-outlined text-[14px]">upload_file</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">
                    {uploadsRemaining} / {maxFreeUploads} Uploads
                </span>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border transition-all cursor-pointer hover:bg-white/5 whitespace-nowrap ${isEmpty
                ? 'border-red-500/30 bg-red-500/10'
                : isLow
                    ? 'border-yellow-500/30 bg-yellow-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
            onClick={onLoginClick}
            title="Sign in for unlimited uploads"
        >
            {/* Progress Ring */}
            <div className="relative size-4 sm:size-5">
                <svg className="size-4 sm:size-5 -rotate-90">
                    <circle
                        cx="50%"
                        cy="50%"
                        r="38%"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-white/10"
                    />
                    <circle
                        cx="50%"
                        cy="50%"
                        r="38%"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${percentage * 0.4} 50`}
                        className={isEmpty ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-primary'}
                    />
                </svg>
            </div>

            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${isEmpty ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-white/70'
                }`}>
                {uploadsRemaining} <span className="sm:hidden">LEFT</span><span className="hidden sm:inline"> Upload{uploadsRemaining !== 1 ? 's' : ''} Left</span> <span className="hidden lg:inline">Today</span>
            </span>

            {!hasUnlimited && (
                <span className="material-symbols-outlined text-[14px] text-primary hidden sm:inline">
                    arrow_forward
                </span>
            )}
        </div>
    );
};

export default ExportCreditsDisplay;
