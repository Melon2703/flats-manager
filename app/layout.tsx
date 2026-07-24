import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Flats Manager - Rental Back Office',
  description: 'Digital rental back-office management for flats and tenancies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body>
        <div className="twa-container">{children}</div>

        <nav className="bottom-nav">
          <Link href="/" className="nav-link">
            <span>🏠</span>
            <span>Flats</span>
          </Link>
          <Link href="/payments" className="nav-link">
            <span>💳</span>
            <span>Ledger</span>
          </Link>
          <Link href="/settlement" className="nav-link">
            <span>🧮</span>
            <span>Settlement</span>
          </Link>
          <Link href="/inspections/new" className="nav-link">
            <span>📋</span>
            <span>Checklist</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
