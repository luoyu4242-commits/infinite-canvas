import { readdirSync, readFileSync } from "node:fs";
import type { Server } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import { parseChangelog } from "./src/lib/release";

const webDir = dirname(fileURLToPath(import.meta.url));
const localVersion = readFileSync(resolve(webDir, "../VERSION"), "utf8").trim() || "dev";
const localChangelog = readFileSync(resolve(webDir, "../CHANGELOG.md"), "utf8");

function directorDesk(): Plugin {
    let close: (() => Promise<void>) | undefined;
    let base = "/";
    let building = false;
    const load = () => import(pathToFileURL(resolve(webDir, "../director-desk/host.mjs")).href);
    return {
        name: "director-desk",
        configResolved(config) { base = config.base; building = config.command === "build"; },
        async configureServer(server) {
            const { serveDirector } = await load();
            const director = await serveDirector(base);
            close = () => director.close();
            server.middlewares.use((req, res, next) => {
                if (req.url?.startsWith(`${base}director-desk/`)) director.middlewares(req, res, next);
                else next();
            });
        },
        async buildStart() {
            if (building) await (await load()).buildDirector(base);
        },
        async closeBundle() { await close?.(); },
    };
}

function localProxy(): Plugin {
    const address = "http://127.0.0.1:23210";
    let ownedProxy: Server | undefined;
    const stop = () => {
        ownedProxy?.close();
        ownedProxy?.closeAllConnections();
        ownedProxy = undefined;
    };
    const start = async (server: { httpServer: Server | null; config: { logger: { info(message: string): void } } }) => {
        // Load only when serving: static Docker builds do not include canvas-proxy.
        const proxyModule = pathToFileURL(resolve(webDir, "../canvas-proxy/index.js")).href;
        const { createProxyServer } = await import(proxyModule);
        const proxy: Server = createProxyServer();
        try {
            await new Promise<void>((resolve, reject) => {
                proxy.once("error", reject);
                proxy.listen(23210, "127.0.0.1", () => {
                    proxy.off("error", reject);
                    resolve();
                });
            });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "EADDRINUSE") throw error;
            const response = await fetch(address);
            const info = await response.json().catch(() => null);
            if (!response.ok || info?.app !== "infinite-canvas" || info?.proxy !== "infinite-canvas-proxy") {
                throw new Error(`本地代理端口 23210 被其他服务占用，请释放端口后重新启动项目。`);
            }
            server.config.logger.info(`[本地代理] 复用已运行的代理 ${address}`);
            return;
        }
        ownedProxy = proxy;
        server.httpServer?.once("close", stop);
        server.config.logger.info(`[本地代理] 已自动启动 ${address}`);
    };
    return {
        name: "local-proxy",
        configureServer: start,
        configurePreviewServer: start,
        closeBundle: stop,
    };
}

// Expose /plugins/index.json with local plugin files from public/plugins.
// The frontend can discover and list them when enabled; development reads the directory live, while builds emit a static registry.
function localPluginsManifest(): Plugin {
    const pluginsDir = resolve(webDir, "public/plugins");
    const listLocalPlugins = () => {
        try {
            return readdirSync(pluginsDir)
                .filter((file) => file.endsWith(".js"))
                .sort()
                .map((file) => `/plugins/${file}`);
        } catch {
            return [];
        }
    };
    return {
        name: "local-plugins-manifest",
        configureServer(server) {
            server.middlewares.use("/plugins/index.json", (_req, res) => {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(listLocalPlugins()));
            });
        },
        generateBundle() {
            this.emitFile({ type: "asset", fileName: "plugins/index.json", source: JSON.stringify(listLocalPlugins()) });
        },
    };
}

export default defineConfig({
    base: process.env.VITE_BASE || "/",
    plugins: [react(), localProxy(), directorDesk(), localPluginsManifest()],
    resolve: {
        alias: {
            "@": resolve(webDir, "src"),
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(localVersion),
        __APP_RELEASES__: JSON.stringify(parseChangelog(localChangelog)),
    },
});
