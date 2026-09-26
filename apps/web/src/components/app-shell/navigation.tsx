'use client';

import {
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  FileText,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Settings,
  UserRoundSearch,
  Users,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

const navigation = [
  {
    href: '/settings/users',
    label: 'Administration',
    icon: ShieldCheck,
    capability: 'users:manage',
    available: true,
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
    capability: 'reports:read',
    available: true,
  },
  {
    href: '/communications',
    label: 'Communications',
    icon: Mail,
    capability: 'communications:read',
    available: true,
  },
  {
    href: '/forms',
    label: 'Forms',
    icon: ClipboardList,
    capability: 'forms:read',
    available: true,
  },
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    capability: 'dashboard:view',
    available: true,
  },
  {
    href: '/candidates',
    label: 'Candidates',
    icon: Users,
    capability: 'candidates:read',
    available: true,
  },
  {
    href: '/jobs',
    label: 'Jobs',
    icon: BriefcaseBusiness,
    capability: 'jobs:read',
    available: true,
  },
  {
    href: '/applications',
    label: 'Applications',
    icon: UserRoundSearch,
    capability: 'applications:read',
    available: true,
  },
  {
    href: '/interviews',
    label: 'Interviews',
    icon: CalendarDays,
    capability: 'interviews:read',
    available: true,
  },
  {
    href: '/documents',
    label: 'Documents',
    icon: FileText,
    capability: 'documents:list',
    available: true,
  },
  {
    href: '/settings/pipelines',
    label: 'Pipelines',
    icon: Settings,
    capability: 'pipelines:read',
    available: true,
  },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  mobile = false,
}: (typeof navigation)[number] & { mobile?: boolean }) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === href : pathname.startsWith(href);
  const link = (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring',
        mobile ? 'px-3 py-3' : 'px-3 py-2',
        active
          ? 'bg-foreground text-background shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );

  return mobile ? <SheetClose asChild>{link}</SheetClose> : link;
}

function PrimaryNav() {
  const { hasCapability } = useAuth();
  return (
    <nav
      className="hidden items-center gap-1 xl:flex"
      aria-label="Primary navigation"
    >
      {navigation
        .filter((item) => item.available && hasCapability(item.capability))
        .map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
    </nav>
  );
}

function MobileNav() {
  const { hasCapability } = useAuth();
  return (
    <nav className="mt-8 grid gap-1" aria-label="Mobile navigation">
      {navigation
        .filter((item) => item.available && hasCapability(item.capability))
        .map((item) => (
          <NavLink key={item.href} {...item} mobile />
        ))}
    </nav>
  );
}

export { MobileNav, PrimaryNav };
