import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { PageTitleProvider, usePageTitle } from '@/context/PageTitleContext';
import { useState } from 'react';

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
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(224,90,43,0.1)' }}>
            <i className="ri-error-warning-line text-2xl" style={{ color: '#E05A2B' }} />
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">Something went wrong</p>
          <p className="text-xs text-slate-400 mb-4 max-w-xs">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
            style={{ background: '#DC1F1F' }}
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
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--shell-bg)' }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ marginLeft: sidebarWidth, transition: 'margin-left 300ms ease' }}
      >
        <TopBar
          title={pageTitle.title}
          subtitle={pageTitle.subtitle}
        />
        <main className="flex-1 p-6">
          <PageErrorBoundary key={pathname}>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
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
