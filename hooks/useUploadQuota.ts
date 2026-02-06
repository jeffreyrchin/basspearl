
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const COUNT_KEY = 'glitchbrain_daily_uploads_count';
const DATE_KEY = 'glitchbrain_daily_uploads_date';
const MAX_FREE_UPLOADS = 20;

export const useUploadQuota = () => {
    const { user } = useAuth();

    const getTodayString = () => new Date().toISOString().split('T')[0];

    const getUploadsUsed = (): number => {
        const storedDate = localStorage.getItem(DATE_KEY);
        const today = getTodayString();

        if (storedDate !== today) {
            // Reset if new day
            localStorage.setItem(DATE_KEY, today);
            localStorage.setItem(COUNT_KEY, '0');
            return 0;
        }

        const storedCount = localStorage.getItem(COUNT_KEY);
        return storedCount ? parseInt(storedCount, 10) : 0;
    };

    const [uploadsUsed, setUploadsUsed] = useState(getUploadsUsed);

    // Sync state if localStorage changes (e.g. across tabs or on mount)
    useEffect(() => {
        setUploadsUsed(getUploadsUsed());
    }, []);

    const hasUnlimited = !!user;
    const uploadsRemaining = hasUnlimited ? Infinity : Math.max(0, MAX_FREE_UPLOADS - uploadsUsed);
    const canUpload = hasUnlimited || uploadsRemaining > 0;

    const incrementUploads = useCallback(() => {
        if (hasUnlimited) return;

        const current = getUploadsUsed();
        const newCount = current + 1;

        localStorage.setItem(COUNT_KEY, newCount.toString());
        // Ensure date is set (should be from getUploadsUsed check, but safety first)
        localStorage.setItem(DATE_KEY, getTodayString());

        setUploadsUsed(newCount);
    }, [hasUnlimited]);

    return {
        uploadsRemaining,
        uploadsUsed,
        maxFreeUploads: MAX_FREE_UPLOADS,
        hasUnlimited,
        canUpload,
        incrementUploads
    };
};
