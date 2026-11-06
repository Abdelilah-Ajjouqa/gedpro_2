import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function CandidatesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute capability="candidates:read">
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
