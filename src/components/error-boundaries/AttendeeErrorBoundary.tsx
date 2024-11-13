import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface Props {
  children: React.ReactNode;
  eventId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class AttendeeErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo
    });

    analyticsService.trackError(error, {
      context: 'attendee_flow',
      eventId: this.props.eventId,
      componentStack: errorInfo.componentStack
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    analyticsService.trackEvent('error_boundary_retry', {
      context: 'attendee_flow',
      eventId: this.props.eventId
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 max-w-md mx-auto mt-8">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            We're sorry, but something went wrong. Please try again.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="bg-gray-100 p-4 rounded mb-4 overflow-auto text-sm">
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack}
            </pre>
          )}
          <Button onClick={this.handleRetry}>Try Again</Button>
        </Card>
      );
    }

    return this.props.children;
  }
} 