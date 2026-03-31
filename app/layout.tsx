import type { Metadata, Viewport } from 'next';
import './globals.css';
import './mobile.css';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import AppPermissionsPrompt from '@/components/app/AppPermissionsPrompt';
import AppUpdatePrompt from '@/components/app/AppUpdatePrompt';
import AppModeDetector from '@/components/AppModeDetector';

export const metadata: Metadata = {
  title: 'Lioness Personal Estudio',
  description: 'Gestao integrada para administracao, professor e aluno.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className="bg-black text-white antialiased selection:bg-orange-500 selection:text-black"
        suppressHydrationWarning
      >
        <AppModeDetector />
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <AppPermissionsPrompt />
            <AppUpdatePrompt />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
