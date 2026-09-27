import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Mail,
  Settings,
  ShieldCheck,
  UserRoundSearch,
  Users,
} from 'lucide-react';

export type NavigationGroup = 'Work' | 'Operations' | 'Insights' | 'Settings';

export type NavigationRoute = {
  href: string;
  label: string;
  capability: string;
  icon: LucideIcon;
  group?: NavigationGroup;
};

/** The single source of truth for released destinations in desktop and mobile navigation. */
export const navigationRoutes: readonly NavigationRoute[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    capability: 'dashboard:view',
  },
  {
    href: '/candidates',
    label: 'Candidates',
    icon: Users,
    capability: 'candidates:read',
    group: 'Work',
  },
  {
    href: '/jobs',
    label: 'Jobs',
    icon: BriefcaseBusiness,
    capability: 'jobs:read',
    group: 'Work',
  },
  {
    href: '/applications',
    label: 'Applications',
    icon: UserRoundSearch,
    capability: 'applications:read',
    group: 'Work',
  },
  {
    href: '/interviews',
    label: 'Interviews',
    icon: CalendarDays,
    capability: 'interviews:read',
    group: 'Work',
  },
  {
    href: '/documents',
    label: 'Documents',
    icon: FileText,
    capability: 'documents:list',
    group: 'Operations',
  },
  {
    href: '/forms',
    label: 'Forms',
    icon: ClipboardList,
    capability: 'forms:read',
    group: 'Operations',
  },
  {
    href: '/communications',
    label: 'Communications',
    icon: Mail,
    capability: 'communications:read',
    group: 'Operations',
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
    capability: 'reports:read',
    group: 'Insights',
  },
  {
    href: '/settings/pipelines',
    label: 'Pipelines',
    icon: Settings,
    capability: 'pipelines:read',
    group: 'Settings',
  },
  {
    href: '/settings/scorecard-templates',
    label: 'Scorecard templates',
    icon: ClipboardList,
    capability: 'scorecard-templates:read',
    group: 'Settings',
  },
  {
    href: '/settings/users',
    label: 'Users',
    icon: ShieldCheck,
    capability: 'users:manage',
    group: 'Settings',
  },
] as const;

export function isRouteActive(pathname: string, href: string) {
  return href === '/'
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function releasedRoutesFor(capabilities: readonly string[]) {
  return navigationRoutes.filter((route) =>
    capabilities.includes(route.capability),
  );
}
