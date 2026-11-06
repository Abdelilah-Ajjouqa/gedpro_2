import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DecisionPage } from '@/features/interviews/decision-page';

export default async function Page({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return (
    <ProtectedRoute capability="applications:read">
      <AppShell>
        <DecisionPage applicationId={Number(applicationId)} />
      </AppShell>
    </ProtectedRoute>
  );
}
