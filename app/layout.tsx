import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { SettingsProvider } from '@/lib/SettingsContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'LPE - Lioness Personal Estúdio',
  description: 'Sistema de Gestão Profissional para Personal Trainers',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body suppressHydrationWarning className="font-sans antialiased">
        <SettingsProvider>
          {children}
          <Toaster position="top-right" richColors theme="dark" />
        </SettingsProvider>
      </body>
    </html>
  );
}
