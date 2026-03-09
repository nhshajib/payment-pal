import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// PWA stale cache recovery for iOS Safari
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Blank screen recovery: if #root is empty after 5s, clear caches and reload
setTimeout(() => {
  const root = document.getElementById('root');
  if (root && root.children.length === 0) {
    if ('caches' in window) {
      caches.keys().then((names) => {
        Promise.all(names.map((n) => caches.delete(n))).then(() => {
          location.reload();
        });
      });
    } else {
      location.reload();
    }
  }
}, 5000);

// App entry point
createRoot(document.getElementById("root")!).render(<App />);
