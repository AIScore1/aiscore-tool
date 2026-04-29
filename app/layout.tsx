import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Score — Internal Tool',
  description: 'GEO audit, AI Visibility Improver and lead engine for aiscore.co.za',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}
