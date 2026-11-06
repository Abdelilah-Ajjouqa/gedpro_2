import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function FormsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute capability="forms:read">
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
