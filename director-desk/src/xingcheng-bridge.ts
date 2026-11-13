import { useDirectorStore } from "./editor/store/directorStore";
import { parseDirectorProjectDocument } from "./editor/io/projectDocument";

let connected = false;
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin || event.source !== window.parent) return;
  if (event.data?.type !== "xingcheng:director-init" || connected) return;
  try {
    if (event.data.project) useDirectorStore.getState().replaceProject(parseDirectorProjectDocument(event.data.project));
    connected = true;
    window.parent.postMessage({ type: "xingcheng:director-project", project: useDirectorStore.getState().project }, window.location.origin);
    window.parent.postMessage({ type: "xingcheng:director-initialized" }, window.location.origin);
  } catch (error) {
    window.parent.postMessage({ type: "xingcheng:director-error", message: `恢复导演台工程失败：${String(error)}` }, window.location.origin);
  }
});
useDirectorStore.subscribe((state, previous) => {
  if (!connected || state.project === previous.project) return;
  window.parent.postMessage({ type: "xingcheng:director-project", project: state.project }, window.location.origin);
});
