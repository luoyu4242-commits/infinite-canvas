import localforage from "localforage";

// Upstream expects synchronous reads; hydrate before importing its store.
const database = localforage.createInstance({ name: "xingcheng-director" });
const cache = new Map<string, string>();
let writes = Promise.resolve();
export async function hydrateDirectorStorage() {
  await database.iterate<string, void>((value, key) => { cache.set(key, value); });
}
export const directorStorage = {
  getItem: (key: string) => cache.get(key) ?? null,
  setItem(key: string, value: string) {
    cache.set(key, value);
    writes = writes.then(async () => { await database.setItem(key, value); }).catch(reportError);
  },
  removeItem(key: string) {
    cache.delete(key);
    writes = writes.then(() => database.removeItem(key)).catch(reportError);
  },
};
function reportError(error: unknown) {
  window.parent.postMessage({ type: "xingcheng:director-error", message: `导演台本地保存失败：${String(error)}` }, window.location.origin);
}
