import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'LIONESS FIT | Performance Curated',
  description: 'A premium, editorial fitness atelier.',
};

import { ToastProvider } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdMobProvider } from '@/components/AdMobProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable} bg-[#0c0a09]`} style={{ backgroundColor: '#0c0a09' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="theme-color" content="#0c0a09" />
      </head>
      <body className="font-sans antialiased bg-[#0c0a09] text-[#fcf9f8] selection:bg-[#ff5f1f] selection:text-white overflow-x-hidden min-h-screen" style={{ backgroundColor: '#0c0a09' }} suppressHydrationWarning>
        <ErrorBoundary>
          <AdMobProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AdMobProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
