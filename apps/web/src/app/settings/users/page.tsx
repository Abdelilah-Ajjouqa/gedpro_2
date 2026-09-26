import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { AdminOnly, UsersDirectoryPage } from '@/features/users/users-page';
export default function Page() {
  return (
    <AdminOnly>
      <AppShell>
        <Suspense fallback={<main className="p-8">Loading users…</main>}>
          <UsersDirectoryPage />
        </Suspense>
      </AppShell>
    </AdminOnly>
  );
}
