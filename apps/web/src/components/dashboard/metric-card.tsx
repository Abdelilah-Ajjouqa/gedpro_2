import { cn } from '@/lib/utils';
import type { DashboardMetric } from '@/types';

const toneStyles = {
  neutral: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary/12 text-primary',
  success: 'bg-status-success/12 text-status-success',
  warning: 'bg-status-warning/14 text-status-warning',
} satisfies Record<DashboardMetric['tone'], string>;

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metric.icon;

  return (
    <article
      className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm sm:p-5"
      aria-label={`${metric.label}: ${metric.value.toLocaleString()}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">
          {metric.label}
        </p>
        <p
          className="mt-2 truncate text-2xl font-semibold tabular-nums tracking-[-0.045em] sm:text-3xl"
          title={metric.value.toLocaleString()}
        >
          {metric.value.toLocaleString()}
        </p>
        <p
          className="mt-1.5 truncate text-[11px] text-muted-foreground sm:text-xs"
          title={metric.helperText}
        >
          {metric.helperText}
        </p>
      </div>
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-lg sm:size-10',
          toneStyles[metric.tone],
        )}
        aria-hidden="true"
      >
        <Icon className="size-4 sm:size-[1.125rem]" strokeWidth={1.8} />
      </span>
    </article>
  );
}

export { MetricCard };
