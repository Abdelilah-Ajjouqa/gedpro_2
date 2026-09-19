import type { ReactNode } from 'react';

import { AppHeader } from '@/components/app-shell/app-header';

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-background">
      <AppHeader />
      {children}
    </div>
  );
}

export { AppShell };
