/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
    readonly VITE_LEMON_SQUEEZY_CHECKOUT_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface Window {
    createLemonSqueezy: () => void;
    LemonSqueezy: {
        Setup: (options: {
            eventHandler: (event: { event: string; custom_data?: any }) => void;
        }) => void;
        Url: {
            Open: (url: string) => void;
        };
    };
}
