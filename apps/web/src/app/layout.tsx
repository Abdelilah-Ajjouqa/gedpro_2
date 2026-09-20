import type { Metadata } from 'next';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

import './globals.css';

export const metadata: Metadata = {
  title: 'GEDPro',
  description: 'A focused workspace for modern recruitment teams.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider><TooltipProvider>{children}</TooltipProvider></AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
