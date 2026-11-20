import React, { Component } from 'react';
import { Button } from '../components/ui/Button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface text-on-surface">
          <div className="max-w-md w-full p-8 rounded-2xl border border-error/30 bg-surface-container text-center shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface">
              Something went wrong
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              An unexpected error occurred while rendering this page.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-surface-container-lowest p-3 rounded-lg overflow-x-auto text-error text-start font-mono">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="pt-2">
              <Button
                variant="primary-gradient"
                size="md"
                onClick={this.handleReset}
                iconLeading={<span className="material-symbols-outlined text-[18px]">refresh</span>}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
