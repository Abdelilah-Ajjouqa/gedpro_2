'use client';

import { LogOut, Menu, Search, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';

import { MobileNav, PrimaryNav } from '@/components/app-shell/navigation';
import { ThemeToggle } from '@/components/app-shell/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function Brand() {
  return <Link href="/" className="flex shrink-0 items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-ring" aria-label="GEDPro dashboard"><span className="grid size-9 place-items-center rounded-lg bg-foreground text-sm font-black tracking-[-0.08em] text-background">GP</span><span className="hidden leading-none sm:block"><span className="block text-base font-bold tracking-[-0.04em]">GEDPro</span><span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Recruitment workspace</span></span></Link>;
}

function SearchAction() {
  return <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Search candidates, jobs, and documents"><Search className="size-4" /></Button></TooltipTrigger><TooltipContent>Search</TooltipContent></Tooltip>;
}

function UserMenu() {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-10 gap-2 px-1.5 sm:pr-3" aria-label="Open user menu"><Avatar src="/assets/avatars/alex-morgan.jpg" firstName="Alex" lastName="Morgan" size={28} /><span className="hidden text-left lg:block"><span className="block text-xs font-semibold">Alex Morgan</span><span className="block text-[10px] text-muted-foreground">Hiring manager</span></span></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuLabel>My account</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem><UserRound className="size-4" />Profile</DropdownMenuItem><DropdownMenuItem><Settings className="size-4" />Settings</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem><LogOut className="size-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

function AppHeader() {
  return <header className="flex h-16 items-center justify-between gap-3 border-b border-border px-4 sm:px-6 lg:h-[4.5rem] lg:px-8"><Brand /><PrimaryNav /><div className="flex items-center gap-0.5"><SearchAction /><ThemeToggle /><UserMenu /><Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open navigation"><Menu className="size-5" /></Button></SheetTrigger><SheetContent><SheetTitle className="text-lg font-bold tracking-[-0.03em]">GEDPro</SheetTitle><SheetDescription className="mt-1 text-sm text-muted-foreground">Recruitment workspace</SheetDescription><MobileNav /><div className="mt-auto border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">Manage candidates, interviews, jobs, and documents from one focused workspace.</div></SheetContent></Sheet></div></header>;
}

export { AppHeader };
