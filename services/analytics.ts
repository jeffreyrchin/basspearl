// Analytics Service Utility
// Handles event tracking for Google Analytics 4

export type AnalyticsEvent =
    | 'playback_toggled'
    | 'effect_added'
    | 'effect_removed'
    | 'image_upload_started'
    | 'image_upload_succeeded'
    | 'image_upload_failed'
    | 'audio_upload_started'
    | 'audio_upload_succeeded'
    | 'audio_upload_failed'
    | 'export_started'
    | 'export_succeeded'
    | 'export_failed'
    | 'auth_google_succeeded'
    | 'auth_google_failed'
    | 'auth_email_succeeded'
    | 'auth_email_failed'
    | 'auth_view';

interface EventParams {
    [key: string]: any;
}

export const trackEvent = (eventName: AnalyticsEvent, params: EventParams = {}) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, {
            ...params,
            timestamp: new Date().toISOString(),
            app_version: '1.0.0'
        });

        if (import.meta.env.DEV) {
            console.log(`[Analytics] Event: ${eventName}`, params);
        }
    }
};

/**
 * Domain-Specific Trackers (Analytics Mapping)
 * These abstract away the parameter names and event types.
 */

export const analytics = {
    audio: {
        started: (file: File) => trackEvent('audio_upload_started', {
            file_size: file.size,
            file_type: file.type
        }),
        succeeded: (file: File, duration: number) => trackEvent('audio_upload_succeeded', {
            file_size: file.size,
            file_type: file.type,
            duration
        }),
        failed: (file: File, err: any) => trackEvent('audio_upload_failed', {
            file_size: file.size,
            file_type: file.type,
            error_name: err?.name || 'Error',
            error_message: err?.message || 'Unknown'
        }),
    },
    image: {
        started: (file: File) => trackEvent('image_upload_started', {
            file_size: file.size,
            file_type: file.type
        }),
        succeeded: (file: File, width: number, height: number) => trackEvent('image_upload_succeeded', {
            file_size: file.size,
            file_type: file.type,
            image_width: width,
            image_height: height
        }),
        failed: (file: File, err?: any) => trackEvent('image_upload_failed', {
            file_size: file.size,
            file_type: file.type,
            error_message: err?.message || "Browser failed to decode image source"
        }),
    },
    export: {
        started: () => trackEvent('export_started'),
        succeeded: (effects: any[]) => trackEvent('export_succeeded', {
            processing_effects: effects.filter(e => !e.muted).map(e => e.type).join(', ')
        }),
        failed: (err: any) => trackEvent('export_failed', {
            error_name: err?.name || 'Error',
            error_message: err?.message || 'Unknown'
        }),
    },
    playback: {
        toggled: (isPlaying: boolean) => trackEvent('playback_toggled', { isPlaying }),
    },
    effect: {
        added: (type: string) => trackEvent('effect_added', { effect_type: type }),
        removed: (type: string) => trackEvent('effect_removed', { effect_type: type }),
    },
    auth: {
        view: (authMode: string) => trackEvent('auth_view', { mode: authMode }),
        google: {
            succeeded: (authMode: string) => trackEvent('auth_google_succeeded', { mode: authMode }),
            failed: (err: any) => trackEvent('auth_google_failed', {
                error_name: err.name || 'Unknown error name',
                error_code: err.code || 'Unknown error code',
                error_message: err.message || 'Unknown Google authentication error'
            }),
        },
        email: {
            succeeded: (authMode: string) => trackEvent('auth_email_succeeded', { mode: authMode }),
            failed: (err: any) => trackEvent('auth_email_failed', {
                error_name: err.name || 'Unknown error name',
                error_code: err.code || 'Unknown error code',
                error_message: err.message || 'Unknown email authentication error'
            }),
        },
    }
};

export const trackPageView = (pagePath: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'page_view', {
            page_path: pagePath,
        });
    }
};
