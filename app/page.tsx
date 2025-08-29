'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Home() {
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const r = await fetch('/api/dates', { cache: 'no-store' }).then(res => res.json());
        if (on && r?.ok) setDates(r.dates || []);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  return (
    <div className="ptb-card">
      <h1 style={{ marginTop: 0 }}>Какво е това</h1>
      <p style={{ color: 'var(--ptb-muted)' }}>
        Анкета за оценка на представянето по мачове + агрегирани справки по играчи и дати.

        Някои биха казали BIG DATA анализи. Други биха казали BULLSHIT.
      </p>

      <div className="ptb-actions" style={{ margin: '12px 0 20px' }}>
        <Link href="/evaluate" className="ptb-btn">Оцени играчи</Link>
        <Link href="/results" className="ptb-btn secondary">Резултати по дата</Link>
        <Link href="/all-time" className="ptb-btn secondary">All time</Link>
      </div>

      <h2 style={{ marginBottom: 8 }}>Архив по дати</h2>
      {loading ? (
        <div style={{ color: 'var(--ptb-muted)' }}>Зареждане…</div>
      ) : dates.length ? (
        <ul className="ptb-list">
          {dates.map(d => (
            <li key={d}>
              <Link href={`/results?date=${encodeURIComponent(d)}`}>{d}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ color: 'var(--ptb-muted)' }}>Няма данни.</div>
      )}
    </div>
  );
}
