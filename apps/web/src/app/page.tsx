import { AppShell } from '@/components/app-shell/app-shell';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { QueryProvider } from '@/components/providers/query-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Suspense } from 'react';

export default function Home() {
  return (
    <ProtectedRoute><AppShell>
      <a className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow-md focus:not-sr-only" href="#main-content">Skip to main content</a>
      <main id="main-content" className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8" tabIndex={-1}>
        <QueryProvider><Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-muted" role="status"><span className="sr-only">Loading dashboard</span></div>}><DashboardClient /></Suspense></QueryProvider>
      </main>
    </AppShell></ProtectedRoute>
  );
}
