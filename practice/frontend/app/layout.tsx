import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VAL Practice',
  description: 'Hands-on experiments for Day 11-20 of the AI Engineer Roadmap.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
