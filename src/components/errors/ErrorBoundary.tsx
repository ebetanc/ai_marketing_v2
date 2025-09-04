import React from "react";

export interface ErrorBoundaryProps {
  /** Fallback renderer. If omitted a default minimal UI is shown. */
  fallback?: (args: { error: Error; reset: () => void }) => React.ReactNode;
  /** When any of these values change, the boundary auto-resets. */
  resetKeys?: any[];
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  prevResetKeys?: any[] | undefined;
}

/** Lightweight error boundary (avoids adding react-error-boundary dep). */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
    prevResetKeys: this.props.resetKeys,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta?.env?.DEV) {
      console.error("[ErrorBoundary] Caught error:", error, info);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    if (!this.state.error) return;
    if (!resetKeys || !resetKeys.length) return;
    const changed =
      !prevProps.resetKeys ||
      resetKeys.length !== prevProps.resetKeys.length ||
      resetKeys.some((v, i) => v !== prevProps.resetKeys![i]);
    if (changed) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback)
        return this.props.fallback({ error, reset: this.reset });
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4 bg-gray-50">
          <h1 className="text-xl font-semibold text-gray-900">
            Something went wrong
          </h1>
          <p className="max-w-md text-sm text-gray-600 break-words">
            {error.message}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.reset}
              className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-white text-sm font-medium hover:bg-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
