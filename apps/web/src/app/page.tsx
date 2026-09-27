import { AppShell } from '@/components/app-shell/app-shell';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Suspense } from 'react';

export default function Home() {
  return (
    <ProtectedRoute>
      <AppShell>
        <main
          id="main-content"
          className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
          tabIndex={-1}
        >
          <Suspense
            fallback={
              <div
                className="h-80 animate-pulse rounded-xl bg-muted"
                role="status"
              >
                <span className="sr-only">Loading dashboard</span>
              </div>
            }
          >
            <DashboardClient />
          </Suspense>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
