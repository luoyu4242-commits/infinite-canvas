import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { fileURLToPath } from "node:url";
const root = dirname(fileURLToPath(import.meta.url));

const localGuoAssetsAvailable = existsSync(resolve(root, "public/local-assets/guo-3d-assets"));
const appVersion = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).version ?? "0.0.0";
const requiredMixamoCharacters = ["camille.fbx", "xbot.glb", "soldier.glb"];
const localMixamoCharacterAvailable = requiredMixamoCharacters.every((fileName) =>
  existsSync(resolve(root, "public/local-assets/mixamo/characters", fileName))
);
const requiredMixamoAnimations = [
  "walk.fbx",
  "run.fbx",
  "sit-stand.fbx",
  "side-step-left.fbx",
  "jump.fbx",
  "wave.fbx",
];
const localMixamoAnimationsAvailable = requiredMixamoAnimations.every((fileName) =>
  existsSync(resolve(root, "public/local-assets/mixamo/animations", fileName))
);

export default defineConfig({
  base: "./",
  assetsInclude: ["**/*.fbx", "**/*.glb", "**/*.obj"],
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __LOCAL_GUO_ASSETS_AVAILABLE__: JSON.stringify(localGuoAssetsAvailable),
    __LOCAL_MIXAMO_CHARACTER_AVAILABLE__: JSON.stringify(localMixamoCharacterAvailable),
    __LOCAL_MIXAMO_ANIMATIONS_AVAILABLE__: JSON.stringify(localMixamoAnimationsAvailable),
  },
  build: { rollupOptions: { input: resolve(root, "index.html") } },
});
