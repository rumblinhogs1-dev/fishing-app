import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import * as Sentry from '@sentry/react';
import './styles/variables.css';
import App from './App.jsx';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
});

window.addEventListener('unhandledrejection', (event) => {
  Sentry.captureException(event.reason);
});

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', color: 'red', fontFamily: 'monospace' }}>
          <h2>Something went wrong</h2>
          <pre style={{fontSize:'0.7rem',whiteSpace:'pre-wrap'}}>{this.state.error.message}</pre>
          <pre style={{fontSize:'0.6rem',whiteSpace:'pre-wrap'}}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Pre-render safe area estimates for Android WebView.
// Uses UA detection so this runs regardless of Capacitor bridge init timing.
// MainActivity.java overrides --sat/--sab after page loads with exact values.
(function initSafeAreaEstimate() {
  if (!/Android/i.test(navigator.userAgent)) return;
  const root = document.documentElement;
  root.style.setProperty('--sat', '48px');
  root.style.setProperty('--sab', '48px');
})();

// Force SW update check on startup + reload the page when a new SW takes control.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
  navigator.serviceWorker.ready.then((registration) => {
    registration.update();
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter basename="/fishing-app">
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
