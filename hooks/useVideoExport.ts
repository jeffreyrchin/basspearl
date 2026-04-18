import { useState, useRef, useCallback } from 'react';
import { exportVideo } from '@/services/exportService';
import { analytics } from '@/services/analytics';
import { EffectConfig } from '@/types';

export interface VideoExportParams {
    options: {
        fps: number;
        resolution: number;
    };
    audioBuffer: AudioBuffer | null;
    reactivityMap: any | null; // using any to avoid wide imports, exportVideo handles typing
    integratedReactivity: any | null;
    effects: EffectConfig[];
    duration: number;
}

export const useVideoExport = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportResult, setExportResult] = useState<{ fileUrl: string, fileName: string } | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    const openExportModal = useCallback(() => {
        setIsExportModalOpen(true);
    }, []);

    const closeExportModal = useCallback(() => {
        if (exportResult) {
            URL.revokeObjectURL(exportResult.fileUrl);
            setExportResult(null);
        }
        setIsExportModalOpen(false);
    }, [exportResult]);

    const startExport = useCallback(async ({
        options,
        audioBuffer,
        reactivityMap,
        integratedReactivity,
        effects,
        duration
    }: VideoExportParams) => {
        if (!reactivityMap || !audioBuffer) return;

        setExportResult(null);
        setIsExporting(true);
        setExportProgress(0);

        // Create fresh controller for this export
        abortControllerRef.current = new AbortController();

        try {
            analytics.export.started();
            const result = await exportVideo({
                audioBuffer: audioBuffer,
                reactivityMap: reactivityMap,
                integratedReactivity: integratedReactivity,
                effects: effects,
                duration: duration,
                fps: options.fps,
                targetWidth: options.resolution,
                onProgress: (p) => setExportProgress(p * 100),
                signal: abortControllerRef.current.signal
            });
            analytics.export.succeeded(effects);
            setExportResult(result);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log("Export was canceled by user.");
                return;
            }
            analytics.export.failed(err);
            console.error("Export failed:", err);
            alert("Export failed. See console for details.");
        } finally {
            setIsExporting(false);
            setExportProgress(0);
            abortControllerRef.current = null;
        }
    }, []);

    const cancelExport = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    return {
        isExporting,
        exportProgress,
        isExportModalOpen,
        exportResult,
        openExportModal,
        closeExportModal,
        startExport,
        cancelExport
    };
};
