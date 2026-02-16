// Analytics Service Utility
// Handles event tracking for Google Analytics 4

export type AnalyticsEvent =
    | 'toggle_playback'
    | 'effect_toggled'
    | 'image_upload_succeeded'
    | 'audio_upload_succeeded'
    | 'audio_upload_failed'
    | 'export_started'
    | 'export_succeeded'
    | 'export_failed'
    | 'auth_google_succeeded'
    | 'auth_google_failed'
    | 'auth_email_succeeded'
    | 'auth_email_failed'
    | 'auth_view'
    | 'preset_loaded';

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

export const trackPageView = (pagePath: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'page_view', {
            page_path: pagePath,
        });
    }
};
