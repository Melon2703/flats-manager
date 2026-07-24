'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';

export default function HeaderNav({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useLanguage();
  const pathname = usePathname();

  return (
    <div className="app-viewport">
      {/* Top Header with App Logo & Language Switcher */}
      <header className="top-header">
        <div className="header-brand">
          <span className="brand-logo">🏢</span>
          <div>
            <h1 className="header-title">{t('appTitle')}</h1>
            <p className="header-subtitle">{t('appSubtitle')}</p>
          </div>
        </div>

        <div className="lang-switcher" aria-label="Language selection">
          <button
            type="button"
            className={`lang-btn ${lang === 'ru' ? 'active' : ''}`}
            onClick={() => setLang('ru')}
          >
            🇷🇺 RU
          </button>
          <button
            type="button"
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
          >
            🇬🇧 EN
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="twa-container">{children}</main>

      {/* Touch-optimized Bottom Navigation */}
      <nav className="bottom-nav">
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          <span>{t('flats')}</span>
        </Link>
        <Link href="/payments" className={`nav-link ${pathname === '/payments' ? 'active' : ''}`}>
          <span className="nav-icon">💳</span>
          <span>{t('ledger')}</span>
        </Link>
        <Link href="/settlement" className={`nav-link ${pathname === '/settlement' ? 'active' : ''}`}>
          <span className="nav-icon">🧮</span>
          <span>{t('settlement')}</span>
        </Link>
        <Link href="/inspections" className={`nav-link ${pathname.startsWith('/inspections') ? 'active' : ''}`}>
          <span className="nav-icon">📋</span>
          <span>{t('checklist')}</span>
        </Link>
      </nav>
    </div>
  );
}
