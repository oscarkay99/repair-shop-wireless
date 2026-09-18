import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50 text-slate-950">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <TriangleAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-bold">Wireless couldn't finish loading</h1>
          <p className="mt-2 text-sm text-slate-600">
            A browser or network feature failed unexpectedly. Reload the app to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload app
          </button>
        </section>
      </main>
    );
  }
}
