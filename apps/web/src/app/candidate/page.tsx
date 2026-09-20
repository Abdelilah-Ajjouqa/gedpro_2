import { ProtectedRoute } from '@/components/auth/protected-route';

export default function CandidatePage() {
  return <ProtectedRoute allowedRoles={['candidate']}><main className="grid min-h-dvh place-items-center bg-background p-6"><section className="max-w-lg text-center"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Candidate workspace</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Your workspace is coming soon</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your account is active. Candidate applications, forms, documents, communication preferences, and visible timeline events will appear here as those product phases are delivered.</p></section></main></ProtectedRoute>;
}
