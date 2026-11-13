import React from "react";
import ReactDOM from "react-dom/client";
import { hydrateDirectorStorage } from "./xingcheng-storage";

async function start() {
  await hydrateDirectorStorage();
  const { default: App } = await import("./App");
  await import("./xingcheng-bridge");
  ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
}
void start().catch((error) => {
  document.getElementById("root")!.textContent = "??????????????" + String(error);
  window.parent.postMessage({ type: "xingcheng:director-error", message: String(error) }, window.location.origin);
});
