import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { PageTitleProvider, usePageTitle } from '@/context/PageTitleContext';

interface ErrorBoundaryState { error: Error | null }

class PageErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PageErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'hsl(354 60% 95%)' }}>
            <span className="text-2xl" style={{ color: 'hsl(354 60% 35%)' }}>!</span>
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>Something went wrong</p>
          <p className="text-xs mb-4 max-w-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ShellInner() {
  const { pageTitle } = usePageTitle();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dismiss the mobile drawer on every navigation, not just an explicit close.
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar title={pageTitle.title} subtitle={pageTitle.subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <PageErrorBoundary key={pathname}>
            <Outlet />
          </PageErrorBoundary>
        </div>
      </main>
    </div>
  );
}

export default function AppShell() {
  return (
    <PageTitleProvider>
      <ShellInner />
    </PageTitleProvider>
  );
}
