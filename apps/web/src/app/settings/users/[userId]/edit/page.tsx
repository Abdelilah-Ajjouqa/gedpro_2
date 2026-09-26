import { AppShell } from '@/components/app-shell/app-shell';
import { AdminOnly, UserEditPage } from '@/features/users/users-page';
export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return (
    <AdminOnly>
      <AppShell>
        <UserEditPage id={Number(userId)} />
      </AppShell>
    </AdminOnly>
  );
}
