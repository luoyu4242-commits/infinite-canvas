import { createServer, build } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const config = (base) => ({ root, base: `${base}director-desk/`, configFile: resolve(root, "vite.config.ts") });

export async function serveDirector(base) {
    return createServer({ ...config(base), server: { middlewareMode: true, hmr: false } });
}

export async function buildDirector(base) {
    await build({ ...config(base), build: { outDir: resolve(root, "../web/public/director-desk"), emptyOutDir: true } });
}
