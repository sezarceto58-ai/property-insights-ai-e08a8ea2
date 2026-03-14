import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(<App />);

// ── Register Service Worker (PWA) ──
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[TerraVista] SW registered:", registration.scope);

        // Check for updates every 60s
        setInterval(() => registration.update(), 60_000);

        // Notify app when a new version is waiting
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // A new version is available — could show a toast here
              console.log("[TerraVista] New version available. Refresh to update.");
            }
          });
        });
      })
      .catch((err) => console.warn("[TerraVista] SW registration failed:", err));
  });
}

// ── Install prompt (Add to Home Screen) ──
let deferredInstallPrompt: any = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  // Expose globally so components can trigger install prompt
  (window as any).__tvInstallPrompt = deferredInstallPrompt;
});
