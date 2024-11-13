import React, { Component, ErrorInfo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    analyticsService.trackError(error, {
      context: errorInfo,
      severity: 'high'
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="p-6 max-w-md mx-auto mt-8">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            We're sorry, but an error occurred. Please try again.
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
} 