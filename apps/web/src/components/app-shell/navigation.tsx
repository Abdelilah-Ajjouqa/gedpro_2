'use client';

import { BriefcaseBusiness, CalendarDays, FileText, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navigation = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/candidates', label: 'Candidates', icon: Users },
  { href: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { href: '/interviews', label: 'Interviews', icon: CalendarDays },
  { href: '/documents', label: 'Documents', icon: FileText },
];

function NavLink({ href, label, icon: Icon, mobile = false }: (typeof navigation)[number] & { mobile?: boolean }) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === href : pathname.startsWith(href);
  const link = (
    <Link href={href} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring', mobile ? 'px-3 py-3' : 'px-3 py-2', active ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );

  return mobile ? <SheetClose asChild>{link}</SheetClose> : link;
}

function PrimaryNav() {
  return <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary navigation">{navigation.map((item) => <NavLink key={item.href} {...item} />)}</nav>;
}

function MobileNav() {
  return <nav className="mt-8 grid gap-1" aria-label="Mobile navigation">{navigation.map((item) => <NavLink key={item.href} {...item} mobile />)}</nav>;
}

export { MobileNav, PrimaryNav };
