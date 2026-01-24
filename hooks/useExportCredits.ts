import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'glitchbrain_exports_used';
const MAX_FREE_EXPORTS = 5;

export const useExportCredits = () => {
    const { user } = useAuth();

    const getExportsUsed = (): number => {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        return stored ? parseInt(stored, 10) : 0;
    };

    const [exportsUsed, setExportsUsed] = useState(getExportsUsed);

    const hasUnlimited = !!user;
    const exportsRemaining = hasUnlimited ? Infinity : Math.max(0, MAX_FREE_EXPORTS - exportsUsed);
    const canExport = hasUnlimited || exportsRemaining > 0;

    const useExport = useCallback((): boolean => {
        if (hasUnlimited) return true;

        const current = getExportsUsed();
        if (current >= MAX_FREE_EXPORTS) return false;

        const newCount = current + 1;
        sessionStorage.setItem(STORAGE_KEY, newCount.toString());
        setExportsUsed(newCount);
        return true;
    }, [hasUnlimited]);

    return {
        exportsRemaining,
        exportsUsed,
        maxFreeExports: MAX_FREE_EXPORTS,
        hasUnlimited,
        canExport,
        useExport
    };
};
