import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import './mobile.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'LIONESS Prime',
  description: 'Sistema de gestão do estúdio LIONESS Prime',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-black text-white font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
