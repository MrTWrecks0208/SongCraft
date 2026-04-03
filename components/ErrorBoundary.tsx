import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { children } = (this as any).props;
    if ((this as any).state.hasError) {
      let errorMessage = "Something went wrong. Please try refreshing the page.";
      
      try {
        if ((this as any).state.error?.message) {
          const parsedError = JSON.parse((this as any).state.error.message);
          if (parsedError.error && parsedError.error.includes('insufficient permissions')) {
            errorMessage = "You don't have permission to perform this action. Please make sure you are signed in correctly.";
          }
        }
      } catch (e) {
        // Not a JSON error message, ignore
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 text-center">
          <div className="max-w-md w-full bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Oops!</h2>
            <p className="text-gray-400 mb-8">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full p-4 bg-[#1d2951] text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
