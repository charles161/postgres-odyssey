import { Component, type ReactNode } from 'react';
import { colors } from '../config/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-6"
          style={{ background: colors.ocean }}
        >
          {/* Background glow */}
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${colors.glow.critical}15 0%, transparent 50%)`,
            }}
          />

          <div className="relative z-10 text-center max-w-lg">
            {/* Error Icon */}
            <div
              className="text-6xl mb-6"
              style={{ color: colors.glow.critical }}
            >
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                className="mx-auto"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 7V13M12 16V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1
              className="text-2xl font-semibold mb-4"
              style={{ color: colors.text.primary }}
            >
              Something Went Wrong
            </h1>

            <p className="mb-6" style={{ color: colors.text.secondary }}>
              The application encountered an unexpected error. This is like a
              database panic - but don't worry, your progress is safely stored
              in localStorage.
            </p>

            {/* Error Details */}
            <div
              className="mb-8 p-4 rounded-lg font-mono text-sm text-left overflow-auto max-h-32"
              style={{ background: colors.oceanDark }}
            >
              <div style={{ color: colors.glow.critical }}>
                ERROR: {this.state.error?.name || 'UnknownError'}
              </div>
              <div className="mt-1" style={{ color: colors.text.muted }}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all"
                style={{
                  background: colors.glow.healthy + '20',
                  color: colors.glow.healthy,
                  border: `1px solid ${colors.glow.healthy}`,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C5.79086 2 3.86159 3.27477 2.92893 5.12132"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M2 2V5H5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all"
                style={{
                  background: colors.text.muted + '20',
                  color: colors.text.secondary,
                  border: `1px solid ${colors.text.muted}`,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 6L8 2L14 6V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V6Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 14V9H10V14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Go Home
              </button>
            </div>

            {/* Decorative line */}
            <div
              className="mx-auto mt-8 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${colors.text.muted}40, transparent)`,
                width: 200,
              }}
            />

            <p className="mt-4 text-xs" style={{ color: colors.text.muted }}>
              If this keeps happening, try clearing your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
