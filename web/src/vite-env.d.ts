/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __APP_RELEASES__: import("@/lib/release").ReleaseInfo[];

interface ImportMetaEnv {
    // OSS 浏览器直传配置，来自 web/.env；这些值会包含在前端构建产物中。
    readonly VITE_OSS_REGION?: string;
    readonly VITE_OSS_ACCESS_KEY_ID?: string;
    readonly VITE_OSS_ACCESS_KEY_SECRET?: string;
    readonly VITE_OSS_BUCKET?: string;
    // Comma-separated local development plugin URLs, refetched on every startup without caching or persistence.
    readonly VITE_DEV_PLUGINS?: string;
    // Optional build-time analytics configuration, with one independent variable per provider.
    // GA4 measurement ID (G-XXXX)
    readonly VITE_ANALYTICS_GA4_ID?: string;
    // Baidu Analytics site ID
    readonly VITE_ANALYTICS_BAIDU_ID?: string;
}
