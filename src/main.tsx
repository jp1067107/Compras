import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

declare global {
  interface Window {
    __SOMMA_MOUNTED__?: boolean;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  window.__SOMMA_MOUNTED__ = true;
  const fallback = document.getElementById('somma-boot-fallback');
  if (fallback) {
    fallback.remove();
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}

// Register service worker after initial render so it never interferes with first paint
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      registerSW({
        immediate: false,
        onRegisterError(error) {
          console.warn('Service worker registration skipped:', error);
        },
      });
    } catch {
      // Ignore SW errors in restricted environments
    }
  });
}
