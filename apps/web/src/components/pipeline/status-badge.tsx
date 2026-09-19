import { candidateStatusConfig } from '@/config';
import { cn } from '@/lib/utils';
import type { CandidateStatus, StatusTone } from '@/types';

const toneStyles = {
  neutral: 'bg-secondary text-status-neutral',
  warning: 'bg-status-warning/12 text-status-warning',
  success: 'bg-status-success/12 text-status-success',
  danger: 'bg-status-danger/12 text-status-danger',
} satisfies Record<StatusTone, string>;

function StatusBadge({ status }: { status: CandidateStatus }) {
  const definition = candidateStatusConfig[status];
  const Icon = definition.icon;

  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-[10px] font-semibold', toneStyles[definition.tone])}>
      {Icon ? <Icon className="size-3" strokeWidth={2.2} aria-hidden="true" /> : null}
      {definition.label}
    </span>
  );
}

export { StatusBadge };
