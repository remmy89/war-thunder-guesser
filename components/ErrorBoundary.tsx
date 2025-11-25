import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1a1a1a] border border-red-900 rounded-sm p-8 text-center">
            <div className="inline-block p-4 rounded-full bg-red-500/20 mb-4">
              <AlertOctagon className="w-12 h-12 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-black text-red-500 mb-2">SYSTEM MALFUNCTION</h2>
            <p className="text-gray-400 font-mono text-sm mb-6">
              A critical error has occurred in the targeting system.
            </p>
            
            {this.state.error && (
              <div className="bg-black/50 p-3 rounded-sm mb-6 text-left overflow-auto max-h-32">
                <code className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}
            
            <button
              onClick={this.handleReset}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-sm flex items-center justify-center mx-auto space-x-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>REBOOT SYSTEM</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
