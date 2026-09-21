import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ApplicationWorkspace } from '@/features/applications/application-workspace';
export default async function Page({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return (
    <ProtectedRoute capability="applications:read">
      <AppShell>
        <ApplicationWorkspace id={Number(applicationId)} />
      </AppShell>
    </ProtectedRoute>
  );
}
