import { Component, type ReactNode } from 'react';
import { RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card m-6 flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Something went wrong loading {this.props.label ?? 'this section'}.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="pill-button inline-flex items-center gap-2 border border-border bg-card text-sm text-foreground"
          >
            <RefreshCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
