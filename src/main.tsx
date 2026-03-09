import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// PWA stale cache recovery for iOS Safari
// Detects when the app renders blank due to stale cached JS bundles
if ('serviceWorker' in navigator) {
  // Force activate waiting service worker
  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });

  // Listen for new service worker installations
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Blank screen recovery: if #root is empty after 5s, clear caches and reload
setTimeout(() => {
  const root = document.getElementById('root');
  if (root && root.children.length === 0) {
    if ('caches' in window) {
      caches.keys().then((names: string[]) => {
        Promise.all(names.map((name: string) => caches.delete(name))).then(() => {
          window.location.reload();
        });
      });
    } else {
      window.location.reload();
    }
  }
}, 5000);

// App entry point
createRoot(document.getElementById("root")!).render(<App />);
