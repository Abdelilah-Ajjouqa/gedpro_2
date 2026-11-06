'use client';

import { ChevronDown, Layers, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import {
  isRouteActive,
  releasedRoutesByGroup,
  type NavigationRoute,
} from '@/shared/navigation/routes';

function NavLink({
  href,
  label,
  icon: Icon,
  mobile = false,
}: NavigationRoute & { mobile?: boolean }) {
  const pathname = usePathname();
  const active = isRouteActive(pathname, href);
  const link = (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring outline-none',
        mobile ? 'px-3 py-2.5' : 'px-3 py-2',
        active
          ? 'bg-foreground text-background shadow-xs font-semibold'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );

  return mobile ? <SheetClose asChild>{link}</SheetClose> : link;
}

function OperationsMenu({ items }: { items: readonly NavigationRoute[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;

  const isOperationsActive = items.some((item) =>
    isRouteActive(pathname, item.href),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-haspopup="menu"
          aria-label="Operations menu"
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring outline-none cursor-pointer',
            isOperationsActive
              ? 'bg-foreground text-background shadow-xs font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Layers className="size-4 shrink-0" aria-hidden="true" />
          <span>Operations</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Operations & Documents</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link
              href={item.href}
              className={cn(
                'flex w-full items-center gap-2.5 cursor-pointer',
                isRouteActive(pathname, item.href) &&
                  'font-semibold text-foreground',
              )}
            >
              <item.icon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SettingsMenu() {
  const pathname = usePathname();
  const { capabilities } = useAuth();
  const { settings } = releasedRoutesByGroup(capabilities);

  if (settings.length === 0) return null;

  const isSettingsActive = settings.some((route) =>
    isRouteActive(pathname, route.href),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-9 gap-1.5 px-2.5 text-sm font-medium transition-colors',
            isSettingsActive
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
          aria-label="Settings and administration"
        >
          <Settings className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Settings</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Workspace settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {settings.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link
              href={item.href}
              className={cn(
                'flex w-full items-center gap-2 cursor-pointer',
                isRouteActive(pathname, item.href) &&
                  'font-semibold text-foreground',
              )}
            >
              <item.icon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PrimaryNav() {
  const { capabilities } = useAuth();
  const { work, operations, insights } = releasedRoutesByGroup(capabilities);

  return (
    <nav
      className="hidden items-center gap-1 lg:flex"
      aria-label="Primary navigation"
    >
      {work.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
      <OperationsMenu items={operations} />
      {insights.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </nav>
  );
}

function MobileNav() {
  const { capabilities } = useAuth();
  const { work, operations, insights, settings } =
    releasedRoutesByGroup(capabilities);

  const sections = [
    { title: 'Hiring & Work', items: work },
    { title: 'Operations', items: operations },
    { title: 'Insights', items: insights },
    { title: 'Settings & Admin', items: settings },
  ].filter((section) => section.items.length > 0);

  return (
    <nav
      className="mt-6 flex flex-1 flex-col gap-5 overflow-y-auto pr-1"
      aria-label="Mobile navigation"
    >
      {sections.map((section) => (
        <div key={section.title} className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          <div className="grid gap-0.5">
            {section.items.map((item) => (
              <NavLink key={item.href} {...item} mobile />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export { MobileNav, PrimaryNav, SettingsMenu };
