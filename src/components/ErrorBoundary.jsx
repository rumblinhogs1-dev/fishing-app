import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    // If it was a chunk loading error, reload the page to get fresh assets
    if (this.state.error?.message?.includes('dynamically imported module') || this.state.error?.message?.includes('Loading chunk')) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = import.meta.env.BASE_URL || '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <svg className={styles.icon} width="48" height="48" viewBox="0 0 24 24" fill="#e65100">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.message}>
              This feature ran into an error. The rest of the app should still work fine.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className={styles.detail}>{this.state.error.message}</pre>
            )}
            <div className={styles.actions}>
              <button className={styles.retryBtn} onClick={this.handleRetry}>
                Try Again
              </button>
              <button className={styles.homeBtn} onClick={this.handleGoHome}>
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
