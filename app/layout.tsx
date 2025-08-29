import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Park the Bus – Player ratings',
  description: 'Oценки на представянето по мачове и агрегирани статистики.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body>
        <header className="ptb-header">
          <div className="ptb-header__inner">
            <div className="ptb-brand">
              <img src="/logo.svg" alt="Park the Bus" className="ptb-logo" />
              <span className="ptb-title">Park the Bus – Player ratings</span>
            </div>
            <nav className="ptb-nav">
              <Link href="/">Начало</Link>
              <Link href="/evaluate">Оцени</Link>
              <Link href="/results">Резултати по дати</Link>
              <Link href="/all-time">All time</Link>
            </nav>
          </div>
        </header>
        <main className="ptb-main">{children}</main>
      </body>
    </html>
  );
}
