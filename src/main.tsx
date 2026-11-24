import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for offline reptile field guide & emergency contacts
registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent("antidote-offline-ready"));
  },
});

// Global Maps JS API quota / auth failure listeners (Tier 1 Quota Defense)
(window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
};

const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(" ");
  if (
    msg.includes("OverQuotaMapError") ||
    msg.includes("QuotaExceededError")
  ) {
    window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
  }
};

createRoot(document.getElementById("root")!).render(<App />);
