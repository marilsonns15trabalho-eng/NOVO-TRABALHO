import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'My Google AI Studio App',
  description: 'My Google AI Studio App',
};

import { SettingsProvider } from '@/lib/SettingsContext';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
