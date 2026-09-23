import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type PanelHeaderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
};

function PanelHeader({
  title,
  description,
  icon: Icon,
  action,
}: PanelHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-[-0.015em]">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </header>
  );
}

export { PanelHeader };
