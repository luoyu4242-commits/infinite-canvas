export const APP_VERSION = __APP_VERSION__ || "dev";

export const PROJECT_REPOSITORY = "luoyu4242-commits/infinite-canvas";
export const PROJECT_URL = `https://github.com/${PROJECT_REPOSITORY}`;
export const DOCS_URL = import.meta.env.VITE_DOC_URL || `${PROJECT_URL}/tree/main/docs/content/docs`;

// Only load a plugin registry explicitly configured for this deployment.
export const PLUGIN_REGISTRY_URL = import.meta.env.VITE_PLUGIN_REGISTRY_URL || "";
