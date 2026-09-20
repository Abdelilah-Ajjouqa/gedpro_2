'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6">
      <section className="max-w-md text-center" role="alert">
        <AlertCircle className="mx-auto size-10 text-destructive" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">The workspace could not be displayed. Your data has not been changed.</p>
        <Button className="mt-6" onClick={reset}><RefreshCw className="size-4" aria-hidden="true" />Try again</Button>
      </section>
    </main>
  );
}
