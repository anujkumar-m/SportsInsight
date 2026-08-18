// ─── components/common/ErrorBoundary.jsx ───────────────────
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '../ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-6 text-center shadow-lg space-y-4">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Something went wrong</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                An unexpected interface error occurred. You can reload this view or return to the dashboard.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 rounded-lg bg-destructive/5 border border-destructive/15 p-2 text-left text-[11px] font-mono text-destructive max-h-24 overflow-y-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={RefreshCw}
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button
                size="sm"
                leftIcon={Home}
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
