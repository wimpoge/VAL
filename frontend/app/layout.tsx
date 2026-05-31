import type { Metadata, Viewport } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VAL — Visual AI Learning',
  description: '20 days · 100 nodes · learn AI engineering visually',
  applicationName: 'VAL',
  manifest: '/favicon_io/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0c0a09',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${serif.variable}`}
    >
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <Navbar />
        <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-3xl px-6 pb-12 pt-10 text-center text-xs text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />{' '}
          VAL — Visual AI Learning · Editorial edition
        </footer>
      </body>
    </html>
  );
}
