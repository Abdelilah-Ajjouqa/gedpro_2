import type { ReactNode } from 'react';

import { AppHeader } from '@/components/app-shell/app-header';

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-background">
      <a
        className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow-md focus:not-sr-only"
        href="#main-content"
      >
        Skip to main content
      </a>
      <AppHeader />
      {children}
    </div>
  );
}

export { AppShell };
