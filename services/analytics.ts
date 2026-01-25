
// Analytics Service Utility
// Handles event tracking for Google Analytics 4

export type AnalyticsEvent =
    | 'image_upload'
    | 'terms_accepted'
    | 'effect_applied'
    | 'glitch_export'
    | 'auth_success'
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

export const trackPageView = (pagePath: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'page_view', {
            page_path: pagePath,
        });
    }
};
