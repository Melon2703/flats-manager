import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';
import HeaderNav from './components/HeaderNav';

export const metadata: Metadata = {
  title: 'Flats Manager - Digital Rental Back Office',
  description: 'Digital rental back-office management for flats and tenancies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body>
        <LanguageProvider>
          <HeaderNav>{children}</HeaderNav>
        </LanguageProvider>
      </body>
    </html>
  );
}
