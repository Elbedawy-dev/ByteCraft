import React, { Component } from 'react';
import { Button } from '../components/ui/Button';
import { HeroCubes } from '../components/shared/HeroCubes';

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
        <div className="min-h-screen bc-hero-wash relative overflow-hidden flex items-center justify-center p-6 text-on-surface">
          <div
            aria-hidden="true"
            className="hidden lg:block pointer-events-none select-none absolute bottom-8 end-10 w-56 opacity-80 rtl:-scale-x-100"
          >
            <HeroCubes className="w-full h-auto" />
          </div>

          <div className="relative z-10 max-w-md w-full p-8 rounded-2xl border border-card-border bg-card text-center shadow-card space-y-4">
            <div className="w-14 h-14 rounded-xl bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-rounded text-[30px]">error</span>
            </div>
            <h2 className="text-xl font-extrabold text-on-surface">
              Something went wrong
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              An unexpected error occurred while rendering this page.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-surface-soft border border-card-border p-3 rounded-lg overflow-x-auto text-error text-start font-mono">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="pt-2">
              <Button
                variant="primary-gradient"
                size="md"
                onClick={this.handleReset}
                iconLeading={<span className="material-symbols-rounded text-[18px]">refresh</span>}
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
