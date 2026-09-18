import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GEDPro',
  description: 'A focused workspace for modern recruitment teams.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
