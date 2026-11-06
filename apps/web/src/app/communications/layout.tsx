import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function CommunicationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute capability="communications:read">
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
