import { AppShell } from '@/components/app-shell/app-shell';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { QueryProvider } from '@/components/providers/query-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Suspense } from 'react';

export default function Home() {
  return (
    <ProtectedRoute><AppShell>
      <main className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <QueryProvider><Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-muted" />}><DashboardClient /></Suspense></QueryProvider>
      </main>
    </AppShell></ProtectedRoute>
  );
}
