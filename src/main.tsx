import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker only in production and not in Lovable preview
if (typeof window !== 'undefined' && 
    !window.location.hostname.includes('lovable') && 
    !window.location.hostname.includes('localhost') &&
    'serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      console.log('New content available, please refresh.');
    },
    onOfflineReady() {
      console.log('App ready for offline use.');
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
