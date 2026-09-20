import { Suspense } from 'react';
import { CheckEmailCard } from '@/components/auth/check-email-card';

export default function CheckEmailPage() {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}><CheckEmailCard /></Suspense>;
}
