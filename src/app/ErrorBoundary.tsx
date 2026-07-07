import { Component, type ReactNode } from 'react';
import { translate } from '@/i18n/messages';
import { useStore } from '@/store/useStore';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8">
          <h1 className="text-xl font-semibold text-bad">{translate(useStore.getState().settings.lang, 'error.title')}</h1>
          <pre className="mt-2 text-sm text-muted">{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
