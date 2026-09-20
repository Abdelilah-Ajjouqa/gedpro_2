import { AlertCircle, Inbox, LockKeyhole, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

const icons = { empty: Inbox, error: AlertCircle, forbidden: LockKeyhole, 'not-found': SearchX };
export function AsyncState({ kind, title, description, action }: { kind: keyof typeof icons; title: string; description?: string; action?: { label: string; onClick(): void } }) { const Icon = icons[kind]; return <section className="rounded-xl border border-border bg-card p-8 text-center" role={kind === 'error' ? 'alert' : 'status'}><Icon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" /><h2 className="mt-3 text-lg font-semibold">{title}</h2>{description ? <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">{description}</p> : null}{action ? <Button className="mt-4" variant="outline" onClick={action.onClick}>{action.label}</Button> : null}</section>; }
export function LoadingState({ label = 'Loading', children }: { label?: string; children?: ReactNode }) { return <div aria-busy="true" role="status"><span className="sr-only">{label}</span>{children ?? <div className="h-32 animate-pulse rounded-xl bg-muted" aria-hidden="true" />}</div>; }
