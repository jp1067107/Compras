import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Register service worker safely for offline mode & PWA installability
try {
  if ('serviceWorker' in navigator) {
    registerSW({
      immediate: true,
      onRegisterError(error) {
        console.warn('Service worker registration skipped:', error);
      },
    });
  }
} catch {
  // Ignore SW errors in restricted environments
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
