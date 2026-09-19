import { CalendarPlus2, Check, Send, UserPlus } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ActivityEvent } from '@/types';

const activityConfig = {
  'candidate-added': UserPlus,
  'interview-scheduled': CalendarPlus2,
  'offer-sent': Send,
  'candidate-hired': Check,
} satisfies Record<ActivityEvent['type'], typeof Check>;

const toneClasses = {
  neutral: 'bg-status-neutral/12 text-status-neutral',
  warning: 'bg-status-warning/12 text-status-warning',
  success: 'bg-status-success/12 text-status-success',
  danger: 'bg-status-danger/12 text-status-danger',
} satisfies Record<ActivityEvent['tone'], string>;

function ActivityItem({ event, isLast }: { event: ActivityEvent; isLast: boolean }) {
  const Icon = activityConfig[event.type];

  return (
    <li className="relative flex gap-3 px-4 py-3.5 sm:px-5">
      {!isLast ? <span className="absolute bottom-[-0.875rem] left-[2.05rem] top-11 w-px bg-border sm:left-[2.3rem]" aria-hidden="true" /> : null}
      <span className={cn('relative z-10 grid size-9 shrink-0 place-items-center rounded-full', toneClasses[event.tone])}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm leading-5">{event.description}</p>
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">{event.timestamp}</p>
      </div>
      <span className={cn('mt-2 size-2 shrink-0 rounded-full', toneClasses[event.tone])} aria-label={`${event.tone} status`} />
    </li>
  );
}

export { ActivityItem };
