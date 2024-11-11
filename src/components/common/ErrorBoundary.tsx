import React from 'react';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    analyticsService.trackError(error, {
      componentStack: errorInfo.componentStack,
      errorType: error.name,
      errorMessage: error.message
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-red-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <pre className="text-xs bg-red-100 p-4 rounded mb-4 overflow-auto">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <Button
            onClick={this.handleReset}
            variant="secondary"
            className="bg-red-100 hover:bg-red-200 text-red-800"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
} 